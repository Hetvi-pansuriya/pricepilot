import client from './client';

export async function addCompetitor(companyId, url) {
  const res = await client.post(`/companies/${companyId}/competitors`, { url });
  return res.data;
}

export async function listCompetitors(companyId) {
  const res = await client.get(`/companies/${companyId}/competitors`);
  return res.data;
}

export async function setManualText(companyId, competitorId, text) {
  const res = await client.patch(`/companies/${companyId}/competitors/${competitorId}/manual`, { text });
  return res.data;
}

export async function deleteCompetitor(companyId, competitorId) {
  await client.delete(`/companies/${companyId}/competitors/${competitorId}`);
}
