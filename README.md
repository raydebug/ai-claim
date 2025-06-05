# Insurance Claim Helper - Chrome Plugin

This Chrome plugin helps users easily capture and organize information from receipts and invoices for their insurance claims.

## Core Features

*   **Receipt/Invoice Upload:**
    *   Select image files (JPG, PNG, PDF) of receipts or invoices from your computer.
*   **Smart Data Extraction (OCR):**
    *   Automatically extracts key details: Vendor Name, Date, Total Amount, Invoice Number.
*   **Review & Edit:**
    *   Manually review and correct any extracted information to ensure accuracy.
*   **Claim Organization:**
    *   Group multiple receipts/invoices under named claims (e.g., "Dental Visit - Jan 2024").
*   **Local Data Storage:**
    *   Securely stores your data within your Chrome browser.
*   **Export Claims:**
    *   Export claim information (e.g., as a summary or image collection) to assist in your insurance filing process. **This data can then be used when you interact with your specific insurance provider's portal or forms.**

## Overview

Managing receipts and invoices for insurance claims can be a hassle. This plugin aims to simplify the process by allowing you to quickly digitize your paper documents, extract the important information, and keep things organized, all within your browser.

**Important Note:** This tool is designed to help you prepare and organize your claim information. It does not directly integrate with or submit claims to specific insurance companies, as each provider has unique systems and requirements. The exported data from this plugin is intended to support your manual submission process.

## Installation

(Instructions to be added once the plugin is packaged - typically involving loading an unpacked extension or installing from the Chrome Web Store.)

## How to Use

1.  Click on the plugin icon in your Chrome toolbar.
2.  Select 'Upload New Receipt' and choose your image file.
3.  Review the extracted information and make any necessary corrections.
4.  Assign the receipt to a new or existing claim.
5.  When ready, export the claim data to use for your submission to your insurance provider.

---

*Note: This is a conceptual tool. The features described are planned functionalities.*

## Running Tests

This repository uses a small custom test runner written in Node.js. To execute the end-to-end tests:

```bash
node -v   # ensure Node.js is available
npm test
```

All tests live in the `test/` folder and run automatically when executing `npm test`.
