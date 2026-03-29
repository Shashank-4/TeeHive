// frontend/src/hooks/useImage.ts

import { useState, useEffect } from "react";

const useImage = (
    src: string
): { image: HTMLImageElement | undefined; isLoading: boolean } => {
    const [image, setImage] = useState<HTMLImageElement>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!src) {
            setIsLoading(false);
            return;
        }

        const img = new window.Image();
        img.src = src;
        img.crossOrigin = "Anonymous";

        const handleLoad = () => {
            setImage(img);
            setIsLoading(false);
        };

        const handleError = () => {
            console.error(`Failed to load image at src: ${src}`);
            setIsLoading(false);
        };

        img.addEventListener("load", handleLoad);
        img.addEventListener("error", handleError);

        return () => {
            img.removeEventListener("load", handleLoad);
            img.removeEventListener("error", handleError);
        };
    }, [src]);

    return { image, isLoading };
};

export default useImage;
