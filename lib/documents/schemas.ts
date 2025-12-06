import { z } from "zod";

// ============================================
// Bank Statement Schema
// ============================================
export const bankStatementTransactionSchema = z.object({
    date: z.string().describe("Transaction date (YYYY-MM-DD format)"),
    description: z.string().describe("Transaction description"),
    amount: z.number().describe("Transaction amount (positive for credit, negative for debit)"),
    type: z.enum(["credit", "debit"]).describe("Transaction type"),
    balance: z.number().optional().describe("Running balance after transaction"),
});

export const bankStatementSchema = z.object({
    bank_name: z.string().describe("Name of the bank"),
    account_number: z.string().describe("Account number (may be partially masked)"),
    account_holder: z.string().optional().describe("Name of the account holder"),
    statement_period: z.object({
        start_date: z.string().describe("Statement period start date (YYYY-MM-DD)"),
        end_date: z.string().describe("Statement period end date (YYYY-MM-DD)"),
    }),
    opening_balance: z.number().describe("Opening balance at start of period"),
    closing_balance: z.number().describe("Closing balance at end of period"),
    total_credits: z.number().optional().describe("Total credits during period"),
    total_debits: z.number().optional().describe("Total debits during period"),
    currency: z.string().default("USD").describe("Currency code"),
    transactions: z.array(bankStatementTransactionSchema).describe("List of transactions"),
});

// ============================================
// Invoice Schema
// ============================================
export const invoiceLineItemSchema = z.object({
    description: z.string().describe("Item or service description"),
    quantity: z.number().describe("Quantity"),
    unit_price: z.number().describe("Price per unit"),
    amount: z.number().describe("Total amount for this line item"),
});

export const invoiceSchema = z.object({
    invoice_number: z.string().describe("Invoice number/ID"),
    vendor_name: z.string().describe("Name of the vendor/seller"),
    vendor_address: z.string().optional().describe("Vendor address"),
    customer_name: z.string().optional().describe("Name of the customer/buyer"),
    customer_address: z.string().optional().describe("Customer address"),
    invoice_date: z.string().describe("Invoice date (YYYY-MM-DD)"),
    due_date: z.string().optional().describe("Payment due date (YYYY-MM-DD)"),
    line_items: z.array(invoiceLineItemSchema).describe("List of line items"),
    subtotal: z.number().describe("Subtotal before tax"),
    tax_rate: z.number().optional().describe("Tax rate as percentage"),
    tax_amount: z.number().optional().describe("Tax amount"),
    discount: z.number().optional().describe("Discount amount"),
    total: z.number().describe("Total amount due"),
    currency: z.string().default("USD").describe("Currency code"),
    payment_terms: z.string().optional().describe("Payment terms"),
    notes: z.string().optional().describe("Additional notes"),
});

// ============================================
// Receipt Schema
// ============================================
export const receiptItemSchema = z.object({
    name: z.string().describe("Item name"),
    quantity: z.number().default(1).describe("Quantity purchased"),
    price: z.number().describe("Price per item"),
    amount: z.number().describe("Total amount for this item"),
});

export const receiptSchema = z.object({
    merchant_name: z.string().describe("Name of the merchant/store"),
    merchant_address: z.string().optional().describe("Merchant address"),
    merchant_phone: z.string().optional().describe("Merchant phone number"),
    receipt_date: z.string().describe("Receipt date (YYYY-MM-DD)"),
    receipt_time: z.string().optional().describe("Receipt time (HH:MM)"),
    receipt_number: z.string().optional().describe("Receipt/transaction number"),
    items: z.array(receiptItemSchema).describe("List of purchased items"),
    subtotal: z.number().describe("Subtotal before tax"),
    tax_amount: z.number().optional().describe("Tax amount"),
    tip: z.number().optional().describe("Tip amount"),
    total: z.number().describe("Total amount paid"),
    payment_method: z.enum(["cash", "credit_card", "debit_card", "other"]).optional().describe("Payment method used"),
    card_last_four: z.string().optional().describe("Last 4 digits of card used"),
    currency: z.string().default("USD").describe("Currency code"),
});

// ============================================
// Type Exports
// ============================================
export type BankStatementData = z.infer<typeof bankStatementSchema>;
export type InvoiceData = z.infer<typeof invoiceSchema>;
export type ReceiptData = z.infer<typeof receiptSchema>;

export type ExtractedData = BankStatementData | InvoiceData | ReceiptData;
