import client from './client';

export async function addFeature(companyId, tierId, data) {
  const res = await client.post(`/companies/${companyId}/tiers/${tierId}/features`, data);
  return res.data;
}

export async function addFeaturesBulk(companyId, tierId, features) {
  const res = await client.post(`/companies/${companyId}/tiers/${tierId}/features/bulk`, { features });
  return res.data;
}

export async function deleteFeature(companyId, tierId, featureId) {
  await client.delete(`/companies/${companyId}/tiers/${tierId}/features/${featureId}`);
}
