import isNil from "@/utils/IsNill"

type FirebaseEnv = {
    apiKey: string
    authDomain: string
    databaseURL: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
}

type envProps = {
    /** URL base do backend */
    BackendUrl: () => string,
    /** Ambiente do frontend */
    Environment: () => "testing" | "production",
    FirebaseEnv: () => FirebaseEnv,
}

/** Buscador de variáveis de ambiente */
const env : envProps = {
    BackendUrl: () => {
        const _ = String(process.env["NEXT_PUBLIC_BACKEND_URL"])
        if (_ === '' || _ === 'undefined') {
            console.error("NEXT_PUBLIC_BACKEND_URL não encontrado no ENV.")
            throw new Error("NEXT_PUBLIC_BACKEND_URL não encontrado no ENV.")
        }
        return _
    },
    Environment: () => {
        const _ = String(process.env["NEXT_PUBLIC_APP_ENV"])
        return _ === undefined || _ === null || _ === 'undefined' || _ === 'null' || _ === 'testing'
            ? "testing"
            : "production"
    },
    FirebaseEnv: () => {
        if (
            isNil(process.env["EXPO_PUBLIC_API_KEY"]) ||
            isNil(process.env["EXPO_PUBLIC_AUTH_DOMAIN"]) ||
            isNil(process.env["EXPO_PUBLIC_DATABASE_URL"]) ||
            isNil(process.env["EXPO_PUBLIC_PROJECT_ID"]) ||
            isNil(process.env["EXPO_PUBLIC_STORAGE_BUCKET"]) ||
            isNil(process.env["EXPO_PUBLIC_MESSAGING_SENDER_ID"]) ||
            isNil(process.env["EXPO_PUBLIC_APP_ID"])
        ) {
            console.error("Credenciais do firebase não encontradas no ENV.")
            throw new Error("Credenciais do firebase não encontradas no ENV.")
        }
        return {
            apiKey: String(process.env["EXPO_PUBLIC_API_KEY"]),
            authDomain: String(process.env["EXPO_PUBLIC_AUTH_DOMAIN"]),
            databaseURL: String(process.env["EXPO_PUBLIC_DATABASE_URL"]),
            projectId: String(process.env["EXPO_PUBLIC_PROJECT_ID"]),
            storageBucket: String(process.env["EXPO_PUBLIC_STORAGE_BUCKET"]),
            messagingSenderId: String(process.env["EXPO_PUBLIC_MESSAGING_SENDER_ID"]),
            appId: String(process.env["EXPO_PUBLIC_APP_ID"])
        }
    }
}

export default env