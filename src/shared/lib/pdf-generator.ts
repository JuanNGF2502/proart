import jsPDF from "jspdf";

export interface BudgetItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
}

export interface BudgetData {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  items: BudgetItem[];
  notes: string;
  validity: number;
  date: Date;
  total: number;
}

function fmt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function generateBudgetPDF(budget: BudgetData, bgBase64?: string): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 20;
  const CW = PW - M * 2;

  if (bgBase64) {
    try { doc.addImage(bgBase64, "PNG", 0, 0, PW, PH); } catch (_) {}
  }

  const C_BLACK: [number, number, number] = [17, 17, 17];
  const C_GOLD: [number, number, number] = [201, 166, 107];
  const C_GRAY: [number, number, number] = [245, 245, 245];
  const C_GRAY_LINE: [number, number, number] = [229, 229, 229];
  const C_TEXT: [number, number, number] = [100, 100, 100];

  let y = 18;

  // ==============================
  // HEADER - only logo + name
  // ==============================
  

  

  y = 60;

  // ==============================
  // TITLE + DATE
  // ==============================
  doc.setTextColor(...C_BLACK);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ORÇAMENTO", M, y);
  y += 7;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_TEXT);
  doc.text(budget.date.toLocaleDateString("pt-BR"), M, y);
  y += 10;

  // ==============================
  // CLIENT
  // ==============================
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_BLACK);
  doc.text(budget.clientName, M, y);
  y += 5;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_TEXT);
  doc.text(budget.clientPhone, M, y);
  y += 10;

  // ==============================
  // TABLE
  // ==============================
  const colQtd = 14;
  const colServico = 50;
  const colDesc = CW - colQtd - colServico - 35 - 30;
  const colVlr = 35;
  const colTotal = 30;

  // Header - white bg with gold bottom border
  const h = 7;
  doc.setFillColor(255, 255, 255);
  doc.rect(M, y, CW, h, "F");
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.8);
  doc.line(M, y + h, PW - M, y + h);

  doc.setTextColor(...C_BLACK);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");

  const hy = y + 5;
  let cx = M;
  doc.text("QTD", cx + 2, hy);
  cx += colQtd;
  doc.text("SERVI\u00c7O", cx + 2, hy);
  cx += colServico;
  doc.text("DESCRI\u00c7\u00c3O", cx + 2, hy);
  cx += colDesc;
  doc.text("VALOR UNIT.", cx + 2, hy);
  cx += colVlr;
  doc.text("TOTAL", cx + colTotal - 2, hy, { align: "right" });

  y += h + 1;

  // Rows
  const rowPad = 1.0;
  const baseRowH = 6.5;
  const lh = 3;

  budget.items.forEach((item, i) => {
    let descLines: string[] = [];
    if (item.description) {
      descLines = doc.splitTextToSize(item.description, colDesc - 3);
    }
    const descH = descLines.length > 0 ? descLines.length * lh + 1 : 0;
    const rowH = Math.max(baseRowH, baseRowH + descH);

    if (y + rowH + 20 > PH) { doc.addPage(); y = M; }

    // Alternating background
    if (i % 2 === 0) {
      doc.setFillColor(...C_GRAY);
      doc.rect(M, y, CW, rowH, "F");
    }

    // Subtle bottom border
    doc.setDrawColor(...C_GRAY_LINE);
    doc.setLineWidth(0.2);
    doc.line(M, y + rowH, PW - M, y + rowH);

    const ty = y + rowPad + 4;
    // QTD - centered
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_BLACK);
    doc.text(String(item.quantity), M + colQtd / 2, ty, { align: "center" });

    // Service name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(item.name, M + colQtd + 2, ty);

    // Description
    if (descLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...C_TEXT);
      doc.text(descLines, M + colQtd + colServico + 2, ty);
    }

    // Unit price - right aligned within column
    const vlrX = M + colQtd + colServico + colDesc;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...C_BLACK);
    doc.text(`R$ ${fmt(item.price)}`, vlrX + colVlr - 2, ty, { align: "right" });

    // Total - right aligned
    const totX = vlrX + colVlr;
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${fmt(item.quantity * item.price)}`, totX + colTotal - 2, ty, { align: "right" });

    y += rowH + 2;
  });

  // Gold line below last row
  doc.setDrawColor(...C_GOLD);
  doc.setLineWidth(0.5);
  doc.line(M, y, PW - M, y);

  y += 3;

  // ==============================
  // TOTAL
  // ==============================
  if (y + 30 > PH) { doc.addPage(); y = M; }

  const barW = 80;
  const barH = 10;
  const barX = PW - M - barW;

  doc.setFillColor(...C_BLACK);
  doc.rect(barX, y, barW, barH, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total", barX + 8, y + 7);

  doc.setTextColor(...C_GOLD);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`R$ ${fmt(budget.total)}`, barX + barW - 8, y + 7, { align: "right" });

  y += barH + 8;

  // ==============================
  // NOTES
  // ==============================
  if (budget.notes) {
    if (y + 20 > PH) { doc.addPage(); y = M; }

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_TEXT);
    const lines = doc.splitTextToSize(budget.notes, CW);
    doc.text(lines, M, y);
  }

  return doc;
}

export async function loadBackgroundImage(): Promise<string> {
  try {
    const res = await fetch("/images/orcamento-bg.png");
    if (!res.ok) return "";
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export async function downloadBudgetPDF(budget: BudgetData) {
  const bgBase64 = await loadBackgroundImage();
  const doc = generateBudgetPDF(budget, bgBase64);
  doc.save(`orcamento-${budget.id || "001"}.pdf`);
}
