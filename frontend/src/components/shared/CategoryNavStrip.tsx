import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import api from "../../api/axios";

interface Category {
    id: string;
    name: string;
}

export default function CategoryNavStrip() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchParams] = useSearchParams();
    const activeCat = searchParams.get("category") || "all";
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get("/api/categories");
                setCategories(res.data.data.categories || []);
            } catch (err) {
                console.error("Failed to fetch categories for strip:", err);
            }
        };
        fetchCategories();
    }, []);

    const handleScroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    return (
        <div className="bg-white border-b-[2.5px] border-neutral-black h-[56px] flex items-center relative group overflow-hidden z-[90]">
            {/* Scroll Buttons */}
            <div className="absolute left-0 top-0 bottom-0 z-30 flex items-center">
                <button
                    onClick={() => handleScroll("left")}
                    className="h-full w-10 bg-white border-r-[2px] border-neutral-black flex items-center justify-center hover:bg-primary transition-all active:translate-x-[-2px] disabled:opacity-0"
                >
                    <ChevronLeft className="w-5 h-5 text-neutral-black" />
                </button>
            </div>

            <div className="absolute right-0 top-0 bottom-0 z-30 flex items-center">
                <button
                    onClick={() => handleScroll("right")}
                    className="h-full w-10 bg-white border-l-[2px] border-neutral-black flex items-center justify-center hover:bg-primary transition-all active:translate-x-[2px] disabled:opacity-0"
                >
                    <ChevronRight className="w-5 h-5 text-neutral-black" />
                </button>
            </div>

            {/* Main Strip */}
            <div
                ref={scrollRef}
                className="flex items-center h-full overflow-x-auto scrollbar-hide px-12 md:px-14 gap-0"
            >
                <Link
                    to="/products"
                    className={`font-display text-[12px] font-black uppercase tracking-[1.5px] px-8 h-full flex items-center whitespace-nowrap border-b-[4px] transition-all no-underline group relative overflow-hidden ${activeCat === "all" ? "text-neutral-black border-primary bg-primary/5" : "text-neutral-black/40 border-transparent hover:text-neutral-black hover:bg-neutral-g1"}`}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Zap className={`w-3 h-3 ${activeCat === 'all' ? 'text-primary' : 'text-transparent'}`} fill="currentColor" />
                        GLOBAL_VAULT
                    </span>
                </Link>

                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                        className={`font-display text-[12px] font-black uppercase tracking-[1.5px] px-8 h-full flex items-center whitespace-nowrap border-b-[4px] transition-all no-underline group relative overflow-hidden ${activeCat === cat.name ? "text-neutral-black border-primary bg-primary/5" : "text-neutral-black/40 border-transparent hover:text-neutral-black hover:bg-neutral-g1"}`}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Zap className={`w-3 h-3 ${activeCat === cat.name ? 'text-primary' : 'text-transparent'}`} fill="currentColor" />
                            {cat.name.toUpperCase()}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
