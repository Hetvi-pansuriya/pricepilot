/**
 * api/analysis.js — Analysis pipeline API functions.
 *
 * PURPOSE: Wraps all /analysis/* backend endpoints into simple JS functions.
 *
 * HOW THE ANALYSIS FLOW WORKS:
 *   1. User clicks "Run Analysis" → startAnalysis(companyId) is called.
 *   2. Backend creates an AnalysisSession and starts running M1-M4 modules.
 *   3. Frontend uses session_id to listen to SSE progress stream (in AnalysisWaiting.jsx).
 *   4. When progress reaches 100%, frontend calls getReport(session_id) to fetch results.
 *   5. User can download PDF via getReportPdfUrl(session_id).
 *
 * CONNECTED TO:
 *   - client.js           → Axios client with JWT auth
 *   - AnalysisWaiting.jsx → calls startAnalysis(), listens to SSE stream
 *   - History.jsx         → calls getHistory() to show past analyses
 *   - Report.jsx          → calls getReport() to fetch analysis results
 *   - backend analysis.py → all endpoints defined there
 */

// c: the shared Axios client (with JWT auth interceptor).
import c from "./client";

// startAnalysis: POST /analysis/start/{id}
// Kicks off the 4-module analysis pipeline for a company. Returns immediately (async pipeline).
// Parameters: id (string/UUID) → the company UUID to analyze
// Returns: Promise → {session_id: "uuid"} — used to poll progress and fetch the report
// CONNECTED TO: AnalysisWaiting.jsx calls this when user clicks "Start Analysis".
//               Backend creates AnalysisSession and runs M1-M4 in background.
export const startAnalysis = (id) =>
  c.post(`/analysis/start/${id}`).then((r) => r.data);

// getHistory: GET /analysis/history/{id}
// Returns a list of all past analysis runs for a company.
// Parameters: id (string/UUID) → the company UUID
// Returns: Promise → Array of AnalysisHistoryItem {session_id, status, progress, started_at, report_id}
// CONNECTED TO: History.jsx fetches this to show a timeline of past analyses.
//               Dashboard.jsx uses this to show "last run" info.
export const getHistory = (id) =>
  c.get(`/analysis/history/${id}`).then((r) => r.data);

// getReport: GET /analysis/report/{id}
// Fetches the full analysis report JSON for a completed session.
// Parameters: id (string/UUID) → the session UUID (from startAnalysis or history)
// Returns: Promise → ReportResponse {id, session_id, json_report, pdf_path, created_at}
//   json_report contains: {company, module1_revenue, module2_features, module3_benchmark, module4_recommendations}
// CONNECTED TO: Report.jsx calls this to render all 4 module results as charts and cards.
export const getReport = (id) =>
  c.get(`/analysis/report/${id}`).then((r) => r.data);

// getReportPdfUrl: GET /analysis/report/{id}/pdf
// Downloads the generated PDF report as a binary Blob.
// Parameters: id (string/UUID) → the session UUID
// responseType: "blob" → tells Axios to return the response as a Blob object (binary data)
//               instead of trying to parse it as JSON.
// Returns: Promise → Blob (the PDF file binary data)
// USAGE: After getting the blob, create a temporary URL and trigger download:
//   const url = URL.createObjectURL(blob); link.href = url; link.click();
// CONNECTED TO: Report.jsx "Download PDF" button calls this.
//               Backend serves the file from generated_pdfs/ directory.
export const getReportPdfUrl = (id) =>
  c
    .get(`/analysis/report/${id}/pdf`, { responseType: "blob" })  // responseType: "blob" = binary download
    .then((r) => r.data);  // r.data is a Blob object
