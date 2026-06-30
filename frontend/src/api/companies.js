import client from './client';

export async function createCompany(data) {
  const res = await client.post('/companies', data);
  return res.data;
}

export async function listCompanies() {
  const res = await client.get('/companies');
  return res.data;
}

export async function getCompany(id) {
  const res = await client.get(`/companies/${id}`);
  return res.data;
}

export async function updateCompany(id, data) {
  const res = await client.put(`/companies/${id}`, data);
  return res.data;
}

export async function deleteCompany(id) {
  await client.delete(`/companies/${id}`);
}
