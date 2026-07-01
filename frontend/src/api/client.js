import axios from "axios";
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });
client.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
client.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !e.config?.url?.startsWith("/auth/")) {
      localStorage.removeItem("token");
      window.location.assign("/login");
    }
    return Promise.reject({
      detail: e.response?.data?.detail || e.message || "Something went wrong",
    });
  },
);
export default client;
