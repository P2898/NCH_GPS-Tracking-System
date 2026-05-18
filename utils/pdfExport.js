// utils/pdfExport.js
// Generates a professional PDF summary report and opens the share dialog

import { Platform } from 'react-native';

let Print = null;
let Sharing = null;
if (Platform.OS !== 'web') {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
}

/**
 * Generate branded HTML for the monthly summary report.
 */
function buildReportHTML({ month, year, employeeName, employeeId, bikeNumber, totalTrips, totalKM, totalEarnings, avgKM, trips }) {
  const tripRows = trips
    .map(
      (t, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${t.dateStr || '—'}</td>
          <td>${t.distanceKM || 0} KM</td>
          <td>₹${t.earnings || 0}</td>
        </tr>`
    )
    .join('');



  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NCH GPS Tracker — Monthly Summary</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
    .header { background: linear-gradient(135deg, #333788, #252a6b); color: #fff; padding: 32px; border-radius: 12px; margin-bottom: 32px; }
    .header h1 { font-size: 24px; margin-bottom: 4px; }
    .header p { opacity: 0.8; font-size: 13px; }
    .header .employee { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 14px; opacity: 1; font-weight: 600; }
    .header .employee span { opacity: 0.7; font-weight: 400; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #f4f4fb; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #e0e1f5; }
    .stat-card .value { font-size: 28px; font-weight: 700; color: #333788; }
    .stat-card .label { font-size: 11px; color: #5c5f8a; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .stat-card.earnings .value { color: #2E7D32; }
    h2 { font-size: 16px; color: #333788; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e0e1f5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 12px; }
    th { background: #333788; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #e0e1f5; }
    tr:nth-child(even) { background: #f8f8ff; }
    .footer { text-align: center; font-size: 10px; color: #9fa5e0; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e1f5; }
    @media print { body { padding: 20px; } .header { page-break-after: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>NCH GPS Tracker</h1>
    <p>Monthly Summary Report — ${month} ${year}</p>
    <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
    <div class="employee">
      👤 ${employeeName || 'Field Executive'} <span>• ID: ${employeeId || '—'}</span> <span>• BIKE: ${bikeNumber || '—'}</span>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${totalTrips}</div>
      <div class="label">Total Trips</div>
    </div>
    <div class="stat-card">
      <div class="value">${totalKM}</div>
      <div class="label">Total KM</div>
    </div>
    <div class="stat-card earnings">
      <div class="value">₹${totalEarnings}</div>
      <div class="label">Earnings</div>
    </div>
    <div class="stat-card">
      <div class="value">${avgKM}</div>
      <div class="label">Avg KM/Trip</div>
    </div>
  </div>

  ${trips.length > 0 ? `
  <h2>Trip Details</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Date</th><th>Distance</th><th>Earnings</th></tr>
    </thead>
    <tbody>${tripRows}</tbody>
  </table>` : ''}



  <div class="footer">
    NCH GPS Tracker v1.0.0 — Confidential Report • For Internal Use Only
  </div>
</body>
</html>`;
}

/**
 * Generate and share a PDF summary report.
 * @param {Object} data - Report data (month, year, stats, trips, customers)
 */
export async function exportPDF(data) {
  const html = buildReportHTML(data);

  if (Platform.OS === 'web') {
    // On web, open a new window and trigger print/save as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    } else {
      // Fallback: download as HTML
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NCH_Summary_${data.month}_${data.year}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return;
  }

  // Native: use expo-print to generate PDF, then share
  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `NCH Summary ${data.month} ${data.year}`,
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (e) {
    console.warn('[PDF Export] Error:', e.message);
    throw e;
  }
}

export default { exportPDF };
