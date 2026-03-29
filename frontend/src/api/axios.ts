import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
});

api.interceptors.response.use(
    // The first function is for SUCCESSFUL responses
    (response) => response,

    // The second function is for FAILED responses (status not 2xx).

    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            originalRequest.url !== "/api/auth/refresh" &&
            !originalRequest._retry
        ) {
            // Mark this request as having been retried.
            originalRequest._retry = true;

            try {
                // Attempt to get a new access token by calling the refresh endpoint.
                // The browser will automatically send the httpOnly refresh_token cookie.
                await api.get("/api/auth/refresh");

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
