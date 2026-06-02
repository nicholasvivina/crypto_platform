'use strict';
// invoice.service.js - PDF Invoice Generator
const PDFDocument = require('pdfkit');

const generateInvoice = (data) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ margin: 50 });
  const buf = [];
  doc.on('data', (d) => buf.push(d));
  doc.on('end', () => resolve(Buffer.concat(buf)));
  doc.on('error', reject);
  doc.fontSize(22).text('CryptoNex', { align: 'center' });
  doc.fontSize(14).text('Invoice', { align: 'center' }).moveDown();
  doc.fontSize(11).text(`Invoice #: ${data.invoiceId}`);
  doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`);
  doc.text(`Customer: ${data.userName}`).moveDown();
  doc.text('─'.repeat(65)).moveDown();
  data.items?.forEach((i) => doc.text(i.description, { continued: true }).text(`$${i.amount}`, { align: 'right' }));
  doc.moveDown().text('─'.repeat(65));
  doc.fontSize(13).text(`Total: $${data.total}`, { align: 'right' });
  doc.end();
});

module.exports = { generateInvoice };
