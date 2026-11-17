import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "school_cbt_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session
  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Login
  const login = async (identifier, password, selectedRole) => {
    const response = await api.post("/auth/login", {
      identifier,
      password,
    });

    const { token, user: authenticatedUser } = response.data;

    if (!token || !authenticatedUser) {
      throw new Error("Invalid authentication response.");
    }

    // Confirm the account belongs to the selected role
    if (authenticatedUser.role !== selectedRole) {
      throw new Error(
        "The credentials do not belong to the selected user category.",
      );
    }

    localStorage.setItem(TOKEN_KEY, token);
    setUser(authenticatedUser);

    return authenticatedUser;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Always clear local authentication data
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
