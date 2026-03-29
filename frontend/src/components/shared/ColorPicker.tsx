// frontend/src/components/mockup-editor/ColorPicker.tsx

import React from "react";

export enum TShirtColor {
    White = "#ffffff",
    Black = "#202020",
    HeatherGrey = "#afafaf",
    Navy = "#032d49",
    Red = "#ce051f",
    RoyalBlue = "#101c86",
}

interface ColorPickerProps {
    selectedColor: TShirtColor;
    onColorSelect: (color: TShirtColor) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
    selectedColor,
    onColorSelect,
}) => {
    return (
        <div className="flex flex-wrap gap-3">
            {(Object.values(TShirtColor) as TShirtColor[]).map((color) => (
                <button
                    key={color}
                    onClick={() => onColorSelect(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${
                        selectedColor === color
                            ? "border-indigo-500 scale-110 shadow-md"
                            : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} color`}
                />
            ))}
        </div>
    );
};
