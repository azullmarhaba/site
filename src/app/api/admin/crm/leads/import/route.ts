import { jsonError, jsonOk } from "@/lib/api";
import { apiUser, atLeast } from "@/lib/auth/guards";
import { createCrmLead, ServiceError } from "@/server/services/crm";
import { parseLeadCsv } from "@/server/services/crm-csv";

const MAX_CSV_BYTES = 1_048_576;

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (!atLeast(user, "STAFF")) return jsonError("Forbidden", 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected multipart form data", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError("No CSV file provided", 400);
  if (file.size > MAX_CSV_BYTES) return jsonError("CSV exceeds the 1 MB limit", 413);
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    return jsonError("Upload a .csv file", 415);
  }

  let rows: ReturnType<typeof parseLeadCsv>;
  try {
    rows = parseLeadCsv(await file.text());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid CSV", 400);
  }

  const results = [];
  for (const row of rows) {
    if (!row.lead) {
      results.push({ row: row.row, status: "error", error: row.error });
      continue;
    }
    try {
      await createCrmLead(row.lead, { id: user.id });
      results.push({ row: row.row, status: "imported" });
    } catch (error) {
      if (error instanceof ServiceError && error.status < 500) {
        results.push({ row: row.row, status: "error", error: error.message });
        continue;
      }
      console.error("[admin CRM lead import]", { row: row.row, error });
      results.push({ row: row.row, status: "error", error: "Lead import failed" });
    }
  }
  return jsonOk({
    results,
    imported: results.filter((result) => result.status === "imported").length,
    rejected: results.filter((result) => result.status === "error").length,
  });
}
