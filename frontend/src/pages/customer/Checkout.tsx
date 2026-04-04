import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Check, ArrowLeft, ShoppingBag, ShieldCheck, Truck, CreditCard } from "lucide-react";
import axios from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Loader from "../../components/shared/Loader";
import GstInclusiveNote from "../../components/shared/GstInclusiveNote";
import ReturnPolicyNote from "../../components/shared/ReturnPolicyNote";

// Declare Razorpay on window
declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function Checkout() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { items, subtotal, clearCart } = useCart();
    const [step, setStep] = useState<"shipping" | "payment">("shipping");
    const [isLoading, setIsLoading] = useState(false);
    const [paymentError, setPaymentError] = useState("");
    
    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discountPercent: number} | null>(null);
    const [couponMessage, setCouponMessage] = useState({ text: "", type: "" });
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const [shippingAddress, setShippingAddress] = useState({
        firstName: user?.name?.split(" ")[0] || "",
        lastName: user?.name?.split(" ").slice(1).join(" ") || "",
        email: user?.email || "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
        phone: "",
    });

    const discountAmount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.discountPercent / 100)) : 0;
    const discountedSubtotal = subtotal - discountAmount;
    
    // Calculate shipping based on discounted total
    const shipping = discountedSubtotal > 3000 ? 0 : 100;
    const total = discountedSubtotal + shipping;

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsApplyingCoupon(true);
        setCouponMessage({ text: "", type: "" });
        try {
            const res = await axios.get(`/api/promotions/validate-coupon/${couponCode}`);
            const coupon = res.data.data;
            setAppliedCoupon({ code: coupon.code, discountPercent: coupon.discountPercent });
            setCouponMessage({ text: "Coupon applied successfully!", type: "success" });
            setCouponCode("");
        } catch (error: any) {
            setCouponMessage({ text: error.response?.data?.error || "Invalid coupon code", type: "error" });
            setAppliedCoupon(null);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponMessage({ text: "", type: "" });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setShippingAddress((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateShippingStrict = (a: typeof shippingAddress): string | null => {
        if (!a.firstName.trim() || !a.lastName.trim()) return "Please enter your first and last name.";
        if (!a.email.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) return "Please enter a valid email address.";
        if (!a.address.trim()) return "Street address is required.";
        if (!a.city.trim() || !a.state.trim()) return "City and state are required.";
        if (!a.zipCode.trim()) return "Postal code is required.";
        if (a.country === "India" && !/^\d{6}$/.test(a.zipCode.trim()))
            return "Indian pincode must be exactly 6 digits.";
        if (a.country !== "India" && a.zipCode.trim().length < 3)
            return "Please enter a valid postal code.";
        if (!a.country.trim()) return "Country is required.";
        const phoneDigits = a.phone.replace(/\D/g, "");
        if (phoneDigits.length < 10) return "Please enter a valid phone number (at least 10 digits).";
        return null;
    };

    const handleShippingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        const err = validateShippingStrict(shippingAddress);
        if (err) {
            alert(err);
            return;
        }
        setStep("payment");
    };

    const buildOrderItems = () =>
        items.map((item) => ({
            id: item.productId,
            title: item.name,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color,
            image: item.image,
        }));

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleCheckout = async () => {
        const err = validateShippingStrict(shippingAddress);
        if (err) {
            alert(err);
            setStep("shipping");
            return;
        }

        setIsLoading(true);
        setPaymentError("");

        const res = await loadRazorpayScript();

        if (!res) {
            alert("Razorpay SDK failed to load. Are you online?");
            setIsLoading(false);
            return;
        }

        try {
            if (!window.Razorpay) {
                throw new Error("Razorpay SDK is unavailable in this browser session.");
            }

            const orderItems = buildOrderItems();
            const { data } = await axios.post("/api/orders/checkout", {
                items: orderItems.map(({ id, quantity, size, color }) => ({
                    id,
                    quantity,
                    size,
                    color,
                })),
                shippingAddress,
                couponCode: appliedCoupon?.code,
            });

            const session = data.data;
            const razorpayInstance = new window.Razorpay({
                key: session.keyId,
                amount: session.amount,
                currency: session.currency,
                order_id: session.razorpayOrderId,
                name: "TeeHive",
                description: "Complete your TeeHive purchase",
                image: "/favicon.ico",
                prefill: {
                    name: session.customer?.name,
                    email: session.customer?.email,
                    contact: session.customer?.contact,
                },
                notes: {
                    internalOrderId: session.orderId,
                },
                theme: {
                    color: "#f0dd26",
                },
                modal: {
                    ondismiss: () => {
                        setIsLoading(false);
                        setPaymentError("Payment window closed before completion. Your cart is still intact.");
                    },
                },
                handler: async (response: {
                    razorpay_payment_id: string;
                    razorpay_order_id: string;
                    razorpay_signature: string;
                }) => {
                    setIsLoading(true);
                    setPaymentError("");

                    try {
                        const verifyResponse = await axios.post("/api/orders/checkout/verify", {
                            orderId: session.orderId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        const verifiedOrder = verifyResponse.data.data.order;
                        clearCart();
                        navigate("/order/confirmation", {
                            state: {
                                orderId: verifiedOrder.id,
                                total: verifiedOrder.totalAmount,
                                items: orderItems,
                                paymentStatus: "success",
                                paymentId: response.razorpay_payment_id,
                                shippingAddress: {
                                    ...shippingAddress,
                                    name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                                },
                            },
                        });
                    } catch (verifyError: any) {
                        console.error("Error verifying payment:", verifyError);
                        setPaymentError(
                            verifyError.response?.data?.message ||
                                "Payment was received but verification failed. Please contact support if money was debited."
                        );
                    } finally {
                        setIsLoading(false);
                    }
                },
            });

            razorpayInstance.on("payment.failed", (response: any) => {
                setIsLoading(false);
                setPaymentError(
                    response?.error?.description ||
                        response?.error?.reason ||
                        "Payment failed. Please try again with another method."
                );
            });

            razorpayInstance.open();
            setIsLoading(false);
        } catch (error: any) {
            console.error("Error creating order:", error);
            setPaymentError(
                error.response?.data?.message || error.message || "Something went wrong during checkout."
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-8">
                <div className="text-[64px] mb-6 grayscale opacity-20">👤</div>
                <h2 className="font-display text-[24px] font-black text-neutral-black mb-4 uppercase tracking-[0.5px]">Please sign in to checkout</h2>
                <Link to="/login" className="bg-neutral-black text-white px-8 py-3.5 font-display text-[12px] font-black uppercase tracking-[1px] rounded-[4px] hover:bg-primary hover:text-neutral-black transition-all no-underline">
                    Sign In to Continue
                </Link>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-8">
                <div className="w-20 h-20 rounded-full bg-neutral-g1 flex items-center justify-center mb-6 border border-neutral-g2 shadow-sm">
                    <ShoppingBag className="w-10 h-10 text-neutral-g3" />
                </div>
                <h2 className="font-display text-[24px] font-black text-neutral-black mb-2 uppercase tracking-[0.5px]">Your bag is empty</h2>
                <p className="text-neutral-g3 font-display font-bold text-[11px] uppercase tracking-[1px] mb-8">Add components before checking out</p>
                <Link to="/products" className="bg-primary text-neutral-black px-10 py-4 font-display text-[12px] font-black uppercase tracking-[1px] border-[1.5px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all no-underline">
                    Browse All Products
                </Link>
            </div>
        );
    }

    const steps = [
        { id: "shipping", title: "Information", icon: Truck },
        { id: "payment", title: "Checkout", icon: CreditCard },
    ];

    return (
        <div className="bg-neutral-white min-h-screen py-10 w-full px-8">
            <div className="w-full">
                {/* Back */}
                <Link to="/cart" className="inline-flex items-center gap-2 text-neutral-g4 hover:text-neutral-black mb-10 no-underline">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-display text-[11px] font-extrabold uppercase tracking-[1.5px]">Return to Bag</span>
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 pb-6 border-b-[1.5px] border-neutral-black">
                    <h1 className="font-display text-[clamp(28px,4vw,44px)] font-black text-neutral-black leading-none uppercase tracking-[-0.5px]">
                        CHECKOUT <span className="text-primary italic">— SECURE PORTAL</span>
                    </h1>

                    {/* Progress */}
                    <nav aria-label="Progress" className="hidden sm:block">
                        <ol role="list" className="flex items-center gap-12">
                            {steps.map((s, idx) => (
                                <li key={s.id} className="flex items-center gap-3">
                                    <div className={`w-9 h-9 border-[1.5px] border-neutral-black rounded-full flex items-center justify-center transition-all ${step === s.id || (step === "payment" && s.id === "shipping") ? "bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-neutral-g1"}`}>
                                        {step === "payment" && s.id === "shipping" ? <Check className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                                    </div>
                                    <span className={`font-display text-[11px] font-black uppercase tracking-[1px] ${step === s.id ? "text-neutral-black" : "text-neutral-g3"}`}>{s.title}</span>
                                    {idx === 0 && <div className="w-12 h-[1.5px] bg-neutral-black hidden md:block"></div>}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start max-w-[1600px] mx-auto">
                    <div className="lg:col-span-7">
                        {step === "shipping" ? (
                            <form
                                onSubmit={handleShippingSubmit}
                                className="bg-white border-[1.5px] border-neutral-black p-8 rounded-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <h2 className="font-display text-[18px] font-black text-neutral-black uppercase tracking-[1px] mb-8 flex items-center gap-3">
                                    <Truck className="w-5 h-5 text-primary" /> Delivery Address
                                </h2>
                                <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                                    {[
                                        { id: "firstName", label: "First Name", type: "text", span: false, auto: "given-name" as const },
                                        { id: "lastName", label: "Last Name", type: "text", span: false, auto: "family-name" as const },
                                        { id: "email", label: "Email Address", type: "email", span: true, auto: "email" as const },
                                        { id: "address", label: "Full Street Address", type: "text", span: true, auto: "street-address" as const },
                                        { id: "city", label: "City", type: "text", span: false, auto: "address-level2" as const },
                                        { id: "state", label: "State", type: "text", span: false, auto: "address-level1" as const },
                                        { id: "zipCode", label: "Pincode", type: "text", span: false, auto: "postal-code" as const },
                                    ].map((field) => (
                                        <div key={field.id} className={field.span ? "sm:col-span-2" : ""}>
                                            <label htmlFor={field.id} className="block font-display text-[10px] font-black uppercase text-neutral-g4 tracking-[1px] mb-2">
                                                {field.label} <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type={field.type}
                                                id={field.id}
                                                name={field.id}
                                                required
                                                autoComplete={field.auto}
                                                {...(field.id === "zipCode" && shippingAddress.country === "India"
                                                    ? {
                                                          inputMode: "numeric" as const,
                                                          pattern: "\\d{6}",
                                                          maxLength: 6,
                                                          title: "6-digit Indian pincode",
                                                      }
                                                    : field.id === "zipCode"
                                                      ? {
                                                            title: "Postal code",
                                                        }
                                                      : {})}
                                                value={(shippingAddress as Record<string, string>)[field.id]}
                                                onChange={handleInputChange}
                                                className="block w-full px-4 py-3.5 border-[1.5px] border-neutral-g2 rounded-[2px] focus:border-neutral-black focus:ring-0 transition-all font-display text-[13px] font-bold text-neutral-black"
                                            />
                                        </div>
                                    ))}

                                    <div>
                                        <label htmlFor="country" className="block font-display text-[10px] font-black uppercase text-neutral-g4 tracking-[1px] mb-2">
                                            Country <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            id="country"
                                            name="country"
                                            required
                                            autoComplete="country-name"
                                            value={shippingAddress.country}
                                            onChange={handleInputChange}
                                            className="block w-full px-4 py-3.5 border-[1.5px] border-neutral-g2 rounded-[2px] focus:border-neutral-black focus:ring-0 appearance-none bg-white font-display text-[13px] font-bold"
                                        >
                                            <option value="India">India</option>
                                            <option value="United States">United States</option>
                                            <option value="Canada">Canada</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="phone" className="block font-display text-[10px] font-black uppercase text-neutral-g4 tracking-[1px] mb-2">
                                            Phone Number <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            id="phone"
                                            required
                                            autoComplete="tel"
                                            inputMode="tel"
                                            value={shippingAddress.phone}
                                            onChange={handleInputChange}
                                            placeholder="+91 00000 00000"
                                            title="At least 10 digits"
                                            className="block w-full px-4 py-3.5 border-[1.5px] border-neutral-g2 rounded-[2px] focus:border-neutral-black focus:ring-0 font-display text-[13px] font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-end pt-8 border-t-[1.5px] border-neutral-g1">
                                    <button
                                        type="submit"
                                        className="bg-primary text-neutral-black px-10 py-4 font-display text-[14px] font-black uppercase tracking-[1px] border-[1.5px] border-neutral-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-white border-[1.5px] border-neutral-black p-8 rounded-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h2 className="font-display text-[18px] font-black text-neutral-black uppercase tracking-[1px] mb-8 flex items-center gap-3">
                                    <Check className="w-5 h-5 text-primary" /> Review & Confirm
                                </h2>

                                <div className="bg-neutral-g1 border-[1.5px] border-neutral-black rounded-[2px] p-6 mb-10 group transition-all hover:bg-white">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-display text-[12px] font-black text-neutral-black uppercase tracking-[1px]">Shipping Destination</h3>
                                        <button
                                            onClick={() => setStep("shipping")}
                                            className="text-[10px] font-bold text-primary underline uppercase tracking-widest hover:text-neutral-black"
                                        >
                                            Modify Address
                                        </button>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-display text-[13px] font-bold text-neutral-black leading-relaxed">
                                                {shippingAddress.firstName} {shippingAddress.lastName}<br />
                                                {shippingAddress.address}<br />
                                                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-display text-[13px] font-bold text-neutral-black leading-relaxed">
                                                {shippingAddress.country}<br />
                                                {shippingAddress.phone}<br />
                                                {shippingAddress.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {paymentError && (
                                        <div className="w-full border-[1.5px] border-danger bg-danger/5 text-danger px-4 py-3 rounded-[2px] font-display text-[11px] font-black uppercase tracking-[0.8px]">
                                            {paymentError}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isLoading}
                                        className="w-full h-[68px] bg-primary border-[1.5px] border-neutral-black font-display text-[18px] font-black uppercase tracking-[1.5px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? (
                                            <><Loader size="w-6 h-6 border-2" /> Processing Order...</>
                                        ) : (
                                            `Authorize Payment — ₹${total.toLocaleString('en-IN')}`
                                        )}
                                    </button>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 text-success font-display text-[11px] font-black uppercase tracking-[0.5px]">
                                            <ShieldCheck className="w-4 h-4" /> Secure Razorpay Encryption Active
                                        </div>
                                        <p className="text-[10px] text-neutral-g3 font-display font-extrabold uppercase tracking-tight text-center">
                                            By clicking authorize, you agree to TeeHive's terms of service and the selected design license.
                                        </p>
                                    </div>
                                    <ReturnPolicyNote />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-5 mt-10 lg:mt-0 lg:sticky lg:top-[160px]">
                        <div className="bg-white border-[1.5px] border-neutral-black rounded-[2px] overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="p-8">
                                <h2 className="font-display text-[16px] font-black text-neutral-black uppercase tracking-[1px] mb-8 pb-4 border-b border-neutral-g1">
                                    Order Preview <span className="text-neutral-g3 text-[12px] font-bold lowercase tracking-normal">({items.length} items)</span>
                                </h2>
                                <div className="divide-y-[1.5px] divide-neutral-g1">
                                    {items.map((item) => (
                                        <div key={`${item.productId}-${item.size}-${item.color}`} className="py-5 flex gap-5 group">
                                            <div className="flex-shrink-0 w-20 h-24 border border-neutral-g2 rounded-[2px] overflow-hidden bg-neutral-g1">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-display text-[13px] font-black text-neutral-black uppercase leading-tight">{item.name}</h3>
                                                    <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-[0.5px] mt-1.5 flex items-center gap-2">
                                                        {item.size} <span className="w-1 h-1 bg-neutral-g3 rounded-full"></span> {item.color} <span className="w-1 h-1 bg-neutral-g3 rounded-full"></span> Qty {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-display text-[14px] font-black text-neutral-black">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t-[1.5px] border-neutral-black pt-6 mt-4 space-y-4">
                                    {/* Coupon Input Section */}
                                    <div className="bg-neutral-g1 p-4 rounded-[4px] border border-neutral-g2 mb-4">
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="DISCOUNT CODE" 
                                                disabled={!!appliedCoupon || isApplyingCoupon}
                                                className="flex-1 px-4 py-2 border-[1.5px] border-neutral-g2 focus:border-neutral-black outline-none font-display text-[12px] font-black uppercase tracking-[1px] disabled:opacity-50"
                                            />
                                            {appliedCoupon ? (
                                                <button 
                                                    onClick={handleRemoveCoupon}
                                                    className="px-4 py-2 bg-neutral-black text-white font-display text-[11px] font-black uppercase tracking-[1px] rounded-[2px] transition-colors hover:bg-danger"
                                                >
                                                    Remove
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={handleApplyCoupon}
                                                    disabled={!couponCode || isApplyingCoupon}
                                                    className="px-6 py-2 bg-primary text-neutral-black border-[1.5px] border-neutral-black font-display text-[11px] font-black uppercase tracking-[1px] rounded-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none"
                                                >
                                                    Supply
                                                </button>
                                            )}
                                        </div>
                                        {couponMessage.text && (
                                            <div className={`mt-2 font-display text-[10px] font-black uppercase tracking-[1px] ${couponMessage.type === 'success' ? 'text-success' : 'text-danger'}`}>
                                                {couponMessage.text}
                                            </div>
                                        )}
                                        {appliedCoupon && (
                                            <div className="mt-2 text-primary bg-primary/10 border border-primary px-3 py-1.5 font-display text-[10px] font-black uppercase tracking-[1px] rounded-[2px] inline-flex items-center gap-2 w-full justify-between">
                                                <span>{appliedCoupon.code} APPLIED</span>
                                                <span>-{appliedCoupon.discountPercent}% OFF</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between font-display text-[12px] font-bold uppercase text-neutral-g4">
                                        <span>Subtotal</span>
                                        <span className="text-neutral-black text-[13px]">₹{subtotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    
                                    {appliedCoupon && (
                                        <div className="flex justify-between font-display text-[12px] font-black uppercase text-primary">
                                            <span>Discount</span>
                                            <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between font-display text-[12px] font-bold uppercase text-neutral-g4">
                                        <span>Logistics</span>
                                        <span className={shipping === 0 ? "text-success font-black" : "text-neutral-black text-[13px]"}>
                                            {shipping === 0 ? "FREE" : `₹${shipping.toLocaleString('en-IN')}`}
                                        </span>
                                    </div>
                                    <div className="pt-1">
                                        <GstInclusiveNote />
                                    </div>
                                    <ReturnPolicyNote className="mt-2" />
                                    <div className="border-t-[1.5px] border-neutral-black pt-5 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-display text-[16px] font-black text-neutral-black uppercase tracking-[1px]">Payable Amount</span>
                                            <span className="font-display text-[24px] font-black text-neutral-black">₹{total.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
