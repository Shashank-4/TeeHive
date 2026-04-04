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

const CART_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export default function Cart() {
    const { items, removeItem, updateQuantity, updateItemVariant, subtotal } = useCart();

    const shipping = subtotal > 3000 ? 0 : 100;
    const total = subtotal + shipping;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-neutral-g1 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 text-[350px] font-display font-black text-neutral-black/[0.02] select-none leading-none -z-0 pointer-events-none uppercase italic">EMPTY</div>

                <div className="max-w-xl w-full relative z-10 text-center">
                    <div className="relative inline-block mb-10 group">
                        <div className="w-28 h-28 bg-white border-[3px] border-neutral-black rounded-[4px] flex items-center justify-center mx-auto shadow-[10px_10px_0px_0px_rgba(255,222,0,1)] relative z-10 transition-transform group-hover:rotate-[-4deg]">
                            <ShoppingBag className="w-14 h-14 text-neutral-black opacity-20" />
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-neutral-black border-[2.5px] border-white rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20">
                            <Search className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    <h1 className="font-display text-[clamp(42px,6vw,72px)] font-black text-neutral-black leading-[0.85] uppercase tracking-tight mb-8">
                        BAG_STATUS: <br />
                        <span className="text-primary italic">VACANT</span>
                    </h1>

                    <p className="font-display text-[15px] font-bold text-neutral-black/40 uppercase tracking-[2px] mb-12 max-w-sm mx-auto leading-relaxed">
                        No designer artifacts detected in your current session manifest. Synchronize your style from our latest drops.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link to="/products" className="no-underline group">
                            <Button variant="primary" size="lg" className="px-12">
                                BROWSE_INVENTORY <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-16 pt-8 border-t-[2.5px] border-neutral-black/5 flex flex-wrap justify-center gap-10 opacity-30 grayscale">
                        <div className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Shield className="w-3.5 h-3.5" /> SECURE_DATA
                        </div>
                        <div className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Truck className="w-3.5 h-3.5" /> GLOBAL_RELAY
                        </div>
                        <div className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Zap className="w-3.5 h-3.5 text-primary" fill="currentColor" /> FAST_ORIGIN
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
                        <span className="font-display text-[11px] font-extrabold uppercase tracking-[1px]">Continue Exploring</span>
                    </Link>
                </div>

                <div className="flex items-end justify-between mb-10 pb-6 border-b-[3px] border-neutral-black">
                    <h1 className="font-display text-[clamp(32px,4vw,48px)] font-black text-neutral-black leading-none uppercase tracking-[-0.5px]">
                        YOUR HIVE BAG <span className="text-primary italic">({items.length})</span>
                    </h1>
                    <div className="hidden sm:block text-[11px] font-display font-bold text-neutral-g3 tracking-[1px] uppercase">
                        SECURE CHECKOUT — 256-BIT ENCRYPTION
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
                    {/* Cart Items */}
                    <div className="space-y-4">
                        <div className="bg-neutral-white border-[3px] border-neutral-black rounded-[4px] overflow-hidden">
                            <div className="divide-y-[3px] divide-neutral-black">
                                {items.map((item) => (
                                    <div key={`${item.productId}-${item.size}-${item.color}`} className="p-8">
                                        <div className="flex flex-col sm:flex-row gap-8">
                                            <Link to={`/products/${item.productId}`} className="shrink-0 aspect-[3/4] w-36 border-[2.5px] border-neutral-black rounded-[2px] overflow-hidden bg-neutral-g1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                />
                                            </Link>

                                            <div className="flex-1 flex flex-col justify-between py-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-display text-[11px] font-black tracking-[2px] uppercase text-primary mb-1 italic">{item.artistName}</div>
                                                        <Link to={`/products/${item.productId}`} className="no-underline">
                                                            <h3 className="font-display text-[24px] font-black text-neutral-black hover:text-primary transition-colors tracking-tight uppercase leading-none">
                                                                {item.name}
                                                            </h3>
                                                        </Link>
                                                        <div className="flex flex-col gap-4 mt-6">
                                                            <div className="flex flex-col gap-2 font-display text-[10px] font-black uppercase text-neutral-black/30 tracking-[1px]">
                                                                <span>SIZE</span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {CART_SIZES.map((size) => (
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
                                                                            className={`min-w-[40px] px-2 py-1.5 rounded-[2px] border-[1.5px] font-display text-[11px] font-black transition-all ${
                                                                                item.size === size
                                                                                    ? "border-neutral-black bg-primary text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                                                    : "border-neutral-g2 bg-white text-neutral-g3 hover:border-neutral-black hover:text-neutral-black"
                                                                            }`}
                                                                        >
                                                                            {size}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 font-display text-[10px] font-black uppercase text-neutral-black/30 tracking-[1px]">
                                                                <span>COLOR</span>
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
                                                                                item.color === hex
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
                                                        <div className="text-[10px] font-black text-neutral-black/20 mt-1 uppercase tracking-[1px]">
                                                            ₹{item.price.toLocaleString('en-IN')} / UNIT
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
                                                        <Trash2 className="w-4 h-4 opacity-50 group-hover:opacity-100" /> REMOVE_LOG
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:sticky lg:top-[160px]">
                        <div className="bg-white border-[3px] border-neutral-black rounded-[4px] p-8 lg:p-10 shadow-[12px_12px_0px_0px_rgba(255,222,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                            <h2 className="font-display text-[20px] font-black text-neutral-black uppercase tracking-[1px] mb-10 border-b-[3px] border-neutral-black pb-4 italic">
                                Summary Manifest
                            </h2>

                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between font-display text-[13px] font-black uppercase text-neutral-black/40 tracking-[1px]">
                                    <span>SUBTOTAL</span>
                                    <span className="text-neutral-black">₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between font-display text-[13px] font-black uppercase text-neutral-black/40 tracking-[1px]">
                                    <span>LOGISTICS</span>
                                    <span>
                                        {shipping === 0 ? (
                                            <span className="text-success font-black italic">PROMO_FREE</span>
                                        ) : (
                                            `₹${shipping.toLocaleString('en-IN')}`
                                        )}
                                    </span>
                                </div>
                                <div className="pt-2">
                                    <GstInclusiveNote className="text-neutral-black/35" />
                                </div>

                                <div className="pt-8 border-t-[3px] border-dashed border-neutral-black/10">
                                    <div className="flex justify-between items-center">
                                        <span className="font-display text-[20px] font-black text-neutral-black uppercase tracking-tight">TOTAL_SYNC</span>
                                        <span className="font-display text-[32px] font-black text-neutral-black italic leading-none">
                                            ₹{total.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-neutral-black/25 font-black mt-2 text-right uppercase tracking-[2px]">
                                        TOTAL_EXCLUDES_SHIPPING_GST_ON_ITEMS_INCLUDED
                                    </div>
                                </div>
                            </div>

                            {shipping === 0 && (
                                <div className="bg-success/5 border-[2px] border-success/20 rounded-[4px] p-5 mb-10 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                                        <Truck className="w-5 h-5 text-success" />
                                    </div>
                                    <span className="font-display text-[11px] font-black text-success uppercase tracking-[1px]">
                                        FREE_LOGISTICS_OVERRIDE_APPLIED
                                    </span>
                                </div>
                            )}

                            <Link to="/order/checkout" className="no-underline">
                                <Button variant="primary" size="lg" className="w-full">
                                    INITIATE checkout <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>

                            <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-display font-black text-neutral-black/20 uppercase tracking-[2px]">
                                <Shield className="w-4 h-4" /> RAZORPAY_ENCRYPTED_FLOW
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
