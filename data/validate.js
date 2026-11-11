function validateRow(values, rowNumber, schema, today) {
  const problems = [];
  function add(column, code, message) { problems.push({ row: rowNumber, column, code, message, severity: 'error' }); }
  if (values.length !== schema.columns.length) add('Row', 'bad_format', 'Use exactly ' + schema.columns.length + ' columns.');
  schema.columns.forEach((column, index) => {
    const rule = schema.rules[column]; const value = String(values[index] ?? '');
    if (value.trim() === '') { if (rule.required) add(column, 'missing', column + ' is required.'); return; }
    if (rule.type === 'date') {
      if (!realDate(value)) add(column, 'bad_format', 'Use a real date written YYYY-MM-DD.');
      else if (rule.noFuture && value > today) add(column, 'future_date', 'Date must be today or earlier.');
    }
    if (rule.type === 'money') {
      const cents = plainCents(value);
      if (cents === null) add(column, 'bad_format', 'Use a plain number with at most two decimal places and a safely representable amount.');
      else if (rule.positive && cents <= 0) add(column, 'not_positive', 'Amount must be above zero.');
    }
    if (rule.type === 'choice' && !rule.choices.includes(value)) add(column, 'not_allowed', 'Choose exactly one of ' + rule.choices.join(', ') + '.');
  });
  return problems;
}
function validateFile(rows, schema, today) {
  const result = { accepted: [], rejected: [], warnings: [], errors: [] };
  if (JSON.stringify(rows[0]) !== JSON.stringify(schema.columns)) {
    const error = { row: 1, column: 'Header', code: 'bad_header', message: 'Header must be ' + schema.columns.join(','), severity: 'error' };
    result.errors.push(error);
    result.rejected = rows.slice(1).map((values, index) => ({ values, source_row: index + 2, errors: [error] }));
    return result;
  }
  const seen = new Map();
  rows.slice(1).forEach((values, index) => {
    const source_row = index + 2; const errors = validateRow(values, source_row, schema, today);
    const key = JSON.stringify(values);
    if (seen.has(key)) result.warnings.push({ row: source_row, column: 'Row', code: 'possible_duplicate', message: 'Possible duplicate of row ' + seen.get(key) + '.', severity: 'warning' });
    else seen.set(key, source_row);
    if (errors.length) result.rejected.push({ values, source_row, errors });
    else result.accepted.push({ values, source_row });
  });
  return result;
}
