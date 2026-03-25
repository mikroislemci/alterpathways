import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export type ExportFormat = 'png' | 'pdf';

const pxToMm = (px: number): number => (px * 25.4) / 96;

const captureElement = async (elementId: string): Promise<HTMLCanvasElement> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  return html2canvas(element, {
    backgroundColor: '#0F0F1E',
    scale: 2,
    useCORS: true,
    logging: false,
    allowTaint: true,
    // Ignore interactive controls (share / simulate-again buttons)
    ignoreElements: (el) =>
      el.classList.contains('export-ignore') ||
      el.tagName === 'BUTTON',
  });
};

export const exportSimulationResults = async (
  elementId: string,
  format: ExportFormat,
  filename = 'my-alternate-path',
): Promise<void> => {
  const canvas = await captureElement(elementId);
  const imgData = canvas.toDataURL('image/png');

  if (format === 'png') {
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = imgData;
    link.click();
    return;
  }

  // PDF — convert canvas px to mm
  const imgWidthPx = canvas.width / 2;
  const imgHeightPx = canvas.height / 2;
  const pdfW = pxToMm(imgWidthPx);
  const pdfH = pxToMm(imgHeightPx);

  const pdf = new jsPDF({
    orientation: imgWidthPx > imgHeightPx ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfW, pdfH],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
  pdf.save(`${filename}.pdf`);
};
