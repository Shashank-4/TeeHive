import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ImageWithSkeleton from "../shared/ImageWithSkeleton";
import Loader from "../shared/Loader";

const DROPS_SECTION_BG =
    "https://cdn.culture-circle.com/culture-circle-new/public/assets/dropsection/Group%2018.svg";

/** Darkens the remote SVG (grid/boxes read stronger) without editing the file. */
function DropSectionBackdrop({ positionY = "38%" }: { positionY?: string }) {
    return (
        <>
            <div className="pointer-events-none absolute inset-0 z-0 bg-neutral-g2" aria-hidden />
            <div
                className="pointer-events-none absolute inset-0 z-0 [filter:brightness(0.38)_contrast(1.55)_saturate(0.7)]"
                style={{
                    backgroundImage: `url("${DROPS_SECTION_BG}")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: `center ${positionY}`,
                    backgroundSize: "min(132%, 1480px)",
                }}
                aria-hidden
            />
            {/* Lighter veil so foreground stays readable; grid stays visible */}
            <div
                className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/50 via-white/18 to-white/72"
                aria-hidden
            />
        </>
    );
}

export interface LatestDropProduct {
    id: string;
    name: string;
    price: number;
    mockupImageUrl: string;
    backMockupImageUrl?: string;
    primaryView?: "front" | "back";
    artist: { id: string; name: string };
}

interface LatestDropsShowcaseProps {
    products: LatestDropProduct[];
    isLoading: boolean;
}

function productImage(p: LatestDropProduct) {
    if (!p.mockupImageUrl) return "";
    return p.primaryView === "back" ? p.backMockupImageUrl || p.mockupImageUrl : p.mockupImageUrl;
}

const carouselArrowBtnClass =
    "shrink-0 z-30 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-sm border-2 border-neutral-black bg-white text-neutral-black hover:bg-primary transition-colors font-display text-lg font-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]";

export default function LatestDropsShowcase({ products, isLoading }: LatestDropsShowcaseProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    /** Incremented on prev/next arrows only so the center card bounce animation replays. */
    const [centerBounceKey, setCenterBounceKey] = useState(0);
    const n = products.length;

    useEffect(() => {
        setActiveIndex((i) => (n === 0 ? 0 : Math.min(i, n - 1)));
    }, [n]);

    const go = useCallback(
        (delta: number) => {
            if (n === 0) return;
            setActiveIndex((i) => (i + delta + n) % n);
        },
        [n]
    );

    const goWithBounce = useCallback(
        (delta: number) => {
            go(delta);
            setCenterBounceKey((k) => k + 1);
        },
        [go]
    );

    if (isLoading) {
        return (
            <section className="relative min-h-[50vh] flex flex-col py-12 md:py-16 px-5 md:px-12 overflow-hidden">
                <DropSectionBackdrop positionY="35%" />
                <div className="relative z-10 flex flex-1 items-center justify-center py-12">
                    <Loader className="w-20 h-20" />
                </div>
            </section>
        );
    }

    if (n === 0) {
        return (
            <section className="relative min-h-[55vh] flex flex-col justify-center py-12 md:py-16 px-5 md:px-12 overflow-hidden">
                <DropSectionBackdrop positionY="35%" />
                <div className="relative z-10 max-w-6xl mx-auto w-full px-1">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                        <div className="max-w-xl space-y-3 text-left">
                            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] md:text-[56px] font-black text-neutral-black leading-none tracking-tight uppercase">
                                Latest <span className="text-primary italic">Drops</span>
                            </h2>
                            <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-[2px]">
                                New releases sync soon.
                            </p>
                        </div>
                        <Link
                            to="/products?latestDrops=true&sort=newest"
                            className="group flex items-center justify-center gap-4 bg-neutral-black text-white px-8 py-5 rounded-[4px] font-display text-[14px] font-black uppercase tracking-[2px] transition-all hover:bg-primary hover:text-neutral-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline shrink-0 self-start md:self-end"
                        >
                            View latest drops{" "}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative px-4 sm:px-6 md:px-12 py-5 md:py-8 lg:py-10 overflow-x-visible overflow-y-visible scroll-mt-6">
            <DropSectionBackdrop positionY="40%" />

            <div className="relative z-10 max-w-[min(100%,1320px)] mx-auto flex flex-col items-stretch w-full gap-3 md:gap-5">
                {/* Header — tightened vertical rhythm so the band fits ~one viewport (loose) */}
                <header className="w-full flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-0 shrink-0">
                    <div className="max-w-[600px] space-y-3 text-left">
                        <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] md:text-[56px] font-black text-neutral-black leading-none tracking-tight uppercase">
                            Latest <span className="text-primary italic">Drops</span>
                        </h2>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-[2px]">
                            Curated releases from verified creators.
                        </p>
                    </div>
                    <Link
                        to="/products?latestDrops=true&sort=newest"
                        className="group flex items-center justify-center gap-4 bg-neutral-black text-white px-8 py-5 rounded-[4px] font-display text-[14px] font-black uppercase tracking-[2px] transition-all hover:bg-primary hover:text-neutral-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline shrink-0 self-start md:self-end"
                    >
                        View latest drops{" "}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                </header>

                {/* Carousel band: pagination on top; prev / stage / next */}
                <div className="w-full max-w-[min(100%,1480px)] mx-auto shrink-0 flex flex-col gap-3 md:gap-4 px-0 sm:px-1">
                    <div
                        className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5 shrink-0"
                        role="tablist"
                        aria-label="Slide indicators"
                    >
                        {products.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={i === activeIndex}
                                aria-label={`Go to slide ${i + 1}`}
                                onClick={() => setActiveIndex(i)}
                                className={`h-[3px] rounded-sm transition-all duration-300 ${
                                    i === activeIndex
                                        ? "w-12 md:w-14 bg-neutral-black"
                                        : "w-7 md:w-9 bg-neutral-g3/80 hover:bg-neutral-g4"
                                }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-4 w-full min-w-0">
                        <button
                            type="button"
                            onClick={() => goWithBounce(-1)}
                            className={`${carouselArrowBtnClass} hidden sm:flex`}
                            aria-label="Previous product"
                        >
                            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                        </button>

                        <div
                            className="flex-1 min-w-0 max-w-[min(100%,1240px)] mx-auto"
                            style={{ perspective: "2000px" }}
                        >
                            <div
                                className="relative min-h-[340px] sm:min-h-[400px] md:min-h-[520px] h-[min(58vh,620px)] flex items-center justify-center [transform-style:preserve-3d] py-1 overflow-visible"
                                role="region"
                                aria-roledescription="carousel"
                                aria-label="Latest product drops"
                            >
                                {products.map((product, i) => {
                                    const dist = i - activeIndex;
                                    const abs = Math.abs(dist);
                                    const isActive = dist === 0;

                                    if (abs > 4) return null;

                                    const scale =
                                        isActive
                                            ? 1
                                            : abs === 1
                                              ? 0.78
                                              : abs === 2
                                                ? 0.64
                                                : abs === 3
                                                  ? 0.54
                                                  : 0.46;
                                    const opacity =
                                        isActive
                                            ? 1
                                            : abs === 1
                                              ? 0.9
                                              : abs === 2
                                                ? 0.52
                                                : abs === 3
                                                  ? 0.32
                                                  : 0.2;
                                    const translateX = isActive
                                        ? "0px"
                                        : abs === 1
                                          ? `calc(${dist} * min(32vw, 300px))`
                                          : abs === 2
                                            ? `calc(${dist} * min(56vw, 500px))`
                                            : abs === 3
                                              ? `calc(${dist} * min(78vw, 680px))`
                                              : `calc(${dist} * min(96vw, 820px))`;
                                    const rotateY = isActive ? 0 : dist * -9;
                                    const z = isActive ? 0 : -48 - abs * 32;

                                    const src = productImage(product);

                                    const frameClass = [
                                        "isolate absolute left-1/2 top-1/2 rounded-2xl transition-all duration-500 ease-out",
                                        isActive
                                            ? "overflow-visible flex flex-col w-[min(88vw,300px)] sm:w-[min(80vw,340px)] md:w-[min(68vw,380px)] lg:w-[420px] z-20 bg-white6 shadow-[0_24px_56px_-14px_rgba(0,0,0,0.22)]"
                                            : "overflow-hidden aspect-[4/5] w-[min(52vw,210px)] sm:w-[230px] md:w-[260px] z-10 bg-neutral-g1 shadow-[0_14px_36px_-10px_rgba(0,0,0,0.14)]",
                                    ].join(" ");

                                    const frameStyle: CSSProperties = {
                                        transform: `translate(-50%, -50%) translateX(${translateX}) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                                        opacity,
                                        transformStyle: "preserve-3d",
                                    };

                                    const imgClass =
                                        "absolute inset-0 h-full w-full object-cover object-[50%_36%] origin-[50%_38%] scale-[1.2] mix-blend-multiply contrast-[1.03] transition-transform duration-500 ease-out";
                                    const inner =
                                        src ? (
                                            <ImageWithSkeleton
                                                src={src}
                                                alt=""
                                                className={imgClass}
                                                wrapperClassName={
                                                    isActive
                                                        ? "h-full w-full overflow-hidden bg-neutral-g1 rounded-t-2xl"
                                                        : "h-full w-full overflow-hidden bg-neutral-g1"
                                                }
                                            />
                                        ) : (
                                            <div
                                                className={`w-full h-full flex items-center justify-center bg-neutral-g1 text-5xl font-black text-neutral-g2 italic ${
                                                    isActive ? "rounded-t-2xl" : "rounded-2xl"
                                                }`}
                                            >
                                                ART
                                            </div>
                                        );

                                    if (isActive) {
                                        return (
                                            <div
                                                key={product.id}
                                                className={`${frameClass} z-20`}
                                                style={frameStyle}
                                                aria-current="true"
                                            >
                                                <div className="relative w-full aspect-[4/5] shrink-0 bg-neutral-g1 rounded-t-2xl overflow-visible">
                                                    <Link
                                                        to={`/products/${product.id}`}
                                                        className="absolute inset-0 z-10 block no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-black rounded-t-2xl"
                                                        aria-label={`${product.name}, open product page`}
                                                    >
                                                        <div
                                                            key={centerBounceKey}
                                                            className={`absolute inset-0 overflow-visible origin-[50%_42%] ${
                                                                centerBounceKey > 0
                                                                    ? "animate-carousel-center-bounce"
                                                                    : ""
                                                            }`}
                                                        >
                                                            {inner}
                                                        </div>
                                                    </Link>
                                                </div>
                                                <div className="relative z-20 flex flex-col gap-2 p-3 md:p-3.5 bg-white rounded-b-2xl border-t-2 border-neutral-black">
                                                    <h3 className="font-display text-[13px] md:text-sm font-black text-neutral-black uppercase tracking-tight leading-snug line-clamp-2">
                                                        <Link
                                                            to={`/products/${product.id}`}
                                                            className="text-inherit no-underline hover:text-primary transition-colors"
                                                        >
                                                            {product.name}
                                                        </Link>
                                                    </h3>
                                                    <Link
                                                        to={`/artists/${product.artist.id}`}
                                                        className="font-display text-[10px] font-black tracking-[1.5px] uppercase text-neutral-g4 hover:text-neutral-black transition-colors truncate no-underline"
                                                    >
                                                        {product.artist.name}
                                                    </Link>
                                                    <div className="flex items-baseline gap-2 flex-wrap">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-neutral-g1 border border-neutral-g2 font-display text-[9px] font-black uppercase tracking-wider text-neutral-g4">
                                                            INR
                                                        </span>
                                                        <span className="font-display text-lg md:text-xl font-black text-neutral-black tabular-nums">
                                                            ₹{product.price.toLocaleString("en-IN")}
                                                        </span>
                                                    </div>
                                                    <Link
                                                        to={`/products/${product.id}`}
                                                        className="mt-0.5 w-full py-2.5 text-center font-display text-[10px] font-black uppercase tracking-[0.18em] bg-neutral-black text-white border-2 border-neutral-black rounded-sm hover:bg-primary hover:text-neutral-black transition-colors no-underline"
                                                    >
                                                        Explore
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={product.id}
                                            type="button"
                                            className={`${frameClass} z-10 cursor-pointer p-0 text-left`}
                                            style={frameStyle}
                                            aria-label={`Show ${product.name} in carousel`}
                                            onClick={() => setActiveIndex(i)}
                                        >
                                            {inner}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => goWithBounce(1)}
                            className={`${carouselArrowBtnClass} hidden sm:flex`}
                            aria-label="Next product"
                        >
                            <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Below sm: side arrows would crowd the stage — use a row under the carousel */}
                    <div className="flex sm:hidden items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => goWithBounce(-1)}
                            className={carouselArrowBtnClass}
                            aria-label="Previous product"
                        >
                            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                        <button
                            type="button"
                            onClick={() => goWithBounce(1)}
                            className={carouselArrowBtnClass}
                            aria-label="Next product"
                        >
                            <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}
