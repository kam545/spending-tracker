function showTable(container, headers, rows) {
  container.replaceChildren();
  const table = document.createElement('table');
  const head = document.createElement('thead'); const header = document.createElement('tr');
  headers.forEach(value => { const cell = document.createElement('th'); cell.textContent = value; header.append(cell); });
  head.append(header); table.append(head);
  const body = document.createElement('tbody');
  rows.forEach(values => { const row = document.createElement('tr'); values.forEach(value => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }); body.append(row); });
  table.append(body); container.append(table);
}
function downloadCSV(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'clean.csv'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
