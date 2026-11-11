const STORAGE_KEY = 'spending-tracker-v2';
let purchases = [];
const report = document.getElementById('report');
function renderPurchases() {
  const cents = purchases.reduce((sum, row) => sum + plainCents(row[3]), 0);
  document.getElementById('total').textContent = (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  document.getElementById('count').textContent = purchases.length;
  showTable(document.getElementById('purchases'), SCHEMA.columns, purchases);
}
function savePurchases() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases)); }
  catch { const note = document.createElement('p'); note.textContent = 'Browser storage is unavailable. Purchases will last until this page closes.'; report.append(note); }
}
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(saved)) purchases = validateFile([SCHEMA.columns, ...saved.filter(Array.isArray)], SCHEMA, localToday()).accepted.map(r => r.values);
} catch { purchases = []; }
renderPurchases();
document.getElementById('import').onclick = () => document.getElementById('file').click();
document.getElementById('file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    const result = validateFile(parseCSV(await file.text()), SCHEMA, localToday());
    report.replaceChildren();
    if (!result.errors.length) purchases = result.accepted.map(row => row.values);
    const summary = document.createElement('p'); summary.textContent = result.accepted.length + ' rows loaded · ' + result.rejected.length + ' rejected · ' + result.warnings.length + ' warnings'; report.append(summary);
    const list = document.createElement('ul');
    [...result.errors, ...result.rejected.flatMap(row => row.errors), ...result.warnings].forEach(problem => {
      const item = document.createElement('li'); item.textContent = 'Row ' + problem.row + ' · ' + problem.column + ' · ' + problem.message; list.append(item);
    });
    report.append(list); renderPurchases(); savePurchases();
  } catch (error) { report.textContent = 'Import failed. ' + error.message; }
  event.target.value = '';
};
document.getElementById('clear').onclick = () => { purchases = []; report.textContent = 'Purchases cleared.'; savePurchases(); renderPurchases(); };
