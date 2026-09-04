/**
 * Generates the downloadable lot-import template.
 *
 * Run with `npm run make:template`. The committed .xlsx is what the
 * client downloads from /lots/import, so regenerate it if the accepted
 * columns in lib/excel/parse.ts change.
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";

const OUT = resolve(process.cwd(), "public/templates/lot-import-template.xlsx");

const COLUMNS = [
  { header: "Lot Number", key: "lot_number", width: 18 },
  { header: "Product Code", key: "product_code", width: 16 },
  { header: "Description", key: "description", width: 36 },
  { header: "Quantity", key: "quantity_target", width: 11 },
  { header: "Due Date", key: "due_date", width: 14 },
];

const SAMPLE = [
  ["LOT-2610-001", "PRD-A100", "Mounting bracket, left hand", 6, new Date(2026, 9, 15)],
  ["LOT-2610-002", "PRD-A100", "Mounting bracket, right hand", 6, new Date(2026, 9, 15)],
  ["LOT-2610-003", "PRD-B220", "Sensor housing, revision 2", 4, new Date(2026, 9, 18)],
];

async function main() {
  const book = new ExcelJS.Workbook();
  book.creator = "Printer Floor";
  book.created = new Date();

  const sheet = book.addWorksheet("Lots", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = COLUMNS;

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EEF6" },
  };

  SAMPLE.forEach((row) => sheet.addRow(row));
  sheet.getColumn("due_date").numFmt = "dd/mm/yyyy";

  const notes = book.addWorksheet("Notes");
  notes.columns = [{ width: 96 }];
  [
    "How this file is read",
    "",
    "Lot Number is the only required column. Everything else is optional.",
    "Header names are matched loosely — \"Lot No\", \"LOT_NUMBER\" and \"Batch Number\" all work.",
    "Quantity must be a whole number greater than zero. Leave it blank for a single unit.",
    "Due Date accepts dd/mm/yyyy, yyyy-mm-dd, or a real Excel date cell.",
    "Extra columns are ignored, so you can upload your existing sheet as-is.",
    "",
    "Re-uploading a file updates lots that already exist rather than duplicating them,",
    "so a corrected sheet can be uploaded again safely.",
  ].forEach((line) => notes.addRow([line]));
  notes.getRow(1).font = { bold: true };

  mkdirSync(dirname(OUT), { recursive: true });
  await book.xlsx.writeFile(OUT);
  console.log(`wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
