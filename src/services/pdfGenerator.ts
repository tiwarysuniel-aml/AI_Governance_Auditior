import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { GovernanceReport } from './governanceEngine';

export function exportAuditReportPDF(
  prompt: string,
  response: string,
  provider: string,
  model: string,
  report: GovernanceReport
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header & Branding
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AI GOVERNANCE & RISK AUDITOR', 15, 26);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('ENTERPRISE COMPLIANCE & RISK REPORT', 15, 34);

  // Date/Time
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date(report.timestamp).toLocaleString()}`, pageWidth - 15, 26, { align: 'right' });

  // 2. Summary Dashboard Section
  let y = 50;
  
  // Score Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(15, y, 70, 30, 'FD');
  
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GOVERNANCE SCORE', 20, y + 10);
  
  // Score Color and Number
  const score = report.score;
  let scoreColor: [number, number, number] = [16, 185, 129]; // Green
  let riskText = 'LOW RISK';
  
  if (report.riskLevel === 'Critical') {
    scoreColor = [124, 58, 237]; // Violet
    riskText = 'CRITICAL RISK';
  } else if (report.riskLevel === 'High') {
    scoreColor = [239, 68, 68]; // Red
    riskText = 'HIGH RISK';
  } else if (report.riskLevel === 'Medium') {
    scoreColor = [245, 158, 11]; // Amber
    riskText = 'MEDIUM RISK';
  }
  
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFontSize(28);
  doc.text(score.toString(), 20, y + 24);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(riskText, 48, y + 23);

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.rect(90, y, pageWidth - 105, 30, 'FD');
  
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MODEL METADATA', 95, y + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Provider: ${provider.toUpperCase()}`, 95, y + 18);
  doc.text(`Model: ${model}`, 95, y + 24);

  y += 40;

  // 3. Prompt & Response Content
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Submitted Prompt:', 15, y);
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const promptLines = doc.splitTextToSize(prompt, pageWidth - 30);
  const promptHeight = promptLines.length * 5 + 4;
  doc.setFillColor(250, 250, 250);
  doc.rect(15, y, pageWidth - 30, promptHeight, 'F');
  doc.text(promptLines, 18, y + 4);
  
  y += promptHeight + 10;

  // Response Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('AI Response:', 15, y);
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const responseLines = doc.splitTextToSize(response, pageWidth - 30);
  // Cap height or handle multi-page. If response is huge, split it.
  const responseHeight = responseLines.length * 5 + 4;
  
  // Ensure we don't overflow the page before creating tables
  const availableSpace = doc.internal.pageSize.getHeight() - y - 10;
  if (responseHeight > availableSpace && responseHeight > 50) {
    // Render partial response and indicate truncated, or just draw
    doc.setFillColor(250, 250, 250);
    doc.rect(15, y, pageWidth - 30, 40, 'F');
    doc.text(responseLines.slice(0, 7), 18, y + 4);
    doc.setFont('helvetica', 'italic');
    doc.text('[...Response truncated in summary page. Complete text stored in logs...]', 18, y + 38);
    y += 48;
  } else {
    doc.setFillColor(250, 250, 250);
    doc.rect(15, y, pageWidth - 30, responseHeight, 'F');
    doc.text(responseLines, 18, y + 4);
    y += responseHeight + 10;
  }

  // 4. Detected Risks Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  
  if (report.detectedRisks.length === 0) {
    doc.text('No Risks Detected', 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text('✓ This transaction is compliant with enterprise safety protocols.', 15, y);
  } else {
    doc.text(`Detected Risks (${report.detectedRisks.length}):`, 15, y);
    y += 4;
    
    const tableData = report.detectedRisks.map(risk => [
      risk.category,
      risk.name,
      risk.severity,
      risk.location.toUpperCase(),
      risk.evidence.length > 30 ? `${risk.evidence.substring(0, 30)}...` : risk.evidence
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Category', 'Risk Name', 'Severity', 'Location', 'Flagged Evidence']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        2: { fontStyle: 'bold' } // Severity column bold
      },
      didParseCell: (data) => {
        if (data.column.index === 2) {
          const val = data.cell.raw;
          if (val === 'Critical') {
            data.cell.styles.textColor = [124, 58, 237]; // Violet
          } else if (val === 'High') {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          } else if (val === 'Medium') {
            data.cell.styles.textColor = [245, 158, 11]; // Amber
          } else {
            data.cell.styles.textColor = [16, 185, 129]; // Green
          }
        }
      }
    });
    
    // Update Y position after table
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Recommendations Page (if overflow or next page)
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }

  if (report.detectedRisks.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Governance Recommendations:', 15, y);
    y += 6;

    const uniqueRecommendations = Array.from(
      new Set(report.detectedRisks.map(r => `• [${r.category}] ${r.recommendation}`))
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    
    uniqueRecommendations.forEach(rec => {
      const recLines = doc.splitTextToSize(rec, pageWidth - 30);
      doc.text(recLines, 15, y);
      y += recLines.length * 5 + 2;
    });
  }

  // Save the report
  const filename = `AI_Governance_Audit_${report.score}_Score_${Date.now()}.pdf`;
  doc.save(filename);
}

export function exportChecklistPDF(checklistItems: { text: string; completed: boolean }[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AI GOVERNANCE AUDIT CHECKLIST', 15, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('SYSTEMATIC AUDITING VERIFICATION SHEET', 15, 34);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 25, { align: 'right' });

  let y = 60;

  // Title info
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Verification Checklist Items:', 15, y);
  y += 10;

  // Render Checkboxes
  checklistItems.forEach((item) => {
    // Checkbox box
    doc.setDrawColor(71, 85, 105);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y - 4, 5, 5, 'FD');

    if (item.completed) {
      // Draw Checkmark
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.8);
      doc.line(16, y - 2, 17.5, y - 0.5);
      doc.line(17.5, y - 0.5, 19.5, y - 3.5);
    }

    // Item text
    doc.setTextColor(item.completed ? 15 : 100);
    doc.setFont('helvetica', item.completed ? 'bold' : 'normal');
    doc.setFontSize(11);
    doc.text(item.text, 25, y);

    // Reset line width
    doc.setLineWidth(0.2);

    y += 12;
  });

  y += 10;
  
  // Signoff block
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, pageWidth - 15, y);
  
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Governance Sign-Off & Approvals', 15, y);
  y += 15;

  // Auditor name lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Lead Governance Auditor: ___________________________', 15, y);
  doc.text('Date: ___________________________', pageWidth - 80, y);
  
  y += 15;
  doc.text('Chief Compliance Officer: ___________________________', 15, y);
  doc.text('Signature: ___________________________', pageWidth - 80, y);

  doc.save(`AI_Governance_Checklist_${Date.now()}.pdf`);
}
