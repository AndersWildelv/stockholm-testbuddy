import { createContext, useContext, useState, ReactNode } from "react";

const CORRECT_PASSWORD = "RegionStockholm2026";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (password: string) => void;
  signOut: () => void;
  // Keep these for compatibility but they're no-ops
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
