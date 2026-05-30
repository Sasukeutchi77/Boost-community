import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, type User } from "@workspace/api-client-react";

const TOKEN_KEY = "boost_token";

let _cachedToken: string | null = null;

export async function getStoredToken(): Promise<string | null> {
  if (_cachedToken !== null) return _cachedToken;
  try {
    _cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
    return _cachedToken;
  } catch {
    return null;
  }
}

async function saveToken(token: string): Promise<void> {
  _cachedToken = token;
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

async function clearToken(): Promise<void> {
  _cachedToken = null;
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    getStoredToken().then((t) => {
      setToken(t);
      setIsBootstrapping(false);
    });
  }, []);

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    } as never,
  });

  const login = useCallback(async (newToken: string) => {
    await saveToken(newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  const isLoading = isBootstrapping || (!!token && isUserLoading);

  return (
    <AuthContext.Provider
      value={{
        user: (user as User | null | undefined) ?? null,
        isLoading,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
