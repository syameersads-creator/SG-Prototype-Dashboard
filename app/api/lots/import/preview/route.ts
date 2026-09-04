import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readAndParse, REQUIRED_COLUMN_MESSAGE } from "@/lib/excel/handle-upload";

/** Rows sent back for the on-screen preview; the commit re-reads the file. */
const PREVIEW_LIMIT = 200;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const outcome = await readAndParse(request);
  if (outcome instanceof NextResponse) return outcome;

  const { file, result, sheetName, otherSheets } = outcome;

  if (result.missingRequired.length > 0) {
    return NextResponse.json(
      { error: REQUIRED_COLUMN_MESSAGE, headers: result.headers },
      { status: 422 },
    );
  }

  // Flag lots that already exist so the preview can say "update" rather
  // than "new" before anything is written.
  const lotNumbers = result.rows.map((r) => r.lot_number);
  const existing = new Set<string>();

  for (let i = 0; i < lotNumbers.length; i += 500) {
    const { data } = await supabase
      .from("lots")
      .select("lot_number")
      .in("lot_number", lotNumbers.slice(i, i + 500));
    data?.forEach((l) => existing.add(l.lot_number));
  }

  return NextResponse.json({
    filename: file.name,
    sheetName,
    otherSheets,
    headers: result.headers,
    mapping: result.mapping,
    totalDataRows: result.totalDataRows,
    validCount: result.rows.length,
    errorCount: result.errors.length,
    newCount: result.rows.filter((r) => !existing.has(r.lot_number)).length,
    updateCount: result.rows.filter((r) => existing.has(r.lot_number)).length,
    rows: result.rows.slice(0, PREVIEW_LIMIT).map((r) => ({
      ...r,
      exists: existing.has(r.lot_number),
    })),
    truncated: result.rows.length > PREVIEW_LIMIT,
    errors: result.errors.slice(0, PREVIEW_LIMIT),
  });
}
