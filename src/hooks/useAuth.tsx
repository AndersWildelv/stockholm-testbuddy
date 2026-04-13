import { createContext, useContext, useState, type ReactNode } from "react";

const CORRECT_PASSWORD = "RegionStockholm2026";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  gdprAccepted: boolean;
  acceptGdpr: () => void;
  signIn: (password: string) => void;
  signOut: () => void;
  session: { user: { id: string } } | null;
  user: { id: string; email: string } | null;
  role: "admin" | "viewer" | null;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("rs_authenticated") === "true";
  });
  const [gdprAccepted, setGdprAccepted] = useState(() => {
    return sessionStorage.getItem("rs_gdpr_accepted") === "true";
  });

  const acceptGdpr = () => {
    sessionStorage.setItem("rs_gdpr_accepted", "true");
    setGdprAccepted(true);
  };

  const signIn = (password: string) => {
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem("rs_authenticated", "true");
      setIsAuthenticated(true);
    } else {
      throw new Error("Fel lösenord");
    }
  };

  const signOut = () => {
    sessionStorage.removeItem("rs_authenticated");
    setIsAuthenticated(false);
  };

  const fakeUser = isAuthenticated ? { id: "local-user", email: "user@local" } : null;
  const fakeSession = isAuthenticated ? { user: fakeUser! } : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin: true,
        loading: false,
        gdprAccepted,
        acceptGdpr,
        signIn,
        signOut,
        session: fakeSession,
        user: fakeUser,
        role: "admin",
        signUp: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
