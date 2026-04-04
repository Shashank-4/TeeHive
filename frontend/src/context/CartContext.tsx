import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";

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
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
}

const CART_KEY = "teehive_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// Composite key so the same product in different size/color are separate rows
function itemKey(productId: string, size: string, color: string) {
    return `${productId}__${size}__${color}`;
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>(loadCart);

    // Persist on every change
    useEffect(() => {
        saveCart(items);
    }, [items]);

    const addItem = (item: CartItem) => {
        setItems((prev) => {
            const key = itemKey(item.productId, item.size, item.color);
            const existing = prev.find(
                (i) => itemKey(i.productId, i.size, i.color) === key
            );
            if (existing) {
                return prev.map((i) =>
                    itemKey(i.productId, i.size, i.color) === key
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                );
            }
            return [...prev, item];
        });
    };

    const removeItem = (productId: string, size: string, color: string) => {
        setItems((prev) =>
            prev.filter(
                (i) =>
                    itemKey(i.productId, i.size, i.color) !==
                    itemKey(productId, size, color)
            )
        );
    };

    const updateQuantity = (
        productId: string,
        size: string,
        color: string,
        quantity: number
    ) => {
        if (quantity <= 0) {
            removeItem(productId, size, color);
            return;
        }
        setItems((prev) =>
            prev.map((i) =>
                itemKey(i.productId, i.size, i.color) ===
                    itemKey(productId, size, color)
                    ? { ...i, quantity }
                    : i
            )
        );
    };

    const updateItemVariant = (
        productId: string,
        oldSize: string,
        oldColor: string,
        newSize: string,
        newColor: string
    ) => {
        const oldK = itemKey(productId, oldSize, oldColor);
        const newK = itemKey(productId, newSize, newColor);
        if (oldK === newK) return;
        setItems((prev) => {
            const item = prev.find(
                (i) => itemKey(i.productId, i.size, i.color) === oldK
            );
            if (!item) return prev;
            const without = prev.filter(
                (i) => itemKey(i.productId, i.size, i.color) !== oldK
            );
            const mergeTarget = without.find(
                (i) => itemKey(i.productId, i.size, i.color) === newK
            );
            if (mergeTarget) {
                return without.map((i) =>
                    itemKey(i.productId, i.size, i.color) === newK
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                );
            }
            return [
                ...without,
                { ...item, size: newSize, color: newColor },
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
