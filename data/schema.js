const SCHEMA = {
  columns: ['Date', 'Merchant', 'Category', 'Amount_USD', 'Payment_Method'],
  rules: {
    Date: { type: 'date', required: true, format: 'YYYY-MM-DD', noFuture: true },
    Merchant: { type: 'text', required: true },
    Category: { type: 'choice', required: true, choices: ['Groceries', 'Coffee', 'Transport', 'Books', 'Dining out', 'Electronics', 'Laundry', 'Entertainment', 'School supplies'] },
    Amount_USD: { type: 'money', required: true, positive: true, maxDecimals: 2 },
    Payment_Method: { type: 'choice', required: true, choices: ['Debit card', 'Credit card', 'Cash', 'Transit card'] }
  }
};
