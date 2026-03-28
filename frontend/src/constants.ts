// URL for the realistic T-shirt base image
// Transparent PNG allows for accurate recoloring without affecting the background
export const TSHIRT_FRONT_URL = "/mockups/white-front.png";
export const TSHIRT_BACK_URL = "/mockups/white-back.png";

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 600;

// Defines the printable area relative to the canvas size
// Centered on the front of the T-shirt
// Canvas Width: 500. Print Width: 200. Center X: (500 - 200) / 2 = 150.
export const PRINT_AREA_FRONT = { x: 165, y: 200, width: 173, height: 220 };
export const PRINT_AREA_BACK = { x: 165, y: 200, width: 173, height: 220 };
