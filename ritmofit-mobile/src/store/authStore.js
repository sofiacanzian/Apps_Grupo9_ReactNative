import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService';
import { getUserProfile } from '../services/userService';
import { setToken, clearToken, registerLogout } from '../services/tokenManager';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isLoading: false,
            error: null,

            login: async ({ identifier, password }) => {
                set({ isLoading: true, error: null });
                try {
                    const { token, user } = await authService.login({ identifier, password });
                    setToken(token);
                    set({ token, user, isLoading: false, error: null });
                    return true;
                } catch (err) {
                    const message = err.message || 'Credenciales inválidas.';
                    clearToken();
                    set({ token: null, user: null, isLoading: false, error: message });
                    return false;
                }
            },

            logout: () => {
                authService.logout();
                clearToken();
                set({ token: null, user: null, error: null });
            },

            setUser: (user) => set({ user }),

            setSession: ({ token, user }) => {
                if (token) {
                    setToken(token);
                }
                set({ token, user, error: null });
            },

            refreshProfile: async () => {
                try {
                    const profile = await getUserProfile();
                    set({ user: profile });
                    return profile;
                } catch (err) {
                    const message = err.message || 'No se pudo actualizar el perfil.';
                    set({ error: message });
                    throw err;
                }
            },

            isAuthenticated: () => get().token !== null,
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// Register logout handler for 401 in api interceptor
registerLogout(() => {
    const { logout } = useAuthStore.getState();
    logout();
});

// Sync token manager with persisted auth state on init and subsequent changes
setToken(useAuthStore.getState().token);
useAuthStore.subscribe((state) => {
    setToken(state.token);
});
