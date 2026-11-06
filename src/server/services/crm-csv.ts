export type ImportedLeadInput = {
  fullName: string;
  email: string;
  phone?: string;
  source?: string;
};

export type ParsedLeadCsvRow = {
  row: number;
  lead?: ImportedLeadInput;
  error?: string;
};

function parseRecords(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (quoted) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        value += char;
      }
    } else if (char === '"') {
      if (value.length) throw new Error("Unexpected quote in CSV");
      quoted = true;
    } else if (char === ",") {
      row.push(value.trim());
      value = "";
    } else if (char === "\n") {
      row.push(value.trim());
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  if (quoted) throw new Error("Unclosed quoted field in CSV");
  if (value.length || row.length) {
    row.push(value.trim());
    rows.push(row);
  }
  return rows;
}

export function parseLeadCsv(csv: string): ParsedLeadCsvRow[] {
  const records = parseRecords(csv);
  const header = records.shift()?.map((column) => column.trim().toLowerCase()) ?? [];
  const nameIndex = header.indexOf("name");
  const emailIndex = header.indexOf("email");
  if (nameIndex < 0 || emailIndex < 0) {
    throw new Error("CSV requires name and email columns");
  }
  if (records.length > 500) throw new Error("CSV may contain at most 500 data rows");

  const phoneIndex = header.indexOf("phone");
  const sourceIndex = header.indexOf("source");
  return records
    .map((record, index): ParsedLeadCsvRow => {
      const row = index + 2;
      if (record.every((cell) => !cell)) return { row, error: "Empty row" };
      if (record.length !== header.length) return { row, error: "Column count does not match header" };
      const fullName = record[nameIndex]?.trim() ?? "";
      const email = record[emailIndex]?.trim().toLowerCase() ?? "";
      if (!fullName || fullName.length > 200) return { row, error: "Name is required (max 200 characters)" };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
        return { row, error: "Valid email is required" };
      }
      const phone = phoneIndex >= 0 ? record[phoneIndex]?.trim() : "";
      const source = sourceIndex >= 0 ? record[sourceIndex]?.trim() : "";
      if (phone && phone.length > 40) return { row, error: "Phone must be at most 40 characters" };
      if (source && source.length > 120) return { row, error: "Source must be at most 120 characters" };
      return {
        row,
        lead: { fullName, email, ...(phone ? { phone } : {}), ...(source ? { source } : {}) },
      };
    })
    .filter((record) => record.lead || record.error);
}
