import { useSyncExternalStore } from "react";
import api from "../api/axios";
import { resolveSiteHeaderLogoSrc, SITE_HEADER_LOGO_FALLBACK_SRC } from "../constants/siteLogo";

const listeners = new Set<() => void>();
let snapshot = SITE_HEADER_LOGO_FALLBACK_SRC;
let inflight: Promise<void> | null = null;

function notify() {
    listeners.forEach((l) => l());
}

function startFetch() {
    if (inflight) return;
    inflight = api
        .get("/api/config/site_banners")
        .then((res) => {
            const next = resolveSiteHeaderLogoSrc(res.data?.data?.config?.headerLogo);
            if (next !== snapshot) {
                snapshot = next;
                notify();
            }
        })
        .catch(() => {
            if (snapshot !== SITE_HEADER_LOGO_FALLBACK_SRC) {
                snapshot = SITE_HEADER_LOGO_FALLBACK_SRC;
                notify();
            }
        })
        .finally(() => {
            inflight = null;
        });
}

function subscribe(cb: () => void) {
    listeners.add(cb);
    startFetch();
    return () => {
        listeners.delete(cb);
    };
}

function getSnapshot() {
    startFetch();
    return snapshot;
}

/** Resolved `headerLogo` from `site_banners`, deduped across the app; falls back to horizontal SVG. */
export function useSiteHeaderLogo(): string {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
