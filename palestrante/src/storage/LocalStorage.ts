// src/storage/LocalStorage.ts
export type LocalStorageCredentials = {
  email: string;
  password: string;
};

/** Tipo com funções específicas para propriedades do local storage */
type LocalStorageDefiners<T> = {
  get: () => T | null;
  set: (value: T) => void;
  remove: () => void;
};

type LocalStorageProps = {
  /** Indica se o usuário está logado */
  logged: LocalStorageDefiners<boolean>;
  /** Token de autenticação da API */
  apiToken: LocalStorageDefiners<string>;
  /** Credenciais de login do usuário */
  loginCredentials: LocalStorageDefiners<LocalStorageCredentials>;
  /** Ações no localStorage quando login */
  login: (apiToken: string, credentials: LocalStorageCredentials) => void;
  /** Ações no localStorage quando logoff */
  logoff: () => void;
};

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function createMemoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => {
      m.set(k, v);
    },
    removeItem: (k) => {
      m.delete(k);
    },
  };
}

function getSafeStorage(): StorageLike {
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  ) {
    try {
      const t = "__ls_probe__";
      window.localStorage.setItem(t, "1");
      window.localStorage.removeItem(t);
      return window.localStorage;
    } catch {
      // quota/blocked
    }
  }
  return createMemoryStorage();
}

const storage = getSafeStorage();

export const LocalStorage: LocalStorageProps = {
  logged: {
    get() {
      try {
        const raw = storage.getItem("is_logged");
        return raw ? JSON.parse(raw) : false;
      } catch {
        return false;
      }
    },
    set(value) {
      try {
        storage.setItem("is_logged", JSON.stringify(value));
      } catch {}
    },
    remove() {
      try {
        storage.removeItem("is_logged");
      } catch {}
    },
  },

  apiToken: {
    get() {
      try {
        return storage.getItem("api_token");
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        storage.setItem("api_token", value);
      } catch {}
    },
    remove() {
      try {
        storage.removeItem("api_token");
      } catch {}
    },
  },

  loginCredentials: {
    get() {
      try {
        const raw = storage.getItem("credentials");
        return raw ? (JSON.parse(raw) as LocalStorageCredentials) : null;
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        storage.setItem("credentials", JSON.stringify(value));
      } catch {}
    },
    remove() {
      try {
        storage.removeItem("credentials");
      } catch {}
    },
  },

  login(apiToken, credentials) {
    LocalStorage.logged.set(true);
    console.log(apiToken);
    LocalStorage.apiToken.set(apiToken);
    LocalStorage.loginCredentials.set(credentials);
  },

  logoff() {
    LocalStorage.logged.set(false);
    LocalStorage.apiToken.remove();
    LocalStorage.loginCredentials.remove();
  },
};
