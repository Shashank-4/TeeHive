import { useEffect, useState } from "react";
import api from "../api/axios";
import type { CartItem } from "../context/CartContext";
import { canonicalHex } from "../utils/productMockup";

export type CartAvailabilityIssue = {
    productId: string;
    productName: string;
    size: string;
    color: string;
    message: string;
};

function cartItemsToPayload(items: CartItem[]) {
    return items.map((i) => ({
        id: i.productId,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
    }));
}

export function cartLineHasIssue(
    item: CartItem,
    issues: CartAvailabilityIssue[]
): CartAvailabilityIssue | undefined {
    return issues.find(
        (iss) =>
            iss.productId === item.productId &&
            iss.size === String(item.size || "").trim() &&
            iss.color === canonicalHex(item.color)
    );
}

export function useCartAvailabilityValidation(items: CartItem[]) {
    const [loading, setLoading] = useState(false);
    const [ok, setOk] = useState(true);
    const [issues, setIssues] = useState<CartAvailabilityIssue[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (items.length === 0) {
            setLoading(false);
            setOk(true);
            setIssues([]);
            setFetchError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setFetchError(null);

        const timer = window.setTimeout(async () => {
            try {
                const { data } = await api.post("/api/orders/validate-cart", {
                    items: cartItemsToPayload(items),
                });
                if (cancelled) return;
                const payload = data?.data;
                const nextIssues: CartAvailabilityIssue[] = Array.isArray(payload?.issues)
                    ? payload.issues
                    : [];
                setIssues(nextIssues);
                setOk(Boolean(payload?.ok));
            } catch {
                if (cancelled) return;
                setIssues([]);
                setOk(false);
                setFetchError(
                    "We could not verify inventory. Check your connection, then refresh this page."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 280);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [items]);

    const blocked = items.length > 0 && (!ok || !!fetchError);

    return { loading, ok, issues, fetchError, blocked };
}
