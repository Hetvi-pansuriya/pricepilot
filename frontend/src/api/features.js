import c from "./client";
export const addFeature = (id, tid, d) =>
  c.post(`/companies/${id}/tiers/${tid}/features`, d).then((r) => r.data);
export const addFeaturesBulk = (id, tid, features) =>
  c
    .post(`/companies/${id}/tiers/${tid}/features/bulk`, { features })
    .then((r) => r.data);
export const deleteFeature = (id, tid, fid) =>
  c.delete(`/companies/${id}/tiers/${tid}/features/${fid}`);
