/**
 * pdfReport.ts
 *
 * Gera relatório financeiro mensal em PDF usando jsPDF.
 * Inclui: resumo do mês, tabela de transações, breakdown por categoria.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportTransaction = {
  description: string;
  amount: string | number;
  type: 'income' | 'expense';
  categoryName: string;
  paymentMethod: string;
  expenseType: 'fixed' | 'variable';
  transactionDate: string | Date;
};

export type ReportSummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  fixedExpenses: number;
  variableExpenses: number;
  topCategory: string;
  percentCommitted: number;
};

export type CategoryBreakdown = {
  name: string;
  total: number;
  count: number;
  color?: string;
};

export type ReportData = {
  userName: string;
  month: number;
  year: number;
  summary: ReportSummary;
  transactions: ReportTransaction[];
  categoryBreakdown: CategoryBreakdown[];
  isFamily?: boolean;
  familyMemberName?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return d.toLocaleDateString('pt-BR');
}

function paymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    pix: 'PIX',
    credit: 'Crédito',
    debit: 'Débito',
    cash: 'Dinheiro',
    boleto: 'Boleto',
  };
  return map[method] ?? method;
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

export async function generateMonthlyReport(data: ReportData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  // ── Header ──────────────────────────────────────────────────────────────────
  // Background strip
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FINANÇAS', margin, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Planejamento Financeiro Pessoal', margin, 19);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const title = `Relatório ${data.isFamily ? 'Familiar' : 'Pessoal'} — ${MONTH_NAMES[data.month - 1]} de ${data.year}`;
  doc.text(title, pageWidth - margin, 12, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Usuário: ${data.userName}`, pageWidth - margin, 19, { align: 'right' });

  y = 36;

  // ── Summary Cards ────────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Mês', margin, y);
  y += 6;

  const cardW = (pageWidth - margin * 2 - 6) / 3;
  const cardH = 22;
  const cards = [
    { label: 'Entradas', value: formatBRL(data.summary.totalIncome), color: [16, 185, 129] as [number, number, number] },
    { label: 'Saídas', value: formatBRL(data.summary.totalExpense), color: [239, 68, 68] as [number, number, number] },
    { label: 'Saldo', value: formatBRL(data.summary.balance), color: data.summary.balance >= 0 ? [59, 130, 246] as [number, number, number] : [239, 68, 68] as [number, number, number] },
  ];

  cards.forEach((card, idx) => {
    const x = margin + idx * (cardW + 3);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
    doc.setDrawColor(...card.color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

    doc.setTextColor(...card.color);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardW / 2, y + 13, { align: 'center' });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + cardW / 2, y + 19, { align: 'center' });
  });

  y += cardH + 6;

  // ── Secondary info ───────────────────────────────────────────────────────────
  const secondaryCards = [
    { label: 'Gastos Fixos', value: formatBRL(data.summary.fixedExpenses) },
    { label: 'Gastos Variáveis', value: formatBRL(data.summary.variableExpenses) },
    { label: 'Maior Categoria', value: data.summary.topCategory || '—' },
    { label: '% Comprometido', value: `${data.summary.percentCommitted.toFixed(1)}%` },
  ];

  const secW = (pageWidth - margin * 2 - 9) / 4;
  secondaryCards.forEach((card, idx) => {
    const x = margin + idx * (secW + 3);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(x, y, secW, 16, 2, 2, 'F');

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + secW / 2, y + 7, { align: 'center' });

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + secW / 2, y + 13, { align: 'center' });
  });

  y += 24;

  // ── Category Breakdown ───────────────────────────────────────────────────────
  if (data.categoryBreakdown.length > 0) {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastos por Categoria', margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categoria', 'Qtd', 'Total', '% das Saídas']],
      body: data.categoryBreakdown.map((c) => [
        c.name,
        String(c.count),
        formatBRL(c.total),
        data.summary.totalExpense > 0
          ? `${((c.total / data.summary.totalExpense) * 100).toFixed(1)}%`
          : '0%',
      ]),
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Transactions Table ───────────────────────────────────────────────────────
  if (data.transactions.length > 0) {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Transações do Mês', margin, y);
    y += 4;

    const rows = data.transactions
      .sort((a, b) => {
        const da = typeof a.transactionDate === 'string' ? a.transactionDate : (a.transactionDate as Date).toISOString();
        const db = typeof b.transactionDate === 'string' ? b.transactionDate : (b.transactionDate as Date).toISOString();
        return da.localeCompare(db);
      })
      .map((t) => [
        formatDate(t.transactionDate),
        t.description,
        t.categoryName,
        paymentMethodLabel(t.paymentMethod),
        t.type === 'income' ? 'Entrada' : 'Saída',
        formatBRL(typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount),
      ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Data', 'Descrição', 'Categoria', 'Pagamento', 'Tipo', 'Valor']],
      body: rows,
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 5) {
          const row = rows[hookData.row.index];
          if (row && row[4] === 'Entrada') {
            hookData.cell.styles.textColor = [16, 185, 129];
          } else {
            hookData.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 28, halign: 'right' },
      },
    });
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `FINANÇAS — Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} — Página ${i} de ${pageCount}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const fileName = `financas-${MONTH_NAMES[data.month - 1].toLowerCase()}-${data.year}.pdf`;
  doc.save(fileName);
}
