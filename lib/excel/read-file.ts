import Papa from "papaparse";
import readXlsxFile from "read-excel-file/node";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export class UploadError extends Error {}

export interface SheetMatrix {
  name: string | null;
  matrix: unknown[][];
}

/**
 * Turn an uploaded spreadsheet into one cell matrix per worksheet.
 *
 * xlsx parsing is deliberately `read-excel-file` rather than the `xlsx`
 * package on npm: that build (0.18.5) still carries unpatched prototype
 * pollution and ReDoS advisories, and SheetJS ships fixes off-registry
 * only. This app parses untrusted uploads, so it uses a maintained
 * parse-only library instead.
 *
 * Every sheet is returned, not just the first: a production planning
 * workbook usually carries several tabs, and the lot list is rarely the
 * one that happens to be first. The caller picks.
 */
export async function readUploadedSheets(file: File): Promise<SheetMatrix[]> {
  if (file.size === 0) {
    throw new UploadError("That file is empty.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`,
    );
  }

  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
    return [{ name: null, matrix: parsed.data }];
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    let raw: unknown;
    try {
      raw = await readXlsxFile(buffer);
    } catch {
      throw new UploadError(
        "That file could not be read as a spreadsheet. If it is an older .xls file, re-save it as .xlsx.",
      );
    }
    return normalize(raw);
  }

  throw new UploadError("Unsupported file type. Upload a .xlsx or .csv file.");
}

/**
 * read-excel-file returns a bare matrix for a single-sheet workbook but
 * an array of `{ sheet, data }` once there is more than one tab. Collapse
 * both into the same shape.
 */
function normalize(raw: unknown): SheetMatrix[] {
  if (!Array.isArray(raw)) return [];

  const first = raw[0];
  if (
    first &&
    typeof first === "object" &&
    !Array.isArray(first) &&
    "data" in first
  ) {
    return (raw as { sheet?: string; data: unknown[][] }[]).map((s) => ({
      name: s.sheet ?? null,
      matrix: Array.isArray(s.data) ? s.data : [],
    }));
  }

  return [{ name: null, matrix: raw as unknown[][] }];
}
