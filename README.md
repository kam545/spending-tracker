# spending-tracker

A static website for tracking fictional spending and practicing CSV cleaning and validation. Open `index.html` directly in a browser. No installation is needed. Data is saved only in your browser.

[Live site](https://kam545.github.io/spending-tracker/) · [Validation tests](https://kam545.github.io/spending-tracker/data/tests.html)

## How to use it

Click **Import CSV** and choose `data/clean.csv` or `data/raw.csv`. Each successful import replaces the displayed purchases with accepted rows. Rejected rows have explanations, and identical rows receive a possible-duplicate warning. **Clear purchases** resets browser storage.

Open `data/clean.html`, click **Run cleaning**, and select `data/raw.csv`. Review the three lists and click **Download clean.csv**. The cleaner is specific to this practice file. Open `data/tests.html` to run 32 automated tests, including both embedded CSV fixtures, without a server.

## Data

The data is entirely made up and was generated with AI for this project. The original `data/raw.csv` is preserved byte for byte. Row numbers count the header as row 1. These conservative decisions were selected with AI assistance and are documented for review.

| Problem | Rows | Decision |
| --- | --- | --- |
| Ambiguous slash date | 3 | Set aside. Confirm month/day order before converting. |
| Written month dates | 5, 14 | Convert to YYYY-MM-DD. |
| Dollar signs and comma | 3, 8 | Parse as whole cents. Row 3 remains set aside for its date. |
| Category variants | 7, 9, 14, 21 | Normalize Grocery/groceries to Groceries, coffee to Coffee, and Dining Out to Dining out. Row 9 remains set aside for missing payment method. |
| Missing payment method | 9, 22 | Set aside rather than invent a value. |
| Missing merchant | 16 | Set aside. |
| Impossible September 31 | 18 | Set aside. |
| Missing category | 24 | Set aside. |
| Identical transit payments | 11, 12 | Keep both and flag row 12. Two rides are possible. |
| Large electronics purchase | 8 | Keep and flag $1,849.00 for review. Large purchases are allowed. |
| Totals row | 26 | Remove. Its stated total is also $10.00 higher than the actual raw transaction sum. |

**Row check:** 25 raw rows = 18 clean + 1 removed + 6 set aside (3, 9, 16, 18, 22, 24).

**Money check:** raw transactions total $2,151.96, including both transit purchases. Set-aside transactions total $35.44. Clean transactions total $2,116.52. The displayed raw total of $2,161.96 exceeds the clean total by $45.44, consisting of the $35.44 set aside plus the raw summary's $10.00 error. Money is calculated in whole cents and exported as decimal dollars.

### Data contract

The header must match these columns in this exact order. Every column is required.

| Column | Type | Rule |
| --- | --- | --- |
| Date | Date | Real YYYY-MM-DD date, today or earlier. |
| Merchant | Text | Contains non-whitespace text. |
| Category | Choice | Exactly Groceries, Coffee, Transport, Books, Dining out, Electronics, Laundry, Entertainment, or School supplies. |
| Amount_USD | Money | Plain number above zero, at most two decimal places, no symbols or commas, safely representable as whole cents in JavaScript. |
| Payment_Method | Choice | Exactly Debit card, Credit card, Cash, or Transit card. |

Extra or missing columns reject the row. A bad header rejects the file. Every error identifies its row, column, code, message, and severity. Exact duplicate rows load with a warning. Large valid purchases are allowed.

### How the code works

`normalizeDate(text)` checks that a date exists and converts written month names to YYYY-MM-DD. The line `if (text.includes('/')) return null` deliberately sets ambiguous slash dates aside.

`parseAmountCents(text)` checks the amount's format and removes currency symbols and grouping commas. It returns whole cents, so $12.50 becomes 1250.

`normalizeCategory(text)` ignores case and extra spaces and matches the allowed categories. It returns an empty string for a blank and null for an unknown choice.

`isTotalsRow(row)` looks for Total or Totals in the merchant column. It identifies summary rows for removal.

`cleanRows(rows)` normalizes values and applies the documented decisions. It returns clean, removed, and review lists, each retaining its original source row.

`checkRowCounts(rows, result)` checks that every raw source row appears exactly once across the three lists. It catches both missing rows and duplicate attribution.

`MANUAL_DECISIONS` near the top of `data/clean.js` records rows 3, 8, and 12 with reasons. The validator compares `value > today` only after checking the date is real and standardized, which makes alphabetical date order match calendar order. Tests pass a fixed today of 2026-11-04, and imports pass the browser's current local date.

## Tests

Expected results were written before validation was implemented. All 32 automated checks passed in the JavaScript runtime. Browser click-through verification is pending because local file navigation was blocked by the browser tool. The following results describe automated checks of the same parser and validator used by Import CSV.

| # | Kind | What I do | What should happen | What happened | Pass? |
| --- | --- | --- | --- | --- | --- |
| 1 | Data | Import clean.csv | 18 loaded, zero rejected, one duplicate warning | Automated validator returned those counts | Yes, automated |
| 2 | Data | Import raw.csv | 13 loaded, 12 rejected with reasons, one duplicate warning on row 12 | Automated validator returned those counts | Yes, automated |
| 3 | Data | Import a good row with amount $20 | Reject Amount_USD with bad_format | Automated validator rejected the amount | Yes, automated |

To check the interface, open `index.html`, import each CSV, and compare the report with this table. Open `data/tests.html` and expect **32 of 32 tests pass**. For the third import test, copy a good CSV row into a temporary file, change its amount to `$20`, and import it.

## Build log

November 11, 2026 — Asked AI to help complete Week 6 from the supplied assignment. The project initially contained only a README and raw.csv, so AI created the static tracker, cleaner, data contract, validation, and tests. Tests were written before the validator. All 32 checks passed on the first run. The ambiguous slash date and missing values were set aside, both transit purchases were retained, and the original total's $10 error was documented. Browser local-file verification was blocked, so no manual browser pass is claimed.

## Changes

- Added a static spending tracker with validated CSV import, reports, duplicate warnings, and browser storage.
- Added cleaning code, a cleaning page, clean.csv, a shared data contract, and 32 automated tests.
- Added a problem log, amount reconciliation, code explanations, and testing instructions.
