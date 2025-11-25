import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'ritmofit_credentials_secure';
const PIN_KEY = 'ritmofit_pin_secure';

// Hash simple usando Base64 (sin dependencias externas)
const simpleHash = (value) => {
    try {
        return btoa(String(value)); // Base64 encode
    } catch (err) {
        console.warn('hash error', err);
        return null;
    }
};

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

// PIN helpers
export const savePin = async (pin) => {
    if (!pin) return;
    try {
        const hash = simpleHash(pin);
        if (!hash) return;
        await SecureStore.setItemAsync(PIN_KEY, JSON.stringify({ pinHash: hash }), { keychainService: PIN_KEY });
    } catch (err) {
        console.warn('Error guardando el PIN:', err);
    }
};

export const getPinHash = async () => {
    try {
        const stored = await SecureStore.getItemAsync(PIN_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return parsed?.pinHash ?? null;
    } catch (err) {
        console.warn('Error leyendo PIN:', err);
        return null;
    }
};

export const verifyPin = async (pin) => {
    try {
        const storedHash = await getPinHash();
        if (!storedHash) return false;
        const incoming = simpleHash(pin);
        return incoming === storedHash;
    } catch (err) {
        console.warn('Error verificando PIN:', err);
        return false;
    }
};

export const clearPin = async () => {
    try {
        await SecureStore.deleteItemAsync(PIN_KEY);
    } catch (err) {
        // ignore
    }
};
