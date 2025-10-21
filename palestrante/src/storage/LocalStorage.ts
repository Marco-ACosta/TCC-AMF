// src/storage/LocalStorage.ts
export type LocalStorageCredentials = {
  email: string;
  password: string;
};

type LocalStorageDefiners<T> = {
  get: () => T | null;
  set: (value: T) => void;
  remove: () => void;
};

type LocalStorageProps = {
  logged: LocalStorageDefiners<boolean>;
  apiToken: LocalStorageDefiners<string>;
  loginCredentials: LocalStorageDefiners<LocalStorageCredentials>;
  userRole: LocalStorageDefiners<string>;
  userId: LocalStorageDefiners<string>;
  login: (apiToken: string, credentials: LocalStorageCredentials) => void;
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
    } catch {}
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

  userRole: {
    get() {
      try {
        return storage.getItem("user_role");
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    set(value) {
      try {
        storage.setItem("user_role", value);
      } catch {}
    },
    remove() {
      try {
        storage.removeItem("user_role");
      } catch {}
    },
  },

  userId: {
    get() {
      try {
        return storage.getItem("user_id");
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    set(value) {
      try {
        storage.setItem("user_id", value);
      } catch {}
    },
    remove() {
      try {
        storage.removeItem("user_id");
      } catch {}
    },
  },

  login(apiToken, credentials) {
    LocalStorage.logged.set(true);
    LocalStorage.apiToken.set(apiToken);
    LocalStorage.loginCredentials.set(credentials);
  },

  logoff() {
    LocalStorage.logged.set(false);
    LocalStorage.apiToken.remove();
    LocalStorage.loginCredentials.remove();
  },
};
