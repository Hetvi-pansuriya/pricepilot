import client from './client';

export async function addTier(companyId, data) {
  const res = await client.post(`/companies/${companyId}/tiers`, data);
  return res.data;
}

export async function updateTier(companyId, tierId, data) {
  const res = await client.put(`/companies/${companyId}/tiers/${tierId}`, data);
  return res.data;
}

export async function deleteTier(companyId, tierId) {
  await client.delete(`/companies/${companyId}/tiers/${tierId}`);
}
