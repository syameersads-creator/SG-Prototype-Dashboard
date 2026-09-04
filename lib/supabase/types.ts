/**
 * Database bindings.
 *
 * Hand-maintained rather than dumped from `supabase gen types`, for two
 * reasons: the generated file types every CHECK-constrained column as a
 * bare `string`, and it carries a lot of machinery this app never uses.
 * The status unions below are the ones the schema actually enforces, so
 * the compiler catches a typo in a status literal.
 *
 * Regenerate a reference copy any time with:
 *   npx supabase gen types typescript --project-id <ref>
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export const PRINTER_STATUSES = [
  "idle",
  "printing",
  "paused",
  "error",
  "offline",
  "maintenance",
] as const;
export type PrinterStatus = (typeof PRINTER_STATUSES)[number];

export const JOB_STATUSES = [
  "queued",
  "printing",
  "paused",
  "completed",
  "failed",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const LOT_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type LotStatus = (typeof LOT_STATUSES)[number];

export type UserRole = "admin" | "operator" | "viewer";

export type PrinterRow = {
  id: string;
  name: string;
  serial: string;
  model: string;
  manufacturer: string;
  location: string | null;
  status: PrinterStatus;
  status_note: string | null;
  last_seen_at: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type LotRow = {
  id: string;
  lot_number: string;
  product_code: string | null;
  description: string | null;
  quantity_target: number;
  quantity_done: number;
  due_date: string | null;
  priority: number;
  status: LotStatus;
  import_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PrintJobRow = {
  id: string;
  printer_id: string;
  lot_id: string | null;
  job_name: string;
  status: JobStatus;
  progress_pct: number;
  layer_current: number;
  layer_total: number;
  nozzle_temp: number | null;
  bed_temp: number | null;
  filament_used_g: number;
  started_at: string;
  estimated_end_at: string | null;
  ended_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type PrinterTelemetryRow = {
  id: number;
  printer_id: string;
  job_id: string | null;
  recorded_at: string;
  progress_pct: number | null;
  nozzle_temp: number | null;
  bed_temp: number | null;
}

export type LotImportRow = {
  id: string;
  filename: string;
  uploaded_by: string | null;
  row_count: number;
  inserted_count: number;
  updated_count: number;
  error_count: number;
  errors: Json;
  created_at: string;
}

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * One row per printer with its live job and lot flattened in.
 *
 * Every row shape here is a type alias, not an interface, on purpose:
 * postgrest-js constrains them to `Record<string, unknown>`, and an
 * interface has no implicit index signature to satisfy that — declaring
 * these as interfaces silently resolves every query result to `never`.
 */
export type PrinterOverviewRow = {
  printer_id: string;
  printer_name: string;
  serial: string;
  model: string;
  manufacturer: string;
  location: string | null;
  printer_status: PrinterStatus;
  status_note: string | null;
  last_seen_at: string;
  sort_order: number;
  job_id: string | null;
  job_name: string | null;
  job_status: JobStatus | null;
  progress_pct: number | null;
  layer_current: number | null;
  layer_total: number | null;
  nozzle_temp: number | null;
  bed_temp: number | null;
  filament_used_g: number | null;
  started_at: string | null;
  estimated_end_at: string | null;
  lot_id: string | null;
  lot_number: string | null;
  product_code: string | null;
  lot_description: string | null;
  quantity_target: number | null;
  quantity_done: number | null;
  due_date: string | null;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  // supabase-js reads this to pick the right PostgREST behaviour; without
  // it the client resolves every table to `never`.
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      printers: Table<PrinterRow>;
      lots: Table<
        LotRow,
        Omit<LotRow, "id" | "created_at" | "updated_at" | "quantity_done" | "status" | "priority"> &
          Partial<Pick<LotRow, "quantity_done" | "status" | "priority">>
      >;
      print_jobs: Table<PrintJobRow>;
      printer_telemetry: Table<PrinterTelemetryRow>;
      lot_imports: Table<LotImportRow, Omit<LotImportRow, "id" | "created_at">>;
      profiles: Table<ProfileRow>;
      sim_settings: Table<{ id: boolean; enabled: boolean; updated_at: string }>;
    };
    Views: {
      printer_overview: {
        Row: PrinterOverviewRow;
        Relationships: [];
      };
    };
    Functions: {
      current_user_role: { Args: never; Returns: UserRole };
      can_write_lots: { Args: never; Returns: boolean };
      sim_set_enabled: { Args: { p_enabled: boolean }; Returns: boolean };
      sim_force_complete: { Args: { p_printer_id: string }; Returns: undefined };
      sim_reset: { Args: never; Returns: undefined };
      sim_manual_tick: { Args: never; Returns: undefined };
      import_lots: {
        Args: {
          p_filename: string;
          p_rows: Json;
          p_errors: Json;
          p_total_rows: number;
        };
        Returns: {
          import_id: string;
          inserted_count: number;
          updated_count: number;
          error_count: number;
          row_count: number;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
