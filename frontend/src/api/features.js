/**
 * api/features.js — Feature management API functions.
 *
 * PURPOSE: Wraps feature-related backend endpoints for adding and deleting features
 *          within pricing tiers.
 *
 * CONNECTED TO:
 *   - client.js         → Axios client with JWT auth
 *   - CompanySetup.jsx  → calls addFeature(), deleteFeature()
 *   - backend routers/companies.py → feature endpoints defined there
 */

import c from "./client";

// addFeature: POST /companies/{id}/tiers/{tid}/features
// Adds a single feature to a pricing tier.
// Parameters:
//   id  (string/UUID) → the company UUID
//   tid (string/UUID) → the tier UUID to add the feature to
//   d   (object)      → FeatureCreate body:
//     { feature_name: string (required), description?: string }
// Returns: Promise → FeatureResponse {id, feature_name, description}
// NOTE: Backend enforces no duplicate feature_name within the same tier (case-insensitive).
//       Duplicate will return 409 Conflict.
// CONNECTED TO: CompanySetup.jsx "Add Feature" input for each tier.
export const addFeature = (id, tid, d) =>
  c.post(`/companies/${id}/tiers/${tid}/features`, d).then((r) => r.data);

// addFeaturesBulk: POST /companies/{id}/tiers/{tid}/features/bulk
// Adds multiple features to a tier in a single request.
// Parameters:
//   id       (string/UUID) → the company UUID
//   tid      (string/UUID) → the tier UUID
//   features (Array)       → array of feature name strings or FeatureCreate objects
// Returns: Promise → Array of FeatureResponse objects
// NOTE: This endpoint may not be implemented on the backend (check companies.py).
//       Used for importing multiple features at once (e.g., from a template).
// CONNECTED TO: CompanySetup.jsx bulk-import flow (if enabled).
export const addFeaturesBulk = (id, tid, features) =>
  c
    .post(`/companies/${id}/tiers/${tid}/features/bulk`, { features })
    .then((r) => r.data);

// deleteFeature: DELETE /companies/{id}/tiers/{tid}/features/{fid}
// Removes a single feature from a tier.
// Parameters:
//   id  (string/UUID) → the company UUID
//   tid (string/UUID) → the tier UUID
//   fid (string/UUID) → the feature UUID to delete
// Returns: Promise → empty (204 No Content)
// CONNECTED TO: CompanySetup.jsx × button next to each feature name.
export const deleteFeature = (id, tid, fid) =>
  c.delete(`/companies/${id}/tiers/${tid}/features/${fid}`);
