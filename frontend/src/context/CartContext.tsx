import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import {
    canonicalHex,
    cartItemThumbnail,
} from "../utils/productMockup";

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
    image: string;
    artistName: string;
    /** Shown in cart for variant changes; falls back to [color] if missing */
    availableColors?: string[];
    /** PDP / listing: per-color mockups */
    colorMockups?: Record<string, { front?: string; back?: string }> | null;
    /** Product default front URL (R2) for fallback */
    mockupImageUrl?: string;
    /** Product-level back mockup URL */
    backMockupImageUrl?: string;
    defaultProductColor?: string;
    primaryColor?: string;
    /** Catalog listing default (not the same as mockupView) */
    primaryView?: "front" | "back";
    /** Which mockup side the customer is viewing in cart / added from PDP */
    mockupView?: "front" | "back";
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (productId: string, size: string, color: string) => void;
    updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
    updateItemVariant: (
        productId: string,
        oldSize: string,
        oldColor: string,
        newSize: string,
        newColor: string
    ) => void;
    updateItemMockupView: (
        productId: string,
        size: string,
        color: string,
        mockupView: "front" | "back"
    ) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
}

const CART_KEY = "teehive_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

function normalizeCartItem(raw: CartItem): CartItem {
    const color = canonicalHex(raw.color);
    const defaultProductColor = raw.defaultProductColor
        ? canonicalHex(raw.defaultProductColor)
        : color;
    const mockupView =
        raw.mockupView === "back"
            ? "back"
            : raw.mockupView === "front"
              ? "front"
              : undefined;
    const mockupImageUrl = raw.mockupImageUrl || raw.image;
    const next: CartItem = {
        ...raw,
        color,
        defaultProductColor,
        mockupView,
        mockupImageUrl,
        availableColors: raw.availableColors?.length
            ? [...new Set(raw.availableColors.map((h) => canonicalHex(h)))].filter(Boolean)
            : raw.availableColors,
    };
    return { ...next, image: cartItemThumbnail(next) };
}

function mergeDuplicateLineItems(parsed: CartItem[]): CartItem[] {
    const acc = new Map<string, CartItem>();
    for (const raw of parsed) {
        const i = normalizeCartItem(raw);
        const k = itemKey(i.productId, i.size, i.color);
        const existing = acc.get(k);
        if (!existing) {
            acc.set(k, i);
            continue;
        }
        const merged: CartItem = {
            ...existing,
            quantity: existing.quantity + i.quantity,
            mockupView: i.mockupView ?? existing.mockupView,
            backMockupImageUrl: i.backMockupImageUrl ?? existing.backMockupImageUrl,
            colorMockups: i.colorMockups ?? existing.colorMockups,
            mockupImageUrl: i.mockupImageUrl || existing.mockupImageUrl,
        };
        merged.image = cartItemThumbnail(merged);
        acc.set(k, merged);
    }
    return Array.from(acc.values());
}

function loadCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as CartItem[];
        return Array.isArray(parsed) ? mergeDuplicateLineItems(parsed) : [];
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function itemKey(productId: string, size: string, color: string) {
    return `${productId}__${size}__${canonicalHex(color)}`;
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>(loadCart);

    useEffect(() => {
        saveCart(items);
    }, [items]);

    const addItem = (item: CartItem) => {
        const normalized = normalizeCartItem(item);
        setItems((prev) => {
            const key = itemKey(
                normalized.productId,
                normalized.size,
                normalized.color
            );
            const existing = prev.find(
                (i) => itemKey(i.productId, i.size, i.color) === key
            );
            if (existing) {
                return prev.map((i) =>
                    itemKey(i.productId, i.size, i.color) === key
                        ? (() => {
                              const merged: CartItem = {
                                  ...existing,
                                  quantity: existing.quantity + normalized.quantity,
                                  mockupView:
                                      normalized.mockupView === "back" ||
                                      normalized.mockupView === "front"
                                          ? normalized.mockupView
                                          : existing.mockupView,
                                  backMockupImageUrl:
                                      normalized.backMockupImageUrl ??
                                      existing.backMockupImageUrl,
                                  colorMockups:
                                      normalized.colorMockups ?? existing.colorMockups,
                                  mockupImageUrl:
                                      normalized.mockupImageUrl ||
                                      existing.mockupImageUrl,
                              };
                              merged.image = cartItemThumbnail(merged);
                              return merged;
                          })()
                        : i
                );
            }
            return [...prev, normalized];
        });
    };

    const removeItem = (productId: string, size: string, color: string) => {
        const c = canonicalHex(color);
        setItems((prev) =>
            prev.filter(
                (i) =>
                    itemKey(i.productId, i.size, i.color) !==
                    itemKey(productId, size, c)
            )
        );
    };

    const updateQuantity = (
        productId: string,
        size: string,
        color: string,
        quantity: number
    ) => {
        const c = canonicalHex(color);
        if (quantity <= 0) {
            removeItem(productId, size, c);
            return;
        }
        setItems((prev) =>
            prev.map((i) =>
                itemKey(i.productId, i.size, i.color) ===
                itemKey(productId, size, c)
                    ? { ...i, quantity }
                    : i
            )
        );
    };

    const updateItemMockupView = (
        productId: string,
        size: string,
        color: string,
        mockupView: "front" | "back"
    ) => {
        const c = canonicalHex(color);
        const k = itemKey(productId, size, c);
        setItems((prev) =>
            prev.map((i) => {
                if (itemKey(i.productId, i.size, i.color) !== k) return i;
                const next: CartItem = { ...i, mockupView };
                return { ...next, image: cartItemThumbnail(next) };
            })
        );
    };

    const updateItemVariant = (
        productId: string,
        oldSize: string,
        oldColor: string,
        newSize: string,
        newColor: string
    ) => {
        const oldColorN = canonicalHex(oldColor);
        const newColorN = canonicalHex(newColor);
        const oldK = itemKey(productId, oldSize, oldColorN);
        const newK = itemKey(productId, newSize, newColorN);
        if (oldK === newK) return;
        setItems((prev) => {
            const oldIndex = prev.findIndex(
                (i) => itemKey(i.productId, i.size, i.color) === oldK
            );
            if (oldIndex === -1) return prev;
            const item = prev[oldIndex];
            const without = prev.filter(
                (i) => itemKey(i.productId, i.size, i.color) !== oldK
            );
            const mergeTarget = without.find(
                (i) => itemKey(i.productId, i.size, i.color) === newK
            );
            if (mergeTarget) {
                return without.map((i) =>
                    itemKey(i.productId, i.size, i.color) === newK
                        ? (() => {
                              const merged: CartItem = {
                                  ...mergeTarget,
                                  quantity: mergeTarget.quantity + item.quantity,
                                  mockupView:
                                      item.mockupView ?? mergeTarget.mockupView,
                                  colorMockups:
                                      item.colorMockups ?? mergeTarget.colorMockups,
                                  backMockupImageUrl:
                                      item.backMockupImageUrl ??
                                      mergeTarget.backMockupImageUrl,
                                  mockupImageUrl:
                                      item.mockupImageUrl || mergeTarget.mockupImageUrl,
                              };
                              merged.image = cartItemThumbnail(merged);
                              return merged;
                          })()
                        : i
                );
            }
            const moved: CartItem = {
                ...item,
                size: newSize,
                color: newColorN,
            };
            moved.image = cartItemThumbnail(moved);
            // Keep the same slot as before (avoid jumping to the end of the list)
            return [
                ...without.slice(0, oldIndex),
                moved,
                ...without.slice(oldIndex),
            ];
        });
    };

    const clearCart = () => setItems([]);

    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                updateItemVariant,
                updateItemMockupView,
                clearCart,
                itemCount,
                subtotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
};
