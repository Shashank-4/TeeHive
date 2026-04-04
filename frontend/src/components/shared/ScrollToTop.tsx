import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function scrollViewportToTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;
}

/**
 * Resets document scroll on SPA navigations. Uses useLayoutEffect so the scroll
 * runs before paint; useEffect can run too late (user still sees old scroll offset).
 * BrowserRouter does not reset scroll by default.
 */
export default function ScrollToTop() {
    const { pathname, search, hash, key } = useLocation();

    useLayoutEffect(() => {
        scrollViewportToTop();

        const h = hash;
        const raf = requestAnimationFrame(() => {
            scrollViewportToTop();
            if (h) {
                const id = h.replace(/^#/, "");
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
            }
        });

        return () => cancelAnimationFrame(raf);
    }, [pathname, search, hash, key]);

    return null;
}
