"use client";

import { createContext, useContext, useState } from "react";
import Screen from "@/components/base/Screen";
import { LoadingBlock } from "@/components/base/LoadState";

type InitialContextProps = {
  children: JSX.Element | JSX.Element[];
};

type InitialContext = {};

const InitialContext = createContext<InitialContext | null>(null);

export default function InitialContextComponent({
  children,
}: InitialContextProps) {
  const [loading, setLoading] = useState<boolean>(false);

  if (loading) {
    return (
      <Screen>
        <LoadingBlock full />
      </Screen>
    );
  }

  return (
    <InitialContext.Provider value={{}}>{children}</InitialContext.Provider>
  );
}

export function InitialContextProvider() {
  const context = useContext(InitialContext);
  if (!context) throw new Error("InitialContext chamado fora do provider.");
  return context;
}
