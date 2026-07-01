import c from "./client";
export const startAnalysis = (id) =>
  c.post(`/analysis/start/${id}`).then((r) => r.data);
export const getHistory = (id) =>
  c.get(`/analysis/history/${id}`).then((r) => r.data);
export const getReport = (id) =>
  c.get(`/analysis/report/${id}`).then((r) => r.data);
export const getReportPdfUrl = (id) =>
  c
    .get(`/analysis/report/${id}/pdf`, { responseType: "blob" })
    .then((r) => r.data);
