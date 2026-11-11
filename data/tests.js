/* Expectations written before the validator. All dates are fixed. */
const TEST_TODAY = '2026-11-04';
const GOOD = ['2026-09-01', 'Maple Cart Market', 'Groceries', '36.42', 'Debit card'];
const TESTS = [];
function test(name, run) { TESTS.push({ name, run }); }
function assert(value, message = 'Unexpected result') { if (!value) throw new Error(message); }
function errorsFor(column, value) {
  const row = GOOD.slice();
  row[SCHEMA.columns.indexOf(column)] = value;
  return validateRow(row, 2, SCHEMA, TEST_TODAY);
}
test('A good row passes', () => assert(validateRow(GOOD, 2, SCHEMA, TEST_TODAY).length === 0));
for (const column of ['Date', 'Merchant', 'Category', 'Amount_USD', 'Payment_Method']) {
  test(column + ' is required', () => assert(errorsFor(column, '').some(e => e.code === 'missing')));
}
for (const [name, column, value, code] of [
  ['Slash date rejected', 'Date', '09/02/2026', 'bad_format'],
  ['Impossible date rejected', 'Date', '2026-09-31', 'bad_format'],
  ['Future date rejected', 'Date', '2027-01-01', 'future_date'],
  ['Currency symbol rejected', 'Amount_USD', '$20', 'bad_format'],
  ['Comma rejected', 'Amount_USD', '1,200.00', 'bad_format'],
  ['Extra decimal places rejected', 'Amount_USD', '1.234', 'bad_format'],
  ['Zero rejected', 'Amount_USD', '0', 'not_positive'],
  ['Negative rejected', 'Amount_USD', '-1.00', 'not_positive'],
  ['Unknown category rejected', 'Category', 'Other', 'not_allowed'],
  ['Category case must match', 'Category', 'coffee', 'not_allowed'],
  ['Unknown payment method rejected', 'Payment_Method', 'Gold', 'not_allowed'],
  ['Unsafe amount rejected', 'Amount_USD', '999999999999999999', 'bad_format']
]) test(name, () => assert(errorsFor(column, value).some(e => e.code === code)));
test('All five missing values reported', () => assert(validateRow(['','','','',''], 2, SCHEMA, TEST_TODAY).length === 5));
test('Wrong header rejects file', () => assert(validateFile([['Wrong'], GOOD], SCHEMA, TEST_TODAY).errors[0].code === 'bad_header'));
test('Extra column rejects row', () => assert(validateRow([...GOOD, 'extra'], 2, SCHEMA, TEST_TODAY).some(e => e.code === 'bad_format')));
test('Exact duplicate loads with warning', () => {
  const result = validateFile([SCHEMA.columns, GOOD, GOOD], SCHEMA, TEST_TODAY);
  assert(result.accepted.length === 2 && result.warnings.length === 1 && result.warnings[0].row === 3);
});
test('Quoted commas and escaped quotes parse', () => assert(parseCSV('a,b\r\n"one, two","say ""hi"""\r\n')[1][1] === 'say "hi"'));
test('Unclosed quotes rejected', () => { let failed = false; try { parseCSV('a,"b'); } catch { failed = true; } assert(failed); });
test('Raw file has 13 accepted, 12 rejected, one warning', () => {
  const result = validateFile(parseCSV(TEST_RAW), SCHEMA, TEST_TODAY);
  assert(result.accepted.length === 13 && result.rejected.length === 12 && result.warnings.length === 1);
});
test('Clean file has 18 accepted, zero rejected, one warning', () => {
  const result = validateFile(parseCSV(TEST_CLEAN), SCHEMA, TEST_TODAY);
  assert(result.accepted.length === 18 && result.rejected.length === 0 && result.warnings.length === 1);
});
test('Cleaning accounts for every source row', () => {
  const rows = parseCSV(TEST_RAW); const result = cleanRows(rows);
  assert(result.clean.length === 18 && result.removed.length === 1 && result.review.length === 6 && checkRowCounts(rows, result));
  assert(toCSV([SCHEMA.columns, ...result.clean.map(r => r.values)]) === TEST_CLEAN);
});
test('Row check catches duplicate source attribution', () => {
  const rows = parseCSV(TEST_RAW); const result = cleanRows(rows);
  result.clean[1].source_row = result.clean[0].source_row;
  assert(!checkRowCounts(rows, result));
});
test('Ambiguous slash date is set aside', () => assert(normalizeDate('09/02/2026') === null));
test('Impossible date cannot normalize', () => assert(normalizeDate('2026-09-31') === null));
test('Amounts become exact cents', () => assert(parseAmountCents('$1,849.00') === 184900 && parseAmountCents('12oops') === null));
test('Categories normalize safely', () => assert(normalizeCategory(' grocery ') === 'Groceries' && normalizeCategory('unknown') === null));
function runTests() {
  return TESTS.map(t => { try { t.run(); return { name: t.name, pass: true }; } catch (error) { return { name: t.name, pass: false, message: error.message }; } });
}
