import jsPDF from "jspdf";

export interface BudgetItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface BudgetData {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress?: string;
  items: BudgetItem[];
  notes: string;
  validity: number;
  date: Date;
  total: number;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
}

export function generateBudgetPDF(budget: BudgetData, bgBase64?: string, logoBase64?: string): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Colors - Design System
  const primary = [244, 201, 93] as [number, number, number];
  const primaryDark = [229, 184, 76] as [number, number, number];
  const dark = [10, 10, 11] as [number, number, number];
  const gray50 = [250, 250, 251] as [number, number, number];
  const gray100 = [244, 244, 245] as [number, number, number];
  const gray200 = [228, 228, 231] as [number, number, number];
  const gray400 = [161, 161, 170] as [number, number, number];
  const gray500 = [113, 113, 122] as [number, number, number];
  const gray700 = [63, 63, 70] as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];
  const emerald500 = [16, 185, 129] as [number, number, number];
  const red500 = [239, 68, 68] as [number, number, number];
  const amber500 = [245, 158, 11] as [number, number, number];

  // Background
  if (bgBase64) {
    try {
      doc.addImage(`data:image/png;base64,${bgBase64}`, "PNG", 0, 0, pageWidth, 297);
    } catch (e) {}
  }

  let y = 55;

  // ===== HEADER =====
  // Logo
  if (logoBase64) {
    try {
      doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", margin, y, 50, 32);
    } catch (e) {
      doc.setFillColor(...gray100);
      doc.roundedRect(margin, y, 50, 32, 4, 4, "F");
      doc.setTextColor(...gray400);
      doc.setFontSize(9);
      doc.text("LOGO", margin + 25, y + 18, { align: "center" });
    }
  }

  // Title and info (right side)
  doc.setTextColor(...dark);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("ORÇAMENTO", pageWidth - margin, y + 8, { align: "right" });

  doc.setTextColor(...gray500);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nº ${budget.id || "001"}`, pageWidth - margin, y + 20, { align: "right" });

  const dateStr = budget.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(10);
  doc.text(dateStr, pageWidth - margin, y + 28, { align: "right" });

  // Validity badge
  doc.setFillColor(...primary);
  doc.roundedRect(pageWidth - margin - 45, y + 38, 45, 18, 3, 3, "F");
  doc.setTextColor(...dark);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${budget.validity} dias`, pageWidth - margin - 22.5, y + 50, { align: "center" });

  // Divider
  doc.setFillColor(...primary);
  doc.rect(margin, y + 48, contentWidth, 3, "F");

  y += 62;

  // ===== CLIENT CARD =====
  doc.setFillColor(...white);
  doc.setDrawColor(...gray200);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 38, 6, 6, "FD");

  // Avatar
  doc.setFillColor(...primary);
  doc.circle(margin + 24, y + 19, 12, "F");
  doc.setTextColor(...dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(budget.clientName ? budget.clientName.charAt(0).toUpperCase() : "C", margin + 24, y + 23, { align: "center" });

  // Client name
  doc.setTextColor(...dark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(budget.clientName || "Cliente", margin + 44, y + 14);

  // Contacts
  doc.setTextColor(...gray500);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let contactX = margin + 44;
  if (budget.clientPhone) {
    doc.text(`Tel: ${budget.clientPhone}`, contactX, y + 26);
    contactX += 55;
  }
  if (budget.clientEmail) {
    doc.text(`Email: ${budget.clientEmail}`, contactX, y + 26);
  }

  y += 48;

  // ===== ITEMS TABLE =====
  const rowHeight = 13;
  const headerHeight = 14;

  // Table header
  doc.setFillColor(...dark);
  doc.roundedRect(margin, y, contentWidth, headerHeight, 3, 3, "F");

  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  const colNum = 12;
  const colQtd = 26;
  const colVlr = 40;
  const colSub = 40;
  const colDesc = contentWidth - colNum - colQtd - colVlr - colSub;

  doc.text("#", margin + 5, y + 10);
  doc.text("DESCRIÇÃO", margin + colNum + 8, y + 10);
  doc.text("QTD", margin + colNum + colDesc + 8, y + 10, { align: "center" });
  doc.text("VALOR UNIT.", margin + colNum + colDesc + colQtd + 8, y + 10, { align: "center" });
  doc.text("SUBTOTAL", pageWidth - margin - 4, y + 10, { align: "right" });

  y += headerHeight;

  // Table rows
  budget.items.forEach((item, index) => {
    const isEven = index % 2 === 0;

    if (isEven) {
      doc.setFillColor(...gray50);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }

    doc.setDrawColor(...gray200);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    doc.setTextColor(...gray400);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(String(index + 1).padStart(2, "0"), margin + 5, y + 9);

    doc.setTextColor(...dark);
    const itemName = item.name.length > 42 ? item.name.substring(0, 39) + "..." : item.name;
    doc.text(itemName, margin + colNum + 8, y + 9);

    doc.text(String(item.quantity), margin + colNum + colDesc + 8, y + 9, { align: "center" });

    doc.text(`R$ ${item.price.toFixed(2).replace(".", ",")}`, margin + colNum + colDesc + colQtd + 8, y + 9, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${(item.quantity * item.price).toFixed(2).replace(".", ",")}`, pageWidth - margin - 4, y + 9, { align: "right" });

    y += rowHeight;
  });

  // Bottom line
  doc.setFillColor(...primary);
  doc.rect(margin, y, contentWidth, 2, "F");

  y += 12;

  // ===== TOTALS =====
  const subtotal = budget.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const discount = subtotal - budget.total;

  // Totals card
  doc.setFillColor(...white);
  doc.setDrawColor(...gray200);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 52, 4, 4, "FD");

  // Subtotal
  doc.setTextColor(...gray500);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", margin + 16, y + 18);
  doc.text(`R$ ${subtotal.toFixed(2).replace(".", ",")}`, pageWidth - margin - 16, y + 18, { align: "right" });

  // Discount
  doc.text("Desconto", margin + 16, y + 30);
  doc.text(`R$ ${discount.toFixed(2).replace(".", ",")}`, pageWidth - margin - 16, y + 30, { align: "right" });

  // Separator
  doc.setDrawColor(...gray200);
  doc.setLineWidth(0.5);
  doc.line(margin + 12, y + 38, pageWidth - margin - 12, y + 38);

  // Total label
  doc.setTextColor(...dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", margin + 16, y + 48);

  // Total value highlight
  doc.setFillColor(...primary);
  doc.roundedRect(pageWidth - margin - 70, y + 40, 70, 16, 3, 3, "F");
  doc.setTextColor(...dark);
  doc.setFontSize(14);
  doc.text(`R$ ${budget.total.toFixed(2).replace(".", ",")}`, pageWidth - margin - 16, y + 52, { align: "right" });

  y += 60;

  // ===== NOTES =====
  if (budget.notes && budget.notes.trim()) {
    doc.setFillColor(...gray100);
    doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");

    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", margin + 12, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray500);
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(budget.notes, contentWidth - 24);
    doc.text(notesLines.slice(0, 2), margin + 12, y + 18);
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
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result.includes(",")) {
          resolve(result.split(",")[1]);
        } else {
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export function downloadBudgetPDF(budget: BudgetData, logoBase64?: string, bgBase64?: string) {
  const doc = generateBudgetPDF(budget, bgBase64, logoBase64);
  const budgetNumber = budget.id || "001";
  doc.save(`orcamento-${budgetNumber}.pdf`);
}

export function previewBudgetPDF(budget: BudgetData, logoBase64?: string, bgBase64?: string): string {
  const doc = generateBudgetPDF(budget, bgBase64, logoBase64);
  return doc.output("datauristring");
}