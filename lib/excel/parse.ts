/**
 * Spreadsheet → lot rows.
 *
 * Pure and transport-agnostic: it takes a matrix of cells and returns
 * validated rows plus a per-row error list. Both the preview and the
 * commit endpoint run the exact same function, so what the client sees
 * in the preview is precisely what gets written.
 */

export type ParsedLotRow = {
  /** 1-based row number in the original sheet, header included. */
  rowNumber: number;
  lot_number: string;
  product_code: string | null;
  description: string | null;
  quantity_target: number;
  due_date: string | null;
}

export type RowError = {
  rowNumber: number;
  field: string;
  message: string;
  value?: string;
}

export type ParseResult = {
  /** Header text exactly as it appeared in the file. */
  headers: string[];
  /** canonical field -> the source header it was matched to. */
  mapping: Record<string, string | null>;
  missingRequired: string[];
  rows: ParsedLotRow[];
  errors: RowError[];
  totalDataRows: number;
}

export const MAX_ROWS = 5000;

/**
 * Header aliases. The client's sheet is not going to use our column
 * names, and asking them to rename columns before every upload is how a
 * tool stops being used. Matching is case, space and punctuation
 * insensitive.
 */
const ALIASES: Record<string, string[]> = {
  lot_number: [
    "lot number", "lot no", "lot", "lotno", "lot id", "batch", "batch no",
    "batch number", "production lot", "production lot number", "lot num",
  ],
  product_code: [
    "product code", "product", "sku", "item code", "item", "part number",
    "part no", "part code", "material code", "model code",
  ],
  description: [
    "description", "desc", "part name", "item description",
    "product description", "product name", "remarks", "details",
  ],
  quantity_target: [
    "quantity", "qty", "quantity target", "target quantity", "target qty",
    "qty required", "required qty", "units", "count", "order qty",
    "order quantity", "pcs",
  ],
  due_date: [
    "due date", "due", "required date", "delivery date", "deadline",
    "need by", "target date", "completion date", "ship date",
  ],
};

const REQUIRED = ["lot_number"];

/** "Lot  No." and "lot_no" both collapse to "lot no". */
export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[_\-./\\]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMapping(headers: unknown[]): {
  mapping: Record<string, number>;
  matched: Record<string, string | null>;
} {
  const normalized = headers.map(normalizeHeader);
  const mapping: Record<string, number> = {};
  const matched: Record<string, string | null> = {};

  for (const [field, aliases] of Object.entries(ALIASES)) {
    let index = normalized.findIndex((h) => h && aliases.includes(h));

    // Fall back to a containment match so "production lot number (mfg)"
    // still lands on lot_number.
    if (index === -1) {
      index = normalized.findIndex(
        (h) => h && aliases.some((a) => h.includes(a)),
      );
    }

    if (index !== -1) {
      mapping[field] = index;
      matched[field] = String(headers[index] ?? "").trim();
    } else {
      matched[field] = null;
    }
  }

  return { mapping, matched };
}

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

/**
 * Excel stores dates as a day count. read-excel-file hands those back as
 * plain numbers when the sheet carries no explicit date formatting, so a
 * numeric cell in a date column has to be interpreted rather than
 * rejected.
 */
function fromExcelSerial(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2_958_465) return null;
  const ms = EXCEL_EPOCH_UTC + Math.round(serial) * 86_400_000;
  return toIsoDate(new Date(ms));
}

function toIsoDate(d: Date): string | null {
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Accepts Date objects, Excel serials, ISO, and DD/MM/YYYY. */
export function parseDueDate(value: unknown): string | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) return toIsoDate(value) ?? "invalid";

  if (typeof value === "number") return fromExcelSerial(value) ?? "invalid";

  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return toIsoDate(new Date(`${text.slice(0, 10)}T00:00:00Z`)) ?? "invalid";
  }

  // Day-first, which is what a Singapore/Malaysia production sheet uses.
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, yRaw] = dmy;
    const year = yRaw.length === 2 ? 2000 + Number(yRaw) : Number(yRaw);
    const iso = toIsoDate(new Date(Date.UTC(year, Number(m) - 1, Number(d))));
    // Reject 32/13 style overflow rather than silently rolling it over.
    if (!iso || Number(m) > 12 || Number(d) > 31) return "invalid";
    return iso;
  }

  if (/^\d+(\.\d+)?$/.test(text)) {
    return fromExcelSerial(Number(text)) ?? "invalid";
  }

  const parsed = new Date(text);
  return toIsoDate(parsed) ?? "invalid";
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

export function parseSheet(matrix: unknown[][]): ParseResult {
  const nonEmpty = matrix.filter((r) =>
    r.some((c) => cellText(c).length > 0),
  );

  if (nonEmpty.length === 0) {
    return {
      headers: [],
      mapping: {},
      missingRequired: REQUIRED,
      rows: [],
      errors: [],
      totalDataRows: 0,
    };
  }

  const headerRow = nonEmpty[0];
  const headers = headerRow.map((h) => cellText(h));
  const { mapping, matched } = buildMapping(headerRow);
  const missingRequired = REQUIRED.filter((f) => !(f in mapping));

  const dataRows = nonEmpty.slice(1);
  const rows: ParsedLotRow[] = [];
  const errors: RowError[] = [];

  if (missingRequired.length > 0) {
    return {
      headers,
      mapping: matched,
      missingRequired,
      rows: [],
      errors: [],
      totalDataRows: dataRows.length,
    };
  }

  const seen = new Map<string, number>();

  dataRows.slice(0, MAX_ROWS).forEach((raw, i) => {
    // +2: one for the header, one because humans count from 1.
    const rowNumber = i + 2;
    const at = (field: string) =>
      field in mapping ? raw[mapping[field]] : undefined;

    const lotNumber = cellText(at("lot_number"));
    if (!lotNumber) {
      errors.push({
        rowNumber,
        field: "lot_number",
        message: "Lot number is required",
      });
      return;
    }

    const key = lotNumber.toUpperCase();
    if (seen.has(key)) {
      errors.push({
        rowNumber,
        field: "lot_number",
        message: `Duplicate of row ${seen.get(key)} in this file`,
        value: lotNumber,
      });
      return;
    }
    seen.set(key, rowNumber);

    // Blank quantity means one unit; a non-numeric quantity is a mistake
    // worth surfacing rather than silently defaulting.
    const qtyRaw = cellText(at("quantity_target"));
    let quantity = 1;
    if (qtyRaw) {
      const n = Number(qtyRaw.replace(/,/g, ""));
      if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
        errors.push({
          rowNumber,
          field: "quantity_target",
          message: "Quantity must be a whole number greater than zero",
          value: qtyRaw,
        });
        return;
      }
      quantity = n;
    }

    const due = parseDueDate(at("due_date"));
    if (due === "invalid") {
      errors.push({
        rowNumber,
        field: "due_date",
        message: "Could not read this as a date",
        value: cellText(at("due_date")),
      });
      return;
    }

    rows.push({
      rowNumber,
      lot_number: lotNumber.slice(0, 64),
      product_code: cellText(at("product_code")).slice(0, 64) || null,
      description: cellText(at("description")).slice(0, 240) || null,
      quantity_target: quantity,
      due_date: due,
    });
  });

  if (dataRows.length > MAX_ROWS) {
    errors.push({
      rowNumber: MAX_ROWS + 2,
      field: "file",
      message: `Only the first ${MAX_ROWS} rows were read (${dataRows.length} found)`,
    });
  }

  return {
    headers,
    mapping: matched,
    missingRequired: [],
    rows,
    errors,
    totalDataRows: dataRows.length,
  };
}
