// Decisions for this practice file only. No evidence proves these rides are duplicates.
const MANUAL_DECISIONS = [
  { row: 3, action: 'review', reason: '09/02/2026 is ambiguous. Confirm month/day order before converting.' },
  { row: 12, action: 'keep', reason: 'An identical transit payment could be a second ride. Keep and flag.' },
  { row: 8, action: 'keep', reason: 'Large electronics purchase is allowed. Confirm the $1,849.00 amount.' }
];
function normalizeDate(text) {
  text = text.trim();
  if (realDate(text)) return text;
  // Slash dates are deliberately not guessed as month/day or day/month.
  if (text.includes('/')) return null;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const match = text.match(/^(?:(\d{1,2}) ([A-Za-z]{3})|([A-Za-z]{3}) (\d{1,2})) (\d{4})$/);
  if (!match) return null;
  const month = months.findIndex(m => m.toLowerCase() === (match[2] || match[3]).toLowerCase()) + 1;
  const date = match[5] + '-' + String(month).padStart(2, '0') + '-' + (match[1] || match[4]).padStart(2, '0');
  return realDate(date) ? date : null;
}
function parseAmountCents(text) {
  text = text.trim();
  if (!/^\$?-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) return null;
  return plainCents(text.replace(/[$,]/g, ''));
}
function normalizeCategory(text) {
  const value = text.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!value) return '';
  if (value === 'grocery') return 'Groceries';
  return SCHEMA.rules.Category.choices.find(category => category.toLowerCase() === value) || null;
}
function isTotalsRow(row) { return /^(total|totals)$/i.test(String(row[1] || '').trim()); }
function cleanRows(rows) {
  if (JSON.stringify(rows[0]) !== JSON.stringify(SCHEMA.columns)) throw new Error('Choose the original raw.csv with the expected header.');
  const result = { clean: [], removed: [], review: [] };
  rows.slice(1).forEach((values, index) => {
    const source_row = index + 2; const record = { source_row, values: values.slice(), reasons: [] };
    if (isTotalsRow(values)) { record.reasons.push('Summary row, excluded from purchases.'); result.removed.push(record); return; }
    const decision = MANUAL_DECISIONS.find(d => d.row === source_row);
    if (decision) record.reasons.push(decision.reason);
    if (decision?.action === 'review') { result.review.push(record); return; }
    const date = normalizeDate(values[0] || ''); const cents = parseAmountCents(values[3] || '');
    const normalized = [date || values[0], (values[1] || '').trim(), normalizeCategory(values[2] || '') ?? values[2], cents === null ? values[3] : (cents / 100).toFixed(2), (values[4] || '').trim()];
    if (values.length !== 5) record.reasons.push('Expected five columns.');
    record.reasons.push(...validateRow(normalized, source_row, SCHEMA, '2026-11-04').map(e => e.column + ' — ' + e.message));
    if (!date || cents === null || record.reasons.length > (decision ? 1 : 0)) result.review.push(record);
    else { record.values = normalized; record.amount_cents = cents; result.clean.push(record); }
  });
  return result;
}
function checkRowCounts(rows, result) {
  const sources = [...result.clean, ...result.removed, ...result.review].map(r => r.source_row);
  return sources.length === rows.length - 1 && new Set(sources).size === sources.length && sources.every(n => Number.isInteger(n) && n >= 2 && n <= rows.length);
}
