import isNil from "@/utils/IsNill"

export type LocalStorageCredentials = {
    email: string
    password: string
}

/** Tipo com funções específicas para propriedades do local storage */
type LocalStorageDefiners<T> = {
    get: () => T | null
    set: (value: T) => void
    remove: () => void
}

type LocalStorageProps = {
    /** Token de autenticação da API */
    apiToken: LocalStorageDefiners<string>
    /** Credenciais de login do usuário */
    loginCredentials: LocalStorageDefiners<LocalStorageCredentials>
    /** Ações no localStorage quando login */
    login: (apiToken: string, credentials: LocalStorageCredentials) => void
    /** Ações no localStorage quando logoff */
    logoff: () => void
}

export const LocalStorage: LocalStorageProps = {
    apiToken: {
        get() {
            return localStorage.getItem("api_token")
        },
        set(value) {
            localStorage.setItem("api_token", value)
        },
        remove() {
            localStorage.removeItem("api_token")
        },
    },
    loginCredentials: {
        get() {
            return !isNil(localStorage.getItem("credentials"))
                ? JSON.parse(localStorage.getItem("credentials")!) as LocalStorageCredentials 
                : null
        },
        set(value) {
            localStorage.setItem("credentials", JSON.stringify(value))
        },
        remove() {
            localStorage.removeItem("credentials")
        },
    },
    login(apiToken, credentials) {
        LocalStorage.loginCredentials.set(credentials)
        LocalStorage.apiToken.set(apiToken)
    },
    logoff() {
        LocalStorage.loginCredentials.remove()
        LocalStorage.apiToken.remove()
    },
}