import c from "./client";
export const addTier = (id, d) =>
  c.post(`/companies/${id}/tiers`, d).then((r) => r.data);
export const updateTier = (id, tid, d) =>
  c.put(`/companies/${id}/tiers/${tid}`, d).then((r) => r.data);
export const deleteTier = (id, tid) =>
  c.delete(`/companies/${id}/tiers/${tid}`);
