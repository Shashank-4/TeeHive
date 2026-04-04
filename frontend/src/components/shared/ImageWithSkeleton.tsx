import { useEffect, useRef, useState } from "react";
import type { ImgHTMLAttributes } from "react";

interface ImageWithSkeletonProps extends ImgHTMLAttributes<HTMLImageElement> {
    wrapperClassName?: string;
    skeletonClassName?: string;
}

export default function ImageWithSkeleton({
    src,
    alt,
    className = "",
    wrapperClassName = "",
    skeletonClassName = "",
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

    return (
        <div className={`relative w-full h-full ${wrapperClassName}`}>
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
