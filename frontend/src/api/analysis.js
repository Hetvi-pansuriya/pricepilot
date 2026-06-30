import client from './client';

export async function startAnalysis(companyId) {
  const res = await client.post(`/analysis/start/${companyId}`);
  return res.data;
}

export async function getHistory(companyId) {
  const res = await client.get(`/analysis/history/${companyId}`);
  return res.data;
}

export async function getReport(sessionId) {
  const res = await client.get(`/analysis/report/${sessionId}`);
  return res.data;
}

export function getReportPdfUrl(sessionId) {
  const baseUrl = import.meta.env.VITE_API_URL;
  return `${baseUrl}/analysis/report/${sessionId}/pdf`;
}
