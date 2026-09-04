import { NextResponse } from "next/server";
import { parseSheet, type ParseResult } from "./parse";
import { readUploadedSheets, UploadError } from "./read-file";

export interface UploadOutcome {
  file: File;
  result: ParseResult;
  /** Which worksheet the rows came from, when the file had several. */
  sheetName: string | null;
  otherSheets: string[];
}

/**
 * Shared front half of both import endpoints: pull the file off the
 * request, read every sheet, and pick the one that actually holds lots.
 * Preview and commit run identical parsing, so the confirmation screen
 * can never disagree with what is written.
 */
export async function readAndParse(
  request: Request,
): Promise<UploadOutcome | NextResponse> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a file upload." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was attached." }, { status: 400 });
  }

  try {
    const sheets = await readUploadedSheets(file);
    if (sheets.length === 0) {
      return NextResponse.json(
        { error: "That workbook has no readable sheets." },
        { status: 400 },
      );
    }

    const parsed = sheets.map((s) => ({ ...s, result: parseSheet(s.matrix) }));

    // Prefer a sheet that has the required column, then the one with the
    // most usable rows. A "Notes" or "Instructions" tab therefore never
    // wins over the actual lot list.
    const best =
      [...parsed]
        .filter((p) => p.result.missingRequired.length === 0)
        .sort((a, b) => b.result.rows.length - a.result.rows.length)[0] ??
      parsed[0];

    return {
      file,
      result: best.result,
      sheetName: best.name,
      otherSheets: parsed
        .map((p) => p.name)
        .filter((n): n is string => Boolean(n) && n !== best.name),
    };
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "That file could not be read." },
      { status: 400 },
    );
  }
}

export const REQUIRED_COLUMN_MESSAGE =
  "The sheet needs a lot number column. Accepted headers include \"Lot Number\", \"Lot No\", \"Batch Number\" — or download the template.";
