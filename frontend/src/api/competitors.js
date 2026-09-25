/**
 * api/competitors.js — Competitor management API functions.
 *
 * PURPOSE: Wraps all competitor-related backend endpoints.
 *
 * CONNECTED TO:
 *   - client.js         → Axios client with JWT auth
 *   - CompanySetup.jsx  → calls addCompetitor(), listCompetitors(), setManualText(), deleteCompetitor()
 *   - backend routers/competitors.py → endpoints defined there
 *   - scraper.py        → backend triggers scrape after addCompetitor()
 */

import c from "./client";

// addCompetitor: POST /companies/{id}/competitors
// Adds a competitor URL. Backend saves it and immediately starts scraping in background.
// Parameters:
//   id  (string/UUID) → the company UUID
//   url (string)      → the competitor's pricing page URL (must be valid HTTP/HTTPS URL)
// Returns: Promise → CompetitorResponse {id, company_id, url, scrape_status: "pending", ...}
// NOTE: scrape_status starts as "pending" — frontend should poll or refresh to see updated status.
// CONNECTED TO: CompanySetup.jsx "Add Competitor" form submits this.
export const addCompetitor = (id, url) =>
  c.post(`/companies/${id}/competitors`, { url }).then((r) => r.data);

// listCompetitors: GET /companies/{id}/competitors
// Returns all competitor entries for a company with their scrape statuses.
// Parameters: id (string/UUID) → the company UUID
// Returns: Promise → Array of CompetitorResponse {id, url, scrape_status, clean_scraped_text, ...}
// CONNECTED TO: CompanySetup.jsx loads this on mount to show existing competitors.
export const listCompetitors = (id) =>
  c.get(`/companies/${id}/competitors`).then((r) => r.data);

// setManualText: PATCH /companies/{id}/competitors/{cid}/manual
// Manually provides competitor pricing text when scraping fails.
// Parameters:
//   id   (string/UUID) → the company UUID
//   cid  (string/UUID) → the competitor UUID
//   text (string)      → the manually pasted competitor pricing page content
// Returns: Promise → CompetitorResponse with scrape_status: "manual"
// USE CASE: If a competitor uses a JS-only pricing page that Playwright can't scrape,
//           the user can copy-paste the text from their browser into this field.
// CONNECTED TO: CompanySetup.jsx "Paste manually" option shown when scrape_status is "manual_required".
export const setManualText = (id, cid, text) =>
  c
    .patch(`/companies/${id}/competitors/${cid}/manual`, { text })
    .then((r) => r.data);

// deleteCompetitor: DELETE /companies/{id}/competitors/{cid}
// Removes a competitor entry (deletes the DB row, no cascade needed).
// Parameters:
//   id  (string/UUID) → the company UUID
//   cid (string/UUID) → the competitor UUID to delete
// Returns: Promise → empty (204 No Content)
// CONNECTED TO: CompanySetup.jsx delete button on each competitor row.
export const deleteCompetitor = (id, cid) =>
  c.delete(`/companies/${id}/competitors/${cid}`);
