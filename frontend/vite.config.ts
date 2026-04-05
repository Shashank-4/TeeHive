import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    // Use 127.0.0.1 (not localhost) so Node connects over IPv4; on many OSes "localhost" hits ::1 first
    // while Express listens on 127.0.0.1 only → ECONNREFUSED from the Vite proxy.
    const apiTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000";

    return {
        plugins: [react()],
        server: {
            proxy: {
                "/api": {
                    target: apiTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});
