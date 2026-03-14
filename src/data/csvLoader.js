// ============================================================
// CSV Loader — fetch + parse CSV files into JS objects
// ============================================================

/**
 * Parse a CSV string into an array of objects.
 * Handles quoted fields containing commas (e.g. "[1, 4]").
 */
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] ?? '';
    }
    rows.push(obj);
  }

  return rows;
}

/** Parse a single CSV line, respecting quoted fields */
function parseLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Fetch a CSV file and parse it into an array of objects.
 * @param {string} url - relative or absolute URL to the CSV file
 * @returns {Promise<Object[]>}
 */
export async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const text = await res.text();
  return parseCSV(text);
}
