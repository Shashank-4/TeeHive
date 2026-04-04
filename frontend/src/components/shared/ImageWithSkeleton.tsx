import { useEffect, useRef, useState } from "react";
import type { ImgHTMLAttributes } from "react";

interface ImageWithSkeletonProps extends ImgHTMLAttributes<HTMLImageElement> {
    wrapperClassName?: string;
    skeletonClassName?: string;
    /**
     * `absolute-fill` — wrapper is `absolute inset-0` so it fully covers a `relative` parent
     * (avoids conflicting `relative` + `absolute` when decorating hero backgrounds).
     */
    wrapperLayout?: "relative" | "absolute-fill";
}

export default function ImageWithSkeleton({
    src,
    alt,
    className = "",
    wrapperClassName = "",
    skeletonClassName = "",
    wrapperLayout = "relative",
    loading = "lazy",
    decoding = "async",
    ...imgProps
}: ImageWithSkeletonProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!src) {
            setIsLoaded(true);
            return;
        }

        setIsLoaded(false);

        // Cached images can be complete before onLoad handler runs.
        const img = imgRef.current;
        if (img && img.complete) {
            setIsLoaded(true);
        }
    }, [src]);

    const wrapperBase =
        wrapperLayout === "absolute-fill"
            ? "absolute inset-0 w-full h-full min-h-0"
            : "relative w-full h-full";

    return (
        <div className={`${wrapperBase} ${wrapperClassName}`.trim()}>
            {!isLoaded && (
                <div
                    className={`absolute inset-0 z-10 bg-neutral-g1 animate-pulse ${skeletonClassName}`}
                    aria-hidden="true"
                />
            )}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading={loading}
                decoding={decoding}
                onLoad={() => setIsLoaded(true)}
                onError={() => setIsLoaded(true)}
                className={`${className} transition-opacity duration-300 ${
                    isLoaded ? "opacity-100" : "opacity-0"
                }`}
                {...imgProps}
            />
        </div>
    );
}
