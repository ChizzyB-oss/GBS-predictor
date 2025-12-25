import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { authApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tempToken, setTempToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("gbs_token");
    const savedUser = localStorage.getItem("gbs_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const saveSession = (accessToken, userObj) => {
    setToken(accessToken);
    setUser(userObj);
    localStorage.setItem("gbs_token", accessToken);
    localStorage.setItem("gbs_user", JSON.stringify(userObj));
  };

  const fetchAndStoreUser = async (accessToken) => {
    const me = await authApi.getCurrentUser(accessToken);
    const userObj = {
      id: me.id,
      email: me.email,
      full_name: me.full_name,
      role: me.role,
    };
    saveSession(accessToken, userObj);
    return userObj;
  };

  // =============================
  // LOGIN
  // =============================
  const login = async ({ email, password }) => {
    const data = await authApi.loginClinician({ email, password });

    if (data.mfa_required) {
      setTempToken(data.temp_token);
      return { mfa_required: true };
    }

    return await fetchAndStoreUser(data.access_token);
  };

    const registerClinician = async ({ email, full_name, password }) => {
    setError(null);
    await authApi.registerClinician({
      email,
      full_name: full_name,
      password,
    });
  };

  // =============================
  // MFA VERIFY
  // =============================
  const verifyOtp = async (otp) => {
    if (!tempToken) {
      throw new Error("No MFA session found");
    }

    const data = await authApi.verifyMfa({
      otp,
      temp_token: tempToken,
    });

    setTempToken(null);
    return await fetchAndStoreUser(data.access_token);
  };

  // ----------------------------------
// DISABLE MFA
// ----------------------------------
const disableMfa = async () => {
  if (!token) {
    throw new Error("Not authenticated");
  }

  await authApi.disableMfa(token);

  // Optional: refresh user info (recommended for accuracy)
  const me = await authApi.getCurrentUser(token);

  const updatedUser = {
    id: me.id,
    email: me.email,
    full_name: me.full_name,
    role: me.role,
  };

  setUser(updatedUser);
  localStorage.setItem("gbs_user", JSON.stringify(updatedUser));
};

  const logout = () => {
    setUser(null);
    setToken(null);
    setTempToken(null);
    localStorage.clear();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      registerClinician,
      verifyOtp,
      disableMfa,
      logout,
    }),
    [user, token, loading, tempToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
