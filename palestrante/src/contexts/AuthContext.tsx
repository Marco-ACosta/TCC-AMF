"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Screen from "@/components/base/Screen";
import { useRouter } from "next/navigation";
import { LocalStorage } from "@/storage/LocalStorage";
import AuthService from "@/services/api/authService";
import UserService from "@/services/api/userService";
import { LoadingBlock } from "@/components/base/LoadState";
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

  useEffect(() => {
    setIsLogged(LocalStorage.logged.get() ?? false);
    setLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const response = await AuthService.Login(credentials);
    if (response.Data.error) {
      setIsLogged(false);
      LocalStorage.logged.set(false);
      const messageError =
        response.Data.error === "credenciais_invalidas"
          ? "Email ou senha incorretos."
          : response.Data.error;
      throw new Error(messageError, { cause: response.Data.error });
    }
    setIsLogged(true);
    LocalStorage.login(response.Data.access_token, credentials);
    const userData = await UserService.GetProfile();
    if (userData.Data.error) {
      setIsLogged(false);
      LocalStorage.logged.set(false);
      throw new Error(userData.ErrorMessage, {
        cause: userData.Data.error,
      });
    }
    LocalStorage.userId.set(userData.Data.user.id);
    if (userData.Data?.speaker?.id) {
      LocalStorage.userRole.set("palestrante");
      router.push("/palestrante");
      return;
    }
    if (userData.Data?.translator?.id) {
      LocalStorage.userRole.set("tradutor");
      router.push("/tradutor");
      return;
    }
    LocalStorage.userRole.set("admin");
    router.push("/admin");
  };

  const logoff = async () => {
    setIsLogged(false);
    LocalStorage.logged.set(false);
    router.push("/");
  };

  if (loading) {
    return (
      <Screen>
        <LoadingBlock full />
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
