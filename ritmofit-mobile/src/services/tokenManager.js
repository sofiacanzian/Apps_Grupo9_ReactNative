// Simple token manager to avoid importing the Zustand store in API layer
// This prevents require cycles: authStore -> authService -> api -> store

let authToken = null;
let logoutHandler = null;

export const setToken = (token) => {
  authToken = token || null;
};

export const getToken = () => authToken;

export const clearToken = () => {
  authToken = null;
};

// Allow the store to register how to handle a forced logout (e.g., on 401)
export const registerLogout = (handler) => {
  logoutHandler = typeof handler === 'function' ? handler : null;
};

export const invokeLogout = () => {
  if (typeof logoutHandler === 'function') {
    try {
      logoutHandler();
    } catch (_err) {
      // swallow
    }
  }
};
