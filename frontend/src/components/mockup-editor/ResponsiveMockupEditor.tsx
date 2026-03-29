// frontend/src/components/mockup-editor/ResponsiveMockupEditor.tsx

import { useState, useRef, useLayoutEffect } from "react";
// CRITICAL: Import the DUMB renderer
import MockupCanvas from "./MockupCanvas";

interface DesignTransform {
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
}

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

// The interface for all props the Page Component will pass
interface ResponsiveMockupEditorProps {
    baseImageUrl: string;
    designImageUrl: string; // Made non-null since we only render if it exists
    onTransformChange: (transform: DesignTransform) => void;
    boundingBox: BoundingBox;
    baseColor: string;
    currentTransform: DesignTransform | null; // The state from the parent
}

const ResponsiveMockupEditor: React.FC<ResponsiveMockupEditorProps> = (
    props
) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                // Enforce the square aspect ratio from the UI
                setDimensions({ width, height: width });
            }
        };
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);
    console.log("responsive", dimensions.width);
    return (
        <div ref={containerRef} className="w-full h-full relative">
            {/* We only render the canvas when we have valid dimensions */}
            {dimensions.width > 0 && (
                <MockupCanvas
                    {...(props as any)} // Forcing any due to type mismatch. This component is likely obsolete since ArtistMockupCreator was rewritten
                />
            )}
        </div>
    );
};

export default ResponsiveMockupEditor;
