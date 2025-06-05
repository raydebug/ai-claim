const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

// Extract parseAndPrefillFields function from popup.js
const content = fs.readFileSync('popup.js', 'utf8');
const match = content.match(/function parseAndPrefillFields\(ocrText, fileName\) {([\s\S]*?)\n  }/);
if (!match) throw new Error('parseAndPrefillFields function not found');
const funcSource = 'function parseAndPrefillFields(ocrText, fileName) {' + match[1] + '\n}';

const sandbox = {
  vendorNameInput: { value: '' },
  receiptDateInput: { value: '' },
  totalAmountInput: { value: '' },
  invoiceNumberInput: { value: '' },
  console
};

vm.createContext(sandbox);
vm.runInContext(funcSource, sandbox);

const sampleText = 'Vendor: Test Shop\nDate: 05/23/2024\nTotal: 123.45\nInvoice Number: ABC123';

sandbox.parseAndPrefillFields(sampleText, 'sample');

assert.strictEqual(sandbox.receiptDateInput.value, '2024-05-23');
assert.strictEqual(sandbox.totalAmountInput.value, '123.45');
assert.strictEqual(sandbox.invoiceNumberInput.value, 'ABC123');
