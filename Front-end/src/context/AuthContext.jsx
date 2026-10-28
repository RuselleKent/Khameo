import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getJSON, setJSON, remove } from '../services/storage';
import * as api from '../services/auth';

const SESSION_KEY = 'khameo.session';
const AuthContext = createContext(null);

// Nagbabantay kung sino ang naka-login. Lahat ng screen ay nakakakuha nito gamit ang useAuth().
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false); // tapos na bang tingnan kung may naka-save na session?

    // Pagbukas ng app: ibalik ang naka-save na session ("Remember me")
    useEffect(() => {
        (async () => {
            const saved = await getJSON(SESSION_KEY, null);

            if (saved?.user) {
                api.setToken(saved.token);
                const check = await api.me();

                if (!check.ok && check.status === 401) {
                    // Tinanggihan ng server ang token (expired): kalimutan na ito
                    api.setToken(null);
                    await remove(SESSION_KEY);
                } else {
                    // OK, o walang internet: panatilihin ang session
                    setUser(saved.user);
                }
            }
            setReady(true);
        })();
    }, []);

    // Pagka-login: i-save ang token. Naka-save sa phone lang kapag "Remember me".
    const signIn = useCallback(async ({ user, token }, remember) => {
        api.setToken(token);
        setUser(user);

        if (remember) await setJSON(SESSION_KEY, { user, token });
        else await remove(SESSION_KEY);
    }, []);

    // Pag-logout: sabihan ang Laravel na burahin ang token (okay lang kung offline)
    const signOut = useCallback(async () => {
        await api.logout();
        api.setToken(null);
        setUser(null);
        await remove(SESSION_KEY);
    }, []);

    return <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
