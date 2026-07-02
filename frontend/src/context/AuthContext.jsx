import { createContext, useContext, useMemo, useState } from "react";
import * as api from "../api/auth";
const C = createContext(null);
export const useAuth = () => useContext(C);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const auth = async (fn, e, p) => {
    const d = await fn(e, p);
    localStorage.setItem("token", d.access_token);
    localStorage.setItem("email", e);
    setToken(d.access_token);
    setEmail(e);
  };
  const value = useMemo(
    () => ({
      token,
      email,
      isAuthenticated: !!token,
      login: (e, p) => auth(api.login, e, p),
      signup: (e, p) => auth(api.signup, e, p),
      logout: () => {
        localStorage.clear();
        setToken(null);
        setEmail("");
      },
      deleteAccount: async () => {
        await api.deleteAccount();
        localStorage.clear();
        setToken(null);
        setEmail("");
      },
    }),
    [token, email],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}
