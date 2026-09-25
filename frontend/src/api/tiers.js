/**
 * api/tiers.js — Pricing tier API functions.
 *
 * PURPOSE: Wraps all /companies/{id}/tiers backend endpoints.
 *
 * CONNECTED TO:
 *   - client.js         → Axios client with JWT auth
 *   - CompanySetup.jsx  → calls addTier(), updateTier(), deleteTier()
 *   - backend routers/companies.py → tier endpoints defined there
 */

import c from "./client";

// addTier: POST /companies/{id}/tiers
// Creates a new pricing tier for a company.
// Parameters:
//   id (string/UUID) → the company UUID
//   d  (object)      → TierCreate body:
//     { name: string, price: number, billing_cycle: "monthly"|"annual",
//       user_count: number, churn_rate?: number }
// Returns: Promise → TierResponse {id, company_id, name, price, billing_cycle, user_count,
//                                   churn_rate, created_at, features: []}
// CONNECTED TO: CompanySetup.jsx "Add Tier" button.
export const addTier = (id, d) =>
  c.post(`/companies/${id}/tiers`, d).then((r) => r.data);

// updateTier: PUT /companies/{id}/tiers/{tid}
// Updates an existing tier's fields (all fields must be provided — PUT replaces the whole resource).
// Parameters:
//   id  (string/UUID) → the company UUID
//   tid (string/UUID) → the tier UUID to update
//   d   (object)      → same shape as TierCreate (all fields required for PUT)
// Returns: Promise → TierResponse (updated tier data with features)
// CONNECTED TO: CompanySetup.jsx edit tier form.
export const updateTier = (id, tid, d) =>
  c.put(`/companies/${id}/tiers/${tid}`, d).then((r) => r.data);

// deleteTier: DELETE /companies/{id}/tiers/{tid}
// Deletes a tier and ALL its features (cascade delete in the backend).
// Parameters:
//   id  (string/UUID) → the company UUID
//   tid (string/UUID) → the tier UUID to delete
// Returns: Promise → empty (204 No Content)
// WARNING: Also deletes all Feature rows for this tier (CASCADE in models.py).
// CONNECTED TO: CompanySetup.jsx delete tier button.
export const deleteTier = (id, tid) =>
  c.delete(`/companies/${id}/tiers/${tid}`);
