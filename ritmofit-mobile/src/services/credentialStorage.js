import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'ritmofit_credentials_secure';

export const saveCredentials = async ({ identifier, password }) => {
    if (!identifier || !password) return;
    try {
        await SecureStore.setItemAsync(
            CREDENTIALS_KEY,
            JSON.stringify({ identifier, password }),
            { keychainService: CREDENTIALS_KEY }
        );
    } catch (error) {
        console.warn('No se pudieron guardar las credenciales:', error);
    }
};

export const getCredentials = async () => {
    try {
        const stored = await SecureStore.getItemAsync(CREDENTIALS_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        if (parsed?.identifier && parsed?.password) {
            return parsed;
        }
        return null;
    } catch (error) {
        console.warn('No se pudieron leer las credenciales:', error);
        return null;
    }
};

export const clearCredentials = async () => {
    try {
        await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    } catch (error) {
        // ignore
    }
};
