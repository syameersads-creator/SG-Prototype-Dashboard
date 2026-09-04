import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readAndParse, REQUIRED_COLUMN_MESSAGE } from "@/lib/excel/handle-upload";

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

  const { file, result } = outcome;

  if (result.missingRequired.length > 0) {
    return NextResponse.json({ error: REQUIRED_COLUMN_MESSAGE }, { status: 422 });
  }

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: "There were no importable rows in that file." },
      { status: 422 },
    );
  }

  // import_lots() writes the audit row and every lot in one transaction,
  // and re-checks the caller's role in the database.
  const { data, error } = await supabase.rpc("import_lots", {
    p_filename: file.name,
    p_rows: result.rows.map(({ rowNumber: _rowNumber, ...lot }) => lot),
    p_errors: result.errors,
    p_total_rows: result.totalDataRows,
  });

  if (error) {
    const denied = error.code === "42501";
    return NextResponse.json(
      {
        error: denied
          ? "Your account does not have permission to import lots."
          : error.message,
      },
      { status: denied ? 403 : 500 },
    );
  }

  return NextResponse.json(data);
}
