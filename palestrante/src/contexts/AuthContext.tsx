"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Screen from "@/components/base/Screen";
import { useRouter } from "next/navigation";
import { LocalStorage } from "@/storage/LocalStorage";

type AuthContextProps = { children: JSX.Element | JSX.Element[] };

type AuthContextType = {
  isLogged: boolean;
  setIsLogged: React.Dispatch<React.SetStateAction<boolean>>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logoff: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthContextComponent({ children }: AuthContextProps) {
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const router = useRouter();

  // ler do storage só no cliente
  useEffect(() => {
    setIsLogged(LocalStorage.logged.get() ?? false);
    setLoading(false);
  }, []);

  const login = async (_credentials: { email: string; password: string }) => {
    setIsLogged(true);
    LocalStorage.logged.set(true);
    router.push("/palestrante");
  };

  const logoff = async () => {
    setIsLogged(false);
    LocalStorage.logged.set(false);
    router.push("/login");
  };

  if (loading) {
    return (
      <Screen>
        <h3>Carregando...</h3>
      </Screen>
    );
  }

  return (
    <AuthContext.Provider value={{ isLogged, setIsLogged, login, logoff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthContextProvider() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext chamado fora do provider.");
  return context;
}
