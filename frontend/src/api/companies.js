import c from "./client";
export const createCompany = (d) => c.post("/companies", d).then((r) => r.data);
export const listCompanies = () => c.get("/companies").then((r) => r.data);
export const getCompany = (id) => c.get(`/companies/${id}`).then((r) => r.data);
export const updateCompany = (id, d) =>
  c.put(`/companies/${id}`, d).then((r) => r.data);
export const deleteCompany = (id) => c.delete(`/companies/${id}`);
