import c from "./client";
export const login = (email, password) =>
  c.post("/auth/login", { email, password }).then((r) => r.data);
export const signup = (email, password) =>
  c.post("/auth/signup", { email, password }).then((r) => r.data);
export const forgotPassword = (email) =>
  c.post("/auth/forgot-password", { email, password: "" }).then((r) => r.data);
export const resetPassword = (token, new_password) =>
  c.post("/auth/reset-password", { token, new_password }).then((r) => r.data);
export const deleteAccount = () =>
  c.delete("/auth/account").then((r) => r.data);
