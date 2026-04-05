import axios from "axios";

/**
 * When VITE_API_URL is unset or empty, use same-origin `/api` so Vite can proxy to the backend (see vite.config.ts).
 * Set VITE_API_URL only when the API is on a different origin (e.g. production or a custom backend port without proxy).
 */
const envApi = import.meta.env.VITE_API_URL as string | undefined;
const baseURL =
    envApi != null && String(envApi).trim() !== ""
        ? String(envApi).replace(/\/$/, "")
        : "";

const api = axios.create({
    baseURL,
    withCredentials: true,
});

/** Single in-flight refresh so many parallel 401s do not stampede `/api/auth/refresh`. */
let refreshInFlight: Promise<void> | null = null;

function refreshSession(): Promise<void> {
    if (!refreshInFlight) {
        refreshInFlight = api
            .get("/api/auth/refresh")
            .then(() => undefined)
            .finally(() => {
                refreshInFlight = null;
            });
    }
    return refreshInFlight;
}

/** 401 from these routes means bad credentials / OTP, not "session expired" — do not try refresh. */
function isPublicAuthFailureUrl(url: string | undefined): boolean {
    if (!url) return false;
    const path = url.replace(/^https?:\/\/[^/]+/, "");
    const paths = [
        "/api/auth/signin",
        "/api/auth/signup",
        "/api/auth/verify-otp",
        "/api/auth/resend-otp",
        "/api/auth/google",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
    ];
    return paths.some((p) => path.includes(p));
}

api.interceptors.response.use(
    // The first function is for SUCCESSFUL responses
    (response) => response,

    // The second function is for FAILED responses (status not 2xx).

    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            originalRequest.url !== "/api/auth/refresh" &&
            !isPublicAuthFailureUrl(originalRequest.url) &&
            !originalRequest._retry
        ) {
            // Mark this request as having been retried.
            originalRequest._retry = true;

            try {
                // Attempt to get a new access token by calling the refresh endpoint.
                // The browser will automatically send the httpOnly refresh_token cookie.
                await refreshSession();

                // If the refresh call was successful, the new access_token cookie is now set.
                // We can now retry the original request that failed.
                // Axios will automatically use the new cookie.
                return api(originalRequest);
            } catch (refreshError) {
                // If the refresh token is invalid or expired, this call will fail.
                // This means the user's session is truly over.
                // We reject the promise, which will be caught by our component's logic.
                // Here you could also trigger a global logout state or redirect.
                console.error("Session expired. Please log in again.");
                return Promise.reject(refreshError);
            }
        }

        // For any other error, we just pass it along.
        return Promise.reject(error);
    }
);
export default api;
