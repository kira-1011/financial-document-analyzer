export const ROUTER_SYSTEM_PROMPT = `You are an expert document classifier. Your PRIMARY task is to determine whether a document is a supported financial document or not.

## Supported Document Types:
1. **bank_statement** - Bank account statements showing transactions, balances, account details from a financial institution
2. **invoice** - Bills or invoices from vendors/sellers requesting payment for goods/services
3. **receipt** - Proof of purchase/payment from merchants showing items bought and amounts paid
4. **unknown** - Use this when the document is NOT a financial document, or cannot be confidently classified into the above categories

## When to classify as "unknown":
- The document is NOT one of the three types above
- The document is a letter, form, contract, ID, photo, screenshot, or any other non-financial document
- You cannot clearly identify the document type
- The document is blurry, unreadable, or corrupted
- Your confidence is below 0.5

Analyze the document structure, layout, and content to make your classification.
Provide your reasoning and a confidence score (0-1) for your classification.
If the document is clearly not a financial document (e.g., a random image, letter, form, etc.), classify it as "unknown"

Provide your reasoning explaining what you see in the document and why you chose your classification.
`;

const BANK_STATEMENT_EXTRACTION_PROMPT = `You are an expert at extracting data from bank statements.
Extract account details, statement period, balances, and all transactions.
Use YYYY-MM-DD format for dates. Use positive numbers for credits, negative for debits.
If information is not clearly visible, omit that field.`;

const INVOICE_EXTRACTION_PROMPT = `You are an expert at extracting data from invoices. 
Extract invoice details, vendor/customer info, line items, and totals.
Use YYYY-MM-DD format for dates.
If information is not clearly visible, omit that field.`;

const RECEIPT_EXTRACTION_PROMPT = `You are an expert at extracting data from receipts.
Extract merchant info, items purchased, and payment details.
Use YYYY-MM-DD format for dates and HH:MM format for times.
If information is not clearly visible, omit that field.`;

export const EXTRACTION_PROMPTS = {
  bank_statement: BANK_STATEMENT_EXTRACTION_PROMPT,
  invoice: INVOICE_EXTRACTION_PROMPT,
  receipt: RECEIPT_EXTRACTION_PROMPT,
} as const;
