"use client"

import { createContext, useContext, useEffect, useState } from "react"
import Screen from "@/components/base/Screen"

type AuthContextProps = {
    children: JSX.Element | JSX.Element[]
}

type AuthContext = {
    isLogged: boolean
    /** Usando com o hook useTransition, pode não realizar um refresh no componente se necessário */
    setIsLogged: React.Dispatch<React.SetStateAction<boolean>>
    /** Função para login */
    login: (credentials: any) => Promise<void>
    /** Função para cadastro */
    register: (credentials: any) => Promise<void>
    /** Função para logoff */
    logoff: () => Promise<void>
}

const AuthContext = createContext<AuthContext | null>(null)

/** Context de autenticação, realiza o refresh do token de autenticação e valida credenciais no localStorage */
export default function AuthContextComponent({ children }: AuthContextProps) {
    const [ loading, setLoading ] = useState<boolean>(false)
    const [ isLogged, setIsLogged ] = useState<boolean>(false)

    useEffect(() => {
        // TODO: Regras de negócio para autenticação
    }, [])

    const login = async (credentials: any): Promise<void> => { }

    const register = async (credentials: any): Promise<void> => { }

    const logoff = async (): Promise<void> => { }

    if (loading) {
        return (
            <Screen>
                <h3>Carregando...</h3>
            </Screen>
        )
    }

    return (
        <AuthContext.Provider value={{
            isLogged,
            setIsLogged,
            login,
            register,
            logoff,
        }}>
            { children }
        </AuthContext.Provider>
    )
}

export function AuthContextProvider() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("AuthContext chamado fora do provider.")
    return context
}