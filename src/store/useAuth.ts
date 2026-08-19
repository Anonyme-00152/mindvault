import { useState } from 'react';

const AUTH_STORAGE_KEY = 'mindvault_auth_v1';
const STORED_USERNAME = 'ebubekir-5267';
const STORED_PASSWORD = 'aKq3qke$8rkGNPqD7EAXS$?BJam?#M&xo6$7f!a5';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}

function getStoredAuth(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, username: null };
    return JSON.parse(raw);
  } catch {
    return { isAuthenticated: false, username: null };
  }
}

function saveAuth(auth: AuthState) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {}
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => getStoredAuth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = (username: string, password: string) => {
    setLoading(true);
    setError('');

    // Vérification simple et synchrone
    if (username.trim() === STORED_USERNAME && password.trim() === STORED_PASSWORD) {
      const newAuth: AuthState = { isAuthenticated: true, username: username.trim() };
      setAuth(newAuth);
      saveAuth(newAuth);
      setLoading(false);
    } else {
      setError('Identifiant ou mot de passe incorrect.');
      setLoading(false);
    }
  };

  const logout = () => {
    const newAuth: AuthState = { isAuthenticated: false, username: null };
    setAuth(newAuth);
    saveAuth(newAuth);
  };

  return {
    ...auth,
    login,
    logout,
    loading,
    error,
    setError,
  };
}
