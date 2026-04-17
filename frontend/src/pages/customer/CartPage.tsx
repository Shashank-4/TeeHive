import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Minus,
    Plus,
    Trash2,
    Truck,
    Shield,
    ShoppingBag,
    Zap,
    ArrowRight,
    Search,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { Button } from "../../components/ui/Button";
import GstInclusiveNote from "../../components/shared/GstInclusiveNote";
import ImageWithSkeleton from "../../components/shared/ImageWithSkeleton";
import {
    cartItemThumbnail,
    cartLineHasBackMockup,
    canonicalHex,
    STOREFRONT_TEE_MOCKUP_IMAGE_CLASS,
} from "../../utils/productMockup";
import { PRODUCT_SIZES } from "../../constants/productSizes";
import {
    cartLineHasIssue,
    useCartAvailabilityValidation,
} from "../../hooks/useCartAvailabilityValidation";

export default function Cart() {
    const {
        items,
        removeItem,
        updateQuantity,
        updateItemVariant,
        updateItemMockupView,
        subtotal,
    } = useCart();

    const { loading: stockLoading, issues, fetchError, blocked: checkoutBlocked } =
        useCartAvailabilityValidation(items);

    const total = subtotal;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-neutral-g1 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 text-[350px] font-display font-black text-neutral-black/[0.02] select-none leading-none -z-0 pointer-events-none uppercase italic">CART</div>

                <div className="max-w-xl w-full relative z-10 text-center">
                    <div className="relative inline-block mb-10 group">
                        <div className="w-28 h-28 bg-white border-[3px] border-neutral-black rounded-[4px] flex items-center justify-center mx-auto shadow-[10px_10px_0px_0px_rgba(255,222,0,1)] relative z-10 transition-transform group-hover:rotate-[-4deg]">
                            <ShoppingBag className="w-14 h-14 text-neutral-black opacity-20" />
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-neutral-black border-[2.5px] border-white rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20">
                            <Search className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    <h1 className="font-display text-[clamp(42px,6vw,72px)] font-black text-neutral-black leading-[0.85] tracking-tight mb-4">
                        Your cart is <span className="text-primary italic">empty</span>
                    </h1>

                    <p className="font-display text-[15px] font-bold text-neutral-black/50 mb-12 max-w-md mx-auto leading-relaxed">
                        Nothing here yet. Have a look at the shop and add something you like.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link to="/products" className="no-underline group">
                            <Button variant="primary" size="lg" className="px-12">
                                Browse products <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-16 pt-8 border-t-[2.5px] border-neutral-black/5 flex flex-wrap justify-center gap-10 opacity-40 grayscale">
                        <div className="flex items-center gap-2 font-display text-[11px] font-bold text-neutral-black/60">
                            <Shield className="w-3.5 h-3.5 shrink-0" /> Secure checkout
                        </div>
                        <div className="flex items-center gap-2 font-display text-[11px] font-bold text-neutral-black/60">
                            <Truck className="w-3.5 h-3.5 shrink-0" /> Delivery across India
                        </div>
                        <div className="flex items-center gap-2 font-display text-[11px] font-bold text-neutral-black/60">
                            <Zap className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" /> Quick dispatch
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-white">
            <div className="w-full px-8 py-10">
                {/* Breadcrumb */}
                <div className="mb-8">
                    <Link
                        to="/products"
                        className="flex items-center gap-2 text-neutral-g4 hover:text-neutral-black transition-colors no-underline"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-display text-[11px] font-extrabold tracking-[0.5px]">Continue shopping</span>
                    </Link>
                </div>

                {(fetchError || issues.length > 0) && (
                    <div
                        className="mb-6 rounded-[4px] border-[2px] border-danger bg-danger/5 px-4 py-3 font-display text-[12px] font-bold text-danger"
                        role="alert"
                    >
                        {fetchError ? (
                            <p className="m-0">{fetchError}</p>
                        ) : (
                            <div className="space-y-2">
                                <p className="m-0 font-black uppercase tracking-wide text-[11px]">
                                    Some items can&apos;t be checked out right now
                                </p>
                                <ul className="m-0 pl-4 list-disc text-neutral-black space-y-1">
                                    {issues.map((iss, idx) => (
                                        <li key={`${iss.productId}-${iss.size}-${iss.color}-${idx}`}>{iss.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-end justify-between mb-10 pb-6 border-b-[3px] border-neutral-black">
                    <h1 className="font-display text-[clamp(32px,4vw,48px)] font-black text-neutral-black leading-none tracking-[-0.5px]">
                        Your cart <span className="text-primary italic">({items.length})</span>
                    </h1>
                    <div className="hidden sm:block text-[12px] font-display font-bold text-neutral-g3 tracking-[0.3px]">
                        Secure checkout
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
                    {/* Cart Items */}
                    <div className="space-y-4">
                        <div className="bg-neutral-white border-[3px] border-neutral-black rounded-[4px] overflow-hidden">
                            <div>
                                {items.map((item) => {
                                    const thumbSrc = cartItemThumbnail(item);
                                    const showViewToggle = cartLineHasBackMockup(item);
                                    const view = item.mockupView === "back" ? "back" : "front";
                                    const lineIssue = cartLineHasIssue(item, issues);
                                    return (
                                    <div
                                        key={`${item.productId}-${item.size}-${item.color}`}
                                        className="p-6 sm:p-8 border-b-[3px] border-neutral-black last:border-b-0 bg-white"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,160px)_1fr] gap-6 sm:gap-10 items-start">
                                            <div className="mx-auto sm:mx-0 w-full max-w-[200px] sm:max-w-none shrink-0 flex flex-col gap-2">
                                            <Link
                                                to={`/products/${item.productId}`}
                                                className="aspect-[3/4] border-[3px] border-neutral-black rounded-[2px] overflow-hidden bg-neutral-g1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] block"
                                            >
                                                <ImageWithSkeleton
                                                    src={thumbSrc}
                                                    alt={item.name}
                                                    className={`w-full h-full ${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS} hover:scale-[1.02] transition-transform duration-300`}
                                                    wrapperClassName="w-full h-full min-h-[200px] sm:min-h-0"
                                                />
                                            </Link>
                                            {showViewToggle && (
                                                <div className="flex rounded-[2px] border-[2px] border-neutral-black overflow-hidden font-display text-[9px] font-black uppercase tracking-[0.12em]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateItemMockupView(
                                                                item.productId,
                                                                item.size,
                                                                item.color,
                                                                "front"
                                                            )
                                                        }
                                                        className={`flex-1 py-2 transition-colors ${
                                                            view === "front"
                                                                ? "bg-primary text-neutral-black"
                                                                : "bg-white text-neutral-g3 hover:text-neutral-black"
                                                        }`}
                                                    >
                                                        Front
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateItemMockupView(
                                                                item.productId,
                                                                item.size,
                                                                item.color,
                                                                "back"
                                                            )
                                                        }
                                                        className={`flex-1 py-2 border-l-[2px] border-neutral-black transition-colors ${
                                                            view === "back"
                                                                ? "bg-primary text-neutral-black"
                                                                : "bg-white text-neutral-g3 hover:text-neutral-black"
                                                        }`}
                                                    >
                                                        Back
                                                    </button>
                                                </div>
                                            )}
                                            </div>

                                            <div className="flex-1 flex flex-col justify-between min-w-0 pt-0 sm:pt-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        {lineIssue && (
                                                            <p className="mb-2 rounded-[2px] border border-danger bg-danger/10 px-2 py-1.5 font-display text-[10px] font-black uppercase tracking-wide text-danger">
                                                                {lineIssue.message}
                                                            </p>
                                                        )}
                                                        <div className="font-display text-[12px] font-bold tracking-wide text-primary mb-1">{item.artistName}</div>
                                                        <Link to={`/products/${item.productId}`} className="no-underline">
                                                            <h3 className="font-display text-[24px] font-black text-neutral-black hover:text-primary transition-colors tracking-tight leading-snug">
                                                                {item.name}
                                                            </h3>
                                                        </Link>
                                                        <div className="flex flex-col gap-4 mt-6">
                                                            <div className="flex flex-col gap-2 font-display text-[11px] font-bold text-neutral-black/45 tracking-[0.3px]">
                                                                <span>Size</span>
                                                                <div className="flex flex-wrap ml-1 gap-2">
                                                                    {PRODUCT_SIZES.map((size) => (
                                                                        <button
                                                                            key={size}
                                                                            type="button"
                                                                            onClick={() =>
                                                                                updateItemVariant(
                                                                                    item.productId,
                                                                                    item.size,
                                                                                    item.color,
                                                                                    size,
                                                                                    item.color
                                                                                )
                                                                            }
                                                                            className={`min-w-[46px] h-[44px] px-1.5 sm:min-w-[52px] sm:h-[48px] rounded-[2px] border-[1.5px] font-display text-[11px] sm:text-[12px] font-black transition-all ${
                                                                                item.size === size
                                                                                    ? "border-neutral-black bg-primary text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                                                                                    : "border-neutral-black bg-white text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                                                                            }`}
                                                                        >
                                                                            {size}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 font-display text-[11px] font-bold text-neutral-black/45 tracking-[0.3px]">
                                                                <span>Color</span>
                                                                <div className="flex flex-wrap gap-2 items-center">
                                                                    {(item.availableColors?.length
                                                                        ? item.availableColors
                                                                        : [item.color]
                                                                    ).map((hex) => (
                                                                        <button
                                                                            key={hex}
                                                                            type="button"
                                                                            title={hex}
                                                                            onClick={() =>
                                                                                updateItemVariant(
                                                                                    item.productId,
                                                                                    item.size,
                                                                                    item.color,
                                                                                    item.size,
                                                                                    hex
                                                                                )
                                                                            }
                                                                            className={`w-8 h-8 rounded-full border-[2px] shrink-0 transition-transform ${
                                                                                item.color === canonicalHex(hex)
                                                                                    ? "border-neutral-black ring-2 ring-primary ring-offset-2 scale-110"
                                                                                    : "border-neutral-g2 hover:border-neutral-black"
                                                                            }`}
                                                                            style={{ backgroundColor: hex }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-display text-[24px] font-black text-neutral-black leading-none italic">
                                                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-neutral-black/35 mt-1 tracking-[0.2px]">
                                                            ₹{item.price.toLocaleString("en-IN")} each
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-10">
                                                    <div className="flex items-center border-[2.5px] border-neutral-black rounded-[4px] bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                                                            className="w-10 h-10 flex items-center justify-center hover:bg-neutral-g2 border-r-[2.5px] border-neutral-black transition-colors"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-12 text-center font-display text-[15px] font-black">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                                                            className="w-10 h-10 flex items-center justify-center hover:bg-neutral-g2 border-l-[2.5px] border-neutral-black transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.productId, item.size, item.color)}
                                                        className="font-display text-[11px] font-black tracking-[1.5px] uppercase text-neutral-black/30 hover:text-danger transition-colors flex items-center gap-2 group"
                                                    >
                                                        <Trash2 className="w-4 h-4 opacity-50 group-hover:opacity-100" /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:sticky lg:top-[160px]">
                        <div className="bg-white border-[3px] border-neutral-black rounded-[4px] p-8 lg:p-10 shadow-[12px_12px_0px_0px_rgba(255,222,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                            <h2 className="font-display text-[20px] font-black text-neutral-black tracking-[0.5px] mb-10 border-b-[3px] border-neutral-black pb-4">
                                Order summary
                            </h2>

                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between font-display text-[13px] font-bold text-neutral-black/50 tracking-[0.3px]">
                                    <span>Subtotal</span>
                                    <span className="text-neutral-black font-black">₹{subtotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between font-display text-[13px] font-bold text-neutral-black/50 tracking-[0.3px]">
                                    <span>Shipping</span>
                                    <span className="text-neutral-black font-black">
                                        <span className="text-success">Free</span>
                                    </span>
                                </div>
                                <div className="pt-2">
                                    <GstInclusiveNote className="text-neutral-black/35" />
                                </div>

                                <div className="pt-8 border-t-[3px] border-dashed border-neutral-black/10">
                                    <div className="flex justify-between items-center">
                                        <span className="font-display text-[20px] font-black text-neutral-black tracking-tight">Total</span>
                                        <span className="font-display text-[32px] font-black text-neutral-black leading-none">
                                            ₹{total.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-neutral-black/40 font-bold mt-2 text-right leading-snug">
                                        Product prices include GST. Delivery is free on all orders.
                                    </div>
                                </div>
                            </div>

                            {checkoutBlocked || stockLoading ? (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full opacity-60 cursor-not-allowed"
                                    disabled
                                    type="button"
                                >
                                    {stockLoading
                                        ? "Checking inventory…"
                                        : "Update cart to continue"}
                                </Button>
                            ) : (
                                <Link to="/order/checkout" className="no-underline">
                                    <Button variant="primary" size="lg" className="w-full">
                                        Go to checkout <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                            )}

                            <div className="mt-8 flex items-center justify-center gap-3 text-[11px] font-display font-bold text-neutral-black/35 text-center">
                                <Shield className="w-4 h-4 shrink-0" /> Payments are processed securely with Razorpay
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
