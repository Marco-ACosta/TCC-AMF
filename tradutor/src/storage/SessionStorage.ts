/** Tipo com funções específicas para propriedades do session storage */
type SessionStorageDefiners<T> = {
    get: () => T | null
    set: (value: T) => void
    remove: () => void
}

type SessionStorageProps = {
    test: SessionStorageDefiners<string>
}

export const SessionStorage: SessionStorageProps = {
    test: {
        get() {
            return sessionStorage.getItem("test")
        },
        set(value) {
            sessionStorage.setItem("test", value)
        },
        remove() {
            sessionStorage.removeItem("test")
        },
    },
}