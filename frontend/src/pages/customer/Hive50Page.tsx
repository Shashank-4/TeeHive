import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Loader from "../../components/shared/Loader";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";

interface Product {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    mockupImageUrl: string;
    tshirtColor: string;
    category: string;
    artist: { id: string; name: string };
}

export default function Hive50Page() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addItem } = useCart();
    const [addedId, setAddedId] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState("/assets/banners/hive50_banner.jpg");

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const [productsRes, configRes] = await Promise.allSettled([
                    api.get("/api/products?limit=50&sort=popular"),
                    api.get("/api/config/site_banners")
                ]);

                if (productsRes.status === "fulfilled") {
                    setProducts(productsRes.value.data.data.products || []);
                }

                if (configRes.status === "fulfilled" && configRes.value.data?.data?.config?.hive50Banner) {
                    setBannerUrl(configRes.value.data.data.config.hive50Banner);
                }
            } catch (err) {
                console.error("Failed to fetch Hive50 data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleQuickAdd = (product: Product) => {
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: "M",
            color: product.tshirtColor,
            image: product.mockupImageUrl,
            artistName: product.artist.name,
        });
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 2000);
    };

    const top5 = products.slice(0, 5);
    const rest = products.slice(5);

    return (
        <div className="bg-neutral-white min-h-screen">
            {/* ── HIVE50 HERO ── */}
            <div className="relative bg-neutral-black overflow-hidden border-b-[1.5px] border-neutral-black pt-20 pb-16 px-8 min-h-[400px] flex items-center">
                {/* Background Banner */}
                <div className="absolute inset-0">
                    <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-black via-neutral-black/40 to-transparent"></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center text-[22vw] font-display font-black text-white/[0.04] tracking-[-5px] select-none whitespace-nowrap animate-marquee">
                    HIVE50 HIVE50 HIVE50 HIVE50 HIVE50 HIVE50
                </div>
                <div className="relative z-10 max-w-4xl">
                    <div className="font-display text-[12px] font-extrabold tracking-[3px] uppercase text-primary mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        TeeHive Exclusive
                    </div>
                    <h1 className="font-display text-[clamp(48px,8vw,92px)] font-black text-white leading-none tracking-[1px] mb-6">
                        HIVE<span className="text-primary italic">50</span>
                    </h1>
                    <p className="text-[clamp(15px,1.4vw,18px)] text-white/70 leading-[1.6] max-w-2xl mb-8">
                        The 50 most trending designs on TeeHive right now — ranked by sales, wishlists and community love. Updated every Sunday.
                    </p>
                    <div className="flex flex-wrap gap-6 border-t border-white/10 pt-8">
                        {[
                            { label: "Total Designs", val: "50" },
                            { label: "Artists Featured", val: new Set(products.map(p => p.artist.id)).size },
                            { label: "Next Update", val: "In 3 Days" }
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="font-display text-[20px] font-black text-white">{stat.val}</div>
                                <div className="font-display text-[10px] font-bold tracking-[1.5px] uppercase text-white/30 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── LIVE RANKINGS BAR ── */}
            <div className="bg-primary border-b-[1.5px] border-neutral-black py-3 px-8 flex items-center justify-between">
                <div className="font-display text-[12px] font-black tracking-[1.5px] uppercase text-neutral-black">
                    Rankings — Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-black opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-black"></span>
                    </span>
                    <span className="font-display text-[11px] font-bold tracking-[1px] uppercase text-neutral-black">Live Rankings</span>
                </div>
            </div>

            {/* ── PODIUM (TOP 5) ── */}
            <section className="bg-neutral-black py-12 px-8 border-b-[1.5px] border-neutral-black overflow-hidden">
                <div className="font-display text-[11px] font-extrabold tracking-[3px] uppercase text-white/20 mb-8 items-center flex gap-3">
                    <ArrowRight className="w-3 h-3" /> Top 5 This Week
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader size="w-16 h-16" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {top5.map((product, i) => (
                            <div key={product.id} className="group bg-white/[0.05] border-[1.5px] border-white/10 p-6 rounded-[4px] relative transition-all hover:bg-white/[0.08] hover:border-primary">
                                <div className="absolute top-4 left-4 font-display text-[48px] font-black italic leading-none opacity-20 text-primary group-hover:opacity-100 transition-opacity">
                                    {i + 1}
                                </div>
                                <div className="absolute top-6 right-6 font-display text-[9px] font-black tracking-[1.5px] uppercase text-primary bg-primary/10 px-2 py-1 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                                    #{i + 1} All Time
                                </div>

                                <Link to={`/products/${product.id}`} className="block mb-6 mt-8">
                                    <div className="aspect-square bg-white/[0.03] rounded-[4px] overflow-hidden flex items-center justify-center">
                                        <img src={product.mockupImageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                </Link>

                                <div className="text-center">
                                    <div className="font-display text-[11px] font-bold tracking-[1.5px] uppercase text-primary mb-1">{product.artist.name}</div>
                                    <h3 className="font-display text-[18px] font-bold text-white tracking-[0.3px] mb-2 truncate">{product.name}</h3>
                                    <div className="font-display text-[20px] font-black text-white mb-6">₹{product.price.toLocaleString('en-IN')}</div>

                                    <button
                                        onClick={() => handleQuickAdd(product)}
                                        className={`w-full py-3 font-display text-[13px] font-extrabold tracking-[1.5px] uppercase rounded-[3px] transition-all border-[1.5px] ${addedId === product.id ? "bg-success text-white border-success" : "bg-white text-neutral-black border-white hover:bg-primary hover:border-primary"}`}
                                    >
                                        {addedId === product.id ? "Added!" : "+ Add to Cart"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── REST OF THE PACK (6-50) ── */}
            <section className="bg-neutral-g1 py-12 px-8">
                <div className="font-display text-[11px] font-extrabold tracking-[3px] uppercase text-neutral-g4 mb-8 flex items-center gap-3">
                    <ArrowRight className="w-3 h-3" /> Ranks 6 — 50
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {rest.map((product, i) => (
                        <div key={product.id} className="bg-white border-[1.5px] border-neutral-g2 rounded-[4px] overflow-hidden group transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-neutral-black">
                            <div className="p-3 bg-neutral-g2 flex items-center justify-between">
                                <div className="font-display text-[18px] font-black italic text-neutral-black opacity-30">{i + 6}</div>
                                <span className={`font-display text-[9px] font-bold tracking-[1px] uppercase px-2 py-0.5 rounded-[2px] ${i < 10 ? 'bg-danger text-white' : 'bg-info text-white'}`}>
                                    {i < 10 ? '🔥 Hot' : '✦ New'}
                                </span>
                            </div>

                            <Link to={`/products/${product.id}`} className="block aspect-square overflow-hidden bg-neutral-g1">
                                <img src={product.mockupImageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </Link>

                            <div className="p-4">
                                <div className="font-display text-[10px] font-bold tracking-[1.5px] uppercase text-neutral-g4 mb-1">{product.artist.name}</div>
                                <h4 className="font-display text-[15px] font-bold text-neutral-black mb-3 truncate">{product.name}</h4>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="font-display text-[16px] font-black text-neutral-black">₹{product.price.toLocaleString('en-IN')}</span>
                                    <span className="font-display text-[9px] font-bold tracking-[1px] uppercase text-neutral-g3 bg-neutral-g1 px-1.5 py-0.5">{product.category}</span>
                                </div>
                                <button
                                    onClick={() => handleQuickAdd(product)}
                                    className={`w-full py-2.5 font-display text-[11px] font-extrabold tracking-[1px] uppercase rounded-[3px] transition-all border-[1.5px] ${addedId === product.id ? "bg-success text-white border-success" : "bg-neutral-black text-white border-neutral-black hover:bg-primary hover:text-neutral-black hover:border-primary"}`}
                                >
                                    {addedId === product.id ? "Added!" : "+ Add to Cart"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
