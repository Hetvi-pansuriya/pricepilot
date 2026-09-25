/**
 * api/companies.js — Company management API functions.
 *
 * PURPOSE: Wraps all /companies backend endpoints into simple JS functions.
 *
 * CONNECTED TO:
 *   - client.js         → Axios client (JWT auth injected automatically)
 *   - Dashboard.jsx     → calls listCompanies()
 *   - CompanySetup.jsx  → calls createCompany(), getCompany(), updateCompany(), deleteCompany()
 *   - backend routers/companies.py → endpoints defined there
 */

// c: the shared Axios client (with JWT auth interceptor).
import c from "./client";

// createCompany: POST /companies
// Creates a new company for the logged-in user.
// Parameters: d (object) → {name: string, industry: string, description?: string}
// Returns: Promise → CompanyResponse {id, name, industry, description, created_at}
// CONNECTED TO: CompanySetup.jsx "Create Company" form submits this.
export const createCompany = (d) => c.post("/companies", d).then((r) => r.data);

// listCompanies: GET /companies
// Returns all companies belonging to the current user.
// No parameters — user is identified from JWT token.
// Returns: Promise → Array of CompanyResponse objects.
// CONNECTED TO: Dashboard.jsx fetches this on mount to show the company list.
export const listCompanies = () => c.get("/companies").then((r) => r.data);

// getCompany: GET /companies/{id}
// Returns full company data including tiers (with features) and competitors.
// Parameters: id (string/UUID) → the company's UUID
// Returns: Promise → CompanyDetailResponse {id, name, industry, tiers: [...], competitors: [...]}
// CONNECTED TO: CompanySetup.jsx loads this to pre-populate the setup form.
export const getCompany = (id) => c.get(`/companies/${id}`).then((r) => r.data);

// updateCompany: PUT /companies/{id}
// Updates company name, industry, and/or description.
// Parameters:
//   id (string) → the company's UUID
//   d (object)  → {name: string, industry: string, description?: string}
// Returns: Promise → CompanyResponse (updated company data)
// CONNECTED TO: CompanySetup.jsx "Update" button calls this with edited values.
export const updateCompany = (id, d) =>
  c.put(`/companies/${id}`, d).then((r) => r.data);

// deleteCompany: DELETE /companies/{id}
// Permanently deletes the company and ALL related data (tiers, features, competitors, reports).
// Parameters: id (string) → the company's UUID
// Returns: Promise → empty (204 No Content)
// WARNING: Irreversible — cascade deletes everything.
// CONNECTED TO: Dashboard.jsx delete button calls this after confirmation dialog.
export const deleteCompany = (id) => c.delete(`/companies/${id}`);
