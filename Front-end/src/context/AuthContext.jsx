import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getJSON, setJSON, remove } from '../services/storage';
import * as api from '../services/auth';

const SESSION_KEY = 'khameo.session';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore a saved ("Remember me") session on app start.
  useEffect(() => {
    (async () => {
      const s = await getJSON(SESSION_KEY, null);
      if (s?.user) {
        api.setToken(s.token);
        const check = await api.me();
        // token rejected by the server -> forget it. No internet -> keep the session.
        if (!check.ok && check.status === 401) {
          api.setToken(null);
          await remove(SESSION_KEY);
        } else {
          setUser(s.user);
        }
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async ({ user, token }, remember) => {
    api.setToken(token);
    setUser(user);
    if (remember) await setJSON(SESSION_KEY, { user, token });
    else await remove(SESSION_KEY);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout(); // tells Laravel to delete the token (ignored if offline)
    api.setToken(null);
    setUser(null);
    await remove(SESSION_KEY);
  }, []);

  return <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
