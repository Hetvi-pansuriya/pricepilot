import c from "./client";
export const addCompetitor = (id, url) =>
  c.post(`/companies/${id}/competitors`, { url }).then((r) => r.data);
export const listCompetitors = (id) =>
  c.get(`/companies/${id}/competitors`).then((r) => r.data);
export const setManualText = (id, cid, text) =>
  c
    .patch(`/companies/${id}/competitors/${cid}/manual`, { text })
    .then((r) => r.data);
export const deleteCompetitor = (id, cid) =>
  c.delete(`/companies/${id}/competitors/${cid}`);
