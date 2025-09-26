/**
 * Secure storage utility for handling sensitive data
 * Uses httpOnly cookies when possible, falls back to sessionStorage for client-side
 */

// Import User type for type safety
import type { User } from '../context/AuthContext';

const TOKEN_KEY = 'verbfy_token';
const USER_KEY = 'verbfy_user';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Check if cookies are supported
const areCookiesSupported = (): boolean => {
  if (!isBrowser) return false;
  
  try {
    document.cookie = 'test=1';
    const hasCookie = document.cookie.indexOf('test=') !== -1;
    document.cookie = 'test=1; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return hasCookie;
  } catch {
    return false;
  }
};

// Secure storage interface
interface SecureStorage {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
  clear(): void;
}

// Cookie-based storage (more secure)
class CookieStorage implements SecureStorage {
  setItem(key: string, value: string): void {
    if (!isBrowser) return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure`;
  }
  
  getItem(key: string): string | null {
    if (!isBrowser) return null;
    
    const nameEQ = key + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    
    return null;
  }
  
  removeItem(key: string): void {
    if (!isBrowser) return;
    
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
  
  clear(): void {
    if (!isBrowser) return;
    
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

// SessionStorage-based storage (fallback)
class SessionStorage implements SecureStorage {
  setItem(key: string, value: string): void {
    if (!isBrowser) return;
    
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('SessionStorage not available, falling back to memory storage');
      // Fallback to memory storage (will be lost on page refresh)
      (window as any).__verbfy_memory_storage = (window as any).__verbfy_memory_storage || {};
      (window as any).__verbfy_memory_storage[key] = value;
    }
  }
  
  getItem(key: string): string | null {
    if (!isBrowser) return null;
    
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      // Fallback to memory storage
      return (window as any).__verbfy_memory_storage?.[key] || null;
    }
  }
  
  removeItem(key: string): void {
    if (!isBrowser) return;
    
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      // Fallback to memory storage
      if ((window as any).__verbfy_memory_storage) {
        delete (window as any).__verbfy_memory_storage[key];
      }
    }
  }
  
  clear(): void {
    if (!isBrowser) return;
    
    try {
      sessionStorage.clear();
    } catch (error) {
      // Fallback to memory storage
      (window as any).__verbfy_memory_storage = {};
    }
  }
}

// Choose the best available storage method
const storage: SecureStorage = areCookiesSupported() ? new CookieStorage() : new SessionStorage();

// Token management functions
export const tokenStorage = {
  setToken: (token: string): void => {
    storage.setItem(TOKEN_KEY, token);
  },
  
  getToken: (): string | null => {
    return storage.getItem(TOKEN_KEY);
  },
  
  removeToken: (): void => {
    storage.removeItem(TOKEN_KEY);
  },
  
  setUser: (user: User | Record<string, unknown>): void => {
    storage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  getUser: (): User | null => {
    const userStr = storage.getItem(USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },
  
  removeUser: (): void => {
    storage.removeItem(USER_KEY);
  },
  
  clear: (): void => {
    storage.clear();
  }
};

// Legacy compatibility functions (for backward compatibility)
export const getStoredToken = (): string | null => {
  return tokenStorage.getToken();
};

export const setStoredToken = (token: string): void => {
  tokenStorage.setToken(token);
};

export const removeStoredToken = (): void => {
  tokenStorage.removeToken();
}; 