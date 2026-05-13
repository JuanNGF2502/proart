import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import type { Budget } from "@/shared/types";

interface PDFGeneratorOptions {
  budget: Budget;
  company?: {
    name: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    website: string;
    socialMedia: {
      instagram?: string;
      facebook?: string;
    };
  };
  includeQRCode?: boolean;
  logoUrl?: string;
}

export async function generateBudgetPDF(options: PDFGeneratorOptions): Promise<Blob> {
  const { budget, company = defaultCompany } = options;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const goldColor = { r: 212, g: 166, b: 18 };
  const darkColor = { r: 26, g: 26, b: 26 };
  const grayColor = { r: 102, g: 102, b: 102 };

  // Header
  doc.setFillColor(goldColor.r, goldColor.g, goldColor.b);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Logo area (placeholder)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 8, 30, 30, 2, 2, "F");
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("P", margin + 15, 28, { align: "center" });

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(company.name, margin + 38, 18);

  // Company contact info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(company.phone, margin + 38, 25);
  doc.text(company.email, margin + 38, 31);
  doc.text(company.website, margin + 38, 37);

  // Budget info box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 65, 8, 65, 30, 2, 2, "F");

  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ORCAMENTO", pageWidth - margin - 32.5, 15, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`#${budget.id.slice(-6).toUpperCase()}`, pageWidth - margin - 32.5, 23, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${formatDate(budget.createdAt)}`, pageWidth - margin - 32.5, 31, { align: "center" });

  // Client info section
  let yPos = 55;

  doc.setFillColor(245, 245, 245);
  doc.rect(0, yPos, pageWidth, 35, "F");

  doc.setTextColor(goldColor.r, goldColor.g, goldColor.b);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", margin, yPos + 8);

  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(budget.clientName, margin, yPos + 18);

  doc.setFont("helvetica", "normal");
  doc.text(`Telefone: ${budget.clientPhone}`, margin, yPos + 25);

  if (budget.client) {
    doc.text(`Email: ${budget.client.email || "-"}`, margin + 80, yPos + 25);
  }

  yPos += 40;

  // Items table header
  doc.setFillColor(goldColor.r, goldColor.g, goldColor.b);
  doc.rect(margin, yPos, contentWidth, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  const colWidths = [70, 25, 20, 25, 30];
  let xPos = margin + 3;

  doc.text("DESCRICAO", xPos, yPos + 5.5);
  xPos += colWidths[0];
  doc.text("MEDIDAS", xPos, yPos + 5.5);
  xPos += colWidths[1];
  doc.text("QTD", xPos, yPos + 5.5);
  xPos += colWidths[2];
  doc.text("VLR UNIT", xPos, yPos + 5.5);
  xPos += colWidths[3];
  doc.text("TOTAL", xPos, yPos + 5.5);

  // Items
  yPos += 8;
  let subtotal = 0;

  budget.items.forEach((item, index) => {
    const itemTotal = item.unitPrice * item.quantity * (1 - item.discount / 100);
    subtotal += itemTotal;

    const isOdd = index % 2 === 1;
    if (isOdd) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos, contentWidth, 10, "F");
    }

    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    xPos = margin + 3;
    doc.text(item.productName, xPos, yPos + 6.5);
    xPos += colWidths[0];
    doc.text(`${item.width || "-"} x ${item.height || "-"} ${item.unit}`, xPos, yPos + 6.5);
    xPos += colWidths[1];
    doc.text(item.quantity.toString(), xPos, yPos + 6.5);
    xPos += colWidths[2];
    doc.text(formatCurrency(item.unitPrice), xPos, yPos + 6.5);
    xPos += colWidths[3];
    doc.text(formatCurrency(itemTotal), xPos, yPos + 6.5);

    yPos += 10;
  });

  // Totals section
  yPos += 5;
  doc.setDrawColor(grayColor.r, grayColor.g, grayColor.b);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  const totalsX = pageWidth - margin - 70;

  doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
  doc.setFontSize(9);
  doc.text("Subtotal:", totalsX, yPos);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: "right" });

  yPos += 7;
  if (budget.discount > 0) {
    doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
    doc.text(`Desconto (${budget.discount}%):`, totalsX, yPos);
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.text(`-${formatCurrency(subtotal * (budget.discount / 100))}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 7;
  }

  if (budget.freight > 0) {
    doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
    doc.text("Frete:", totalsX, yPos);
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.text(formatCurrency(budget.freight), pageWidth - margin, yPos, { align: "right" });
    yPos += 7;
  }

  if (budget.deposit > 0) {
    doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
    doc.text("Sinal:", totalsX, yPos);
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.text(`-${formatCurrency(budget.deposit)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 7;
  }

  // Total
  doc.setFillColor(goldColor.r, goldColor.g, goldColor.b);
  doc.roundedRect(totalsX - 5, yPos, 75, 12, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", totalsX, yPos + 8);
  doc.text(formatCurrency(budget.total), pageWidth - margin, yPos + 8, { align: "right" });

  yPos += 20;

  // Observations
  if (budget.observations) {
    doc.setTextColor(goldColor.r, goldColor.g, goldColor.b);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVACOES:", margin, yPos);
    yPos += 6;

    doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(budget.observations, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 5;
  }

  // Terms section
  doc.setFillColor(245, 245, 245);
  doc.rect(0, yPos, pageWidth, 45, "F");

  yPos += 8;
  doc.setTextColor(goldColor.r, goldColor.g, goldColor.b);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TERMOS E CONDICOES", margin, yPos);
  yPos += 6;

  doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  const terms = [
    `* Validade do orcamento: ${budget.validity || 30} dias`,
    "* O prazo de producao comeca apos aprovacao e confirmacao do pagamento",
    "* Frete por conta do cliente (exceto negociacao previa)",
    "* Cores podem variar ligeiramente em relacao ao monitor/impressao",
    "* Garantia de 30 dias para defeitos de fabricacao",
  ];

  terms.forEach((term) => {
    doc.text(term, margin, yPos);
    yPos += 5;
  });

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 25;

  doc.setFillColor(darkColor.r, darkColor.g, darkColor.b);
  doc.rect(0, yPos, pageWidth, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(company.name, margin, yPos + 8);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(7);
  doc.text(`${company.address} | ${company.phone} | ${company.email}`, margin, yPos + 14);

  if (company.socialMedia.instagram) {
    doc.text(`Instagram: @${company.socialMedia.instagram}`, margin, yPos + 19);
  }

  doc.text("Obrigado pela preferencia!", pageWidth / 2, yPos + 10, { align: "center" });

  return doc.output("blob");
}

const defaultCompany = {
  name: "PROART",
  phone: "(11) 99999-9999",
  whatsapp: "(11) 99999-9999",
  email: "contato@proart.com.br",
  address: "Rua Exemplo, 123 - Sao Paulo, SP",
  website: "www.proart.com.br",
  socialMedia: {
    instagram: "proartgrafica",
    facebook: "proartgrafica",
  },
};

export async function downloadBudgetPDF(budget: Budget): Promise<void> {
  const blob = await generateBudgetPDF({ budget });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Orcamento_${budget.id.slice(-6).toUpperCase()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
