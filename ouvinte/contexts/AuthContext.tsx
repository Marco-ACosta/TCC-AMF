import { createContext, JSX, useContext, useEffect, useState } from "react"
import { Screen } from "../components/base/Screen"
import Loading from "../components/base/Loading"

type AuthContextComponentProps = {
    children: JSX.Element | JSX.Element[]
}

type AuthContextProps = {
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

const AuthContext = createContext<AuthContextProps | null>(null)

/** Context de autenticação, realiza o refresh do token de autenticação e valida credenciais no localStorage */
export default function AuthContextComponent({ children }: AuthContextComponentProps) {
    const [ loading, setLoading ] = useState<boolean>(false) // TODO: Validar
    const [ isLogged, setIsLogged ] = useState<boolean>(true) // TODO: Validar

    useEffect(() => {
        // TODO: Regras de negócio para autenticação
    }, [])

    const login = async (credentials: any): Promise<void> => { }

    const register = async (credentials: any): Promise<void> => { }

    const logoff = async (): Promise<void> => { }

    if (loading) {
        return (
            <Screen>
                <Loading />
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

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("AuthContext chamado fora do provider.")
    return context
}
