import AsyncStorage from '@react-native-async-storage/async-storage'

/** Tipo com as funções de manipulação para uma chave do async storage */
type AsyncStorageDefiners = {
    get: () => Promise<string | null>
    set: (value: string) => Promise<void>
    remove: () => Promise<void>
}

function createKeyManager(keyName: string): AsyncStorageDefiners {
    return {
        get: async () => await AsyncStorage.getItem(keyName),
        set: async (value: string) => await AsyncStorage.setItem(keyName, value),
        remove: async () => await AsyncStorage.removeItem(keyName),
    }
}

/** Mapeamento de chaves do async storage manager */
const ASYNC_STORAGE_KEYS = {
    TEST: "test",
} as const

/** Gerenciador do async storage */
export const AsyncStorageManager = {
    test: createKeyManager(ASYNC_STORAGE_KEYS.TEST)
}
