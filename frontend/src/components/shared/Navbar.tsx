import { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, LogOut, Package, LayoutDashboard, Shield, Menu, X, ShoppingCart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/axios";

interface SearchProductResult {
    id: string;
    name: string;
    price: number;
    mockupImageUrl: string;
    backMockupImageUrl?: string;
    primaryView?: "front" | "back";
    artist?: { name?: string };
}

interface SearchArtistResult {
    id: string;
    name: string;
    displayName?: string | null;
    displayPhotoUrl?: string | null;
    productCount?: number;
}

export default function Navbar() {
    const { user, isAuthenticated, signOut } = useAuth();
    const { itemCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [showArtistSwitchModal, setShowArtistSwitchModal] = useState(false);
    const [productResults, setProductResults] = useState<SearchProductResult[]>([]);
    const [artistResults, setArtistResults] = useState<SearchArtistResult[]>([]);
    const [headerLogo, setHeaderLogo] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const desktopSearchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLFormElement>(null);
    const searchReqIdRef = useRef(0);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
            const outsideDesktop = desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node);
            const outsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node);
            if (outsideDesktop && outsideMobile) setSearchOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
        setSearchOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const fetchHeaderLogo = async () => {
            try {
                const res = await api.get("/api/config/site_banners");
                const logo = res.data?.data?.config?.headerLogo;
                if (typeof logo === "string") setHeaderLogo(logo);
            } catch {
                // Keep hardcoded fallback branding if config is unavailable.
            }
        };
        fetchHeaderLogo();
    }, []);

    useEffect(() => {
        const q = searchQuery.trim();
        if (q.length < 2) {
            setProductResults([]);
            setArtistResults([]);
            setSearchLoading(false);
            setSearchOpen(false);
            return;
        }

        const reqId = ++searchReqIdRef.current;
        setSearchLoading(true);

        const timer = setTimeout(async () => {
            try {
                const [productsRes, artistsRes] = await Promise.allSettled([
                    api.get(`/api/products?search=${encodeURIComponent(q)}&limit=5`),
                    api.get(`/api/artists?search=${encodeURIComponent(q)}&limit=5`),
                ]);

                if (reqId !== searchReqIdRef.current) return;

                const products =
                    productsRes.status === "fulfilled"
                        ? (productsRes.value.data?.data?.products as SearchProductResult[] | undefined) || []
                        : [];
                const artists =
                    artistsRes.status === "fulfilled"
                        ? (artistsRes.value.data?.data?.artists as SearchArtistResult[] | undefined) || []
                        : [];

                setProductResults(products.slice(0, 5));
                setArtistResults(artists.slice(0, 5));
                setSearchOpen(true);
            } catch {
                if (reqId !== searchReqIdRef.current) return;
                setProductResults([]);
                setArtistResults([]);
                setSearchOpen(true);
            } finally {
                if (reqId === searchReqIdRef.current) setSearchLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
            setSearchOpen(false);
            setMobileMenuOpen(false);
        }
    };

    const hasSearchResults = productResults.length > 0 || artistResults.length > 0;
    const showSearchDropdown = searchOpen && searchQuery.trim().length >= 2;

    const openProduct = (productId: string) => {
        setSearchOpen(false);
        setSearchQuery("");
        navigate(`/products/${productId}`);
    };

    const openArtist = (artistId: string) => {
        setSearchOpen(false);
        setSearchQuery("");
        setMobileMenuOpen(false);
        navigate(`/artists/${artistId}`);
    };

    const handleSignOut = async () => { setUserMenuOpen(false); await signOut(); navigate("/"); };

    const routeArtistUser = () => {
        if (!user) return;
        if (user.verificationStatus === "VERIFIED") navigate("/artist/dashboard");
        else if (user.verificationStatus === "PENDING_VERIFICATION") navigate("/artist/verification-status");
        else navigate("/artist/setup-profile");
    };

    const handleBecomeArtist = () => {
        if (!isAuthenticated || !user) {
            navigate("/login?type=artist&mode=signup");
            return;
        }
        if (user.isArtist) {
            routeArtistUser();
            return;
        }
        setShowArtistSwitchModal(true);
    };

    const confirmBecomeArtist = async () => {
        await signOut();
        setShowArtistSwitchModal(false);
        setMobileMenuOpen(false);
        navigate("/login?type=artist&mode=signup");
    };

    const navLinkClass = (isActive: boolean) =>
        `font-display text-[15px] font-black tracking-[1.5px] uppercase px-5 h-[72px] flex items-center border-b-[4px] transition-all relative overflow-hidden group ${isActive ? "border-primary text-neutral-black bg-primary/5" : "border-transparent text-neutral-black hover:text-primary"}`;

    return (
        <nav className="sticky top-0 z-[100] bg-white border-b-[2.5px] border-neutral-black h-[72px] flex items-center shadow-[0_4px_0_0_rgba(0,0,0,0.02)]">
            <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between px-4 md:px-10 h-full">
                {/* Left: Mobile menu + Logo */}
                <div className="flex items-center gap-5">
                    <button
                        className="md:hidden w-12 h-12 flex items-center justify-center border-[2px] border-neutral-black rounded-[4px] hover:bg-primary transition-all active:translate-y-0.5"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link to="/" className="flex items-center gap-3 no-underline group">
                        {headerLogo ? (
                            <img
                                src={headerLogo}
                                alt="TeeHive"
                                className="h-9 md:h-10 w-auto object-contain"
                            />
                        ) : (
                            <>
                                <div className="w-4 h-4 bg-neutral-black rounded-full group-hover:bg-primary group-hover:scale-125 transition-all duration-300"></div>
                                <span className="font-display text-[26px] md:text-[32px] font-black tracking-[1px] text-neutral-black leading-none">
                                    TEE<span className="text-primary italic">HIVE</span>
                                </span>
                            </>
                        )}
                    </Link>
                </div>

                {/* Center: Navigation */}
                <div className="hidden md:flex items-center h-full ml-10">
                    <NavLink to="/products" className={({ isActive }) => navLinkClass(isActive)}>
                        <span className="relative z-10">Shop</span>
                    </NavLink>
                    <NavLink to="/hive50" className={({ isActive }) => navLinkClass(isActive)}>
                        <span className="relative z-10">Hive50</span>
                    </NavLink>
                    <NavLink to="/artists" className={({ isActive }) => navLinkClass(isActive)}>
                        <span className="relative z-10">Artists</span>
                    </NavLink>
                    <button onClick={handleBecomeArtist} className={navLinkClass(false)}>
                        <span className="relative z-10">Become an Artist</span>
                    </button>

                </div>

                {/* Right: Search + Profile + Cart */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Desktop search */}
                    <div className="hidden lg:block relative" ref={desktopSearchRef}>
                        <form onSubmit={handleSearch} className="flex items-center gap-3 bg-neutral-g1 border-[2px] border-neutral-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.2)] rounded-[4px] px-4 h-[44px] w-[240px] focus-within:w-[340px] focus-within:bg-white focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group">
                            <Search className="w-[18px] h-[18px] text-neutral-black/30 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length >= 2 && setSearchOpen(true)}
                                placeholder="FIND PRODUCTS OR ARTISTS..."
                                className="flex-1 border-none outline-none font-display text-[11px] font-black uppercase tracking-[1px] bg-transparent text-neutral-black placeholder:text-neutral-g3"
                            />
                        </form>

                        {showSearchDropdown && (
                            <div className="absolute right-0 mt-3 w-[500px] max-w-[78vw] bg-white border-[2.5px] border-neutral-black rounded-[6px] z-[140] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                {searchLoading ? (
                                    <div className="px-5 py-6 font-display text-[11px] font-black uppercase tracking-[1.2px] text-neutral-g3">
                                        Searching the hive...
                                    </div>
                                ) : !hasSearchResults ? (
                                    <div className="px-5 py-6 font-display text-[11px] font-black uppercase tracking-[1.2px] text-neutral-g3">
                                        No matching products or artists
                                    </div>
                                ) : (
                                    <div className="max-h-[420px] overflow-y-auto">
                                        {productResults.length > 0 && (
                                            <div className="border-b border-neutral-black/10">
                                                <div className="px-5 py-2.5 bg-neutral-g1 font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4">
                                                    Products
                                                </div>
                                                {productResults.map((p) => {
                                                    const image =
                                                        p.primaryView === "back"
                                                            ? p.backMockupImageUrl || p.mockupImageUrl
                                                            : p.mockupImageUrl;
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => openProduct(p.id)}
                                                            className="w-full text-left px-4 py-3.5 hover:bg-primary/15 transition-colors border-b border-neutral-black/5 last:border-b-0"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <img src={image} alt={p.name} className="w-10 h-10 rounded-[2px] border border-neutral-black/20 object-cover bg-neutral-g1 shrink-0" />
                                                                <div className="min-w-0">
                                                                    <div className="font-display text-[12px] font-black uppercase truncate">{p.name}</div>
                                                                    <div className="font-display text-[10px] font-bold uppercase tracking-[1px] text-neutral-g3">
                                                                        by {p.artist?.name || "Artist"}  •  ₹{Number(p.price || 0).toLocaleString("en-IN")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {artistResults.length > 0 && (
                                            <div>
                                                <div className="px-5 py-2.5 bg-neutral-g1 font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4">
                                                    Artists
                                                </div>
                                                {artistResults.map((a) => (
                                                    <button
                                                        key={a.id}
                                                        onClick={() => openArtist(a.id)}
                                                        className="w-full text-left px-4 py-3.5 hover:bg-primary/15 transition-colors border-b border-neutral-black/5 last:border-b-0"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {a.displayPhotoUrl ? (
                                                                <img src={a.displayPhotoUrl} alt={a.displayName || a.name} className="w-10 h-10 rounded-full border border-neutral-black/20 object-cover bg-neutral-g1 shrink-0" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full border border-neutral-black/20 bg-primary text-neutral-black font-display text-[14px] font-black flex items-center justify-center shrink-0">
                                                                    {(a.displayName || a.name || "A").charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="font-display text-[12px] font-black uppercase truncate">
                                                                    {a.displayName || a.name}
                                                                </div>
                                                                <div className="font-display text-[10px] font-bold uppercase tracking-[1px] text-neutral-g3">
                                                                    {a.productCount || 0} designs published
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Profile */}
                        {isAuthenticated && user ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="w-[44px] h-[44px] flex items-center justify-center rounded-[4px] border-[2px] border-neutral-black bg-primary text-neutral-black hover:bg-neutral-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group overflow-hidden"
                                >
                                    {user.displayPhotoUrl ? (
                                        <img src={user.displayPhotoUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-display text-[16px] font-black italic uppercase transition-all">
                                            {(user.displayName || user.name).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white border-[2.5px] border-neutral-black rounded-[4px] py-1 z-[110] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-2 duration-200">
                                        <div className="px-5 py-4 border-b-[2px] border-neutral-black/5 bg-neutral-g1/50">
                                            <p className="font-display text-[14px] font-black uppercase tracking-tight truncate">{user.displayName || user.name}</p>
                                            <p className="text-[10px] font-bold text-neutral-g4 truncate uppercase tracking-widest mt-0.5">{user.email}</p>
                                        </div>
                                        <Link to="/user/profile" className="flex items-center gap-4 px-5 py-3.5 text-[12px] font-display font-black uppercase tracking-[1px] text-neutral-black hover:bg-primary transition-all no-underline">
                                            <User className="w-4 h-4" />My Profile
                                        </Link>
                                        <Link to="/orders" className="flex items-center gap-4 px-5 py-3.5 text-[12px] font-display font-black uppercase tracking-[1px] text-neutral-black hover:bg-primary transition-all no-underline">
                                            <Package className="w-4 h-4" />My Orders
                                        </Link>
                                        {user.isArtist && (
                                            <Link to="/artist/dashboard" className="flex items-center gap-4 px-5 py-3.5 text-[12px] font-display font-black uppercase tracking-[1px] text-neutral-black hover:bg-primary transition-all no-underline border-t-[1px] border-neutral-black/5">
                                                <LayoutDashboard className="w-4 h-4" />Artist Terminal
                                            </Link>
                                        )}
                                        {user.isAdmin && (
                                            <Link to="/admin/dashboard" className="flex items-center gap-4 px-5 py-3.5 text-[12px] font-display font-black uppercase tracking-[1px] text-neutral-black hover:bg-primary transition-all no-underline">
                                                <Shield className="w-4 h-4 text-danger" />Command Center
                                            </Link>
                                        )}
                                        <div className="border-t-[2px] border-neutral-black mt-1">
                                            <button onClick={handleSignOut} className="flex items-center gap-4 px-5 py-4 text-[12px] font-display font-black uppercase tracking-[1px] text-danger hover:bg-danger hover:text-white w-full text-left transition-all">
                                                <LogOut className="w-4 h-4" />Terminate Session
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="hidden md:flex h-[44px] px-6 bg-primary text-black font-display text-[13px] font-black tracking-[1.5px] uppercase rounded-[4px] items-center border-[2px] border-neutral-black transition-all bg-primary text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] no-underline">
                                Sign In
                            </Link>
                        )}

                        {/* Cart */}
                        <Link
                            to="/cart"
                            className="w-[44px] h-[44px] flex items-center justify-center rounded-[4px] border-[2px] border-neutral-black bg-neutral-black text-white hover:bg-primary hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all relative no-underline group shadow-[5px_5px_0px_0px_rgba(0,0,0,0.2)]"
                        >
                            <ShoppingCart className="w-[20px] h-[20px] text-primary group-hover:text-neutral-black group-hover:scale-110 transition-all" />
                            {itemCount > 0 && (
                                <span className="absolute -top-2.5 -right-2.5 min-w-[22px] h-[22px] bg-primary rounded-full flex items-center justify-center font-display text-[11px] font-black text-neutral-black px-1 border-[2.5px] border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:scale-110">
                                    {itemCount > 9 ? "9+" : itemCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[150] bg-neutral-black/80 backdrop-blur-md md:hidden transition-all duration-300" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Mobile sidebar */}
            <div className={`fixed inset-y-4 left-4 z-[160] w-[calc(100%-32px)] max-w-sm bg-white border-[3px] border-neutral-black rounded-[8px] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:hidden flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${mobileMenuOpen ? "translate-x-0" : "-translate-x-[calc(100%+40px)]"}`}>
                <div className="flex items-center justify-between p-6 border-b-[2.5px] border-neutral-black">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 no-underline">
                        {headerLogo ? (
                            <img
                                src={headerLogo}
                                alt="TeeHive"
                                className="h-8 w-auto object-contain"
                            />
                        ) : (
                            <>
                                <div className="w-3 h-3 bg-primary rounded-full"></div>
                                <span className="font-display text-[24px] font-black tracking-[1.5px] text-neutral-black">TEEHIVE</span>
                            </>
                        )}
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-10 h-10 border-[2px] border-neutral-black rounded-[4px] flex items-center justify-center hover:bg-neutral-black hover:text-white transition-all active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-8">
                    <form onSubmit={handleSearch} ref={mobileSearchRef} className="relative">
                        <div className="flex items-center gap-3 border-[2.5px] border-neutral-black rounded-[4px] px-4 h-[52px] focus-within:bg-neutral-g1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Search className="w-5 h-5 text-neutral-black/30" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length >= 2 && setSearchOpen(true)}
                                placeholder="FIND PRODUCTS OR ARTISTS..."
                                className="flex-1 border-none outline-none font-display text-[12px] font-black uppercase tracking-[1px] bg-transparent"
                            />
                        </div>

                        {showSearchDropdown && (
                            <div className="absolute left-0 right-0 mt-3 bg-white border-[2.5px] border-neutral-black rounded-[6px] z-[170] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                {searchLoading ? (
                                    <div className="px-4 py-4 font-display text-[10px] font-black uppercase tracking-[1.2px] text-neutral-g3">
                                        Searching the hive...
                                    </div>
                                ) : !hasSearchResults ? (
                                    <div className="px-4 py-4 font-display text-[10px] font-black uppercase tracking-[1.2px] text-neutral-g3">
                                        No matching products or artists
                                    </div>
                                ) : (
                                    <div className="max-h-[320px] overflow-y-auto">
                                        {productResults.length > 0 && (
                                            <div className="border-b border-neutral-black/10">
                                                <div className="px-4 py-2 bg-neutral-g1 font-display text-[9px] font-black uppercase tracking-[1.5px] text-neutral-g4">
                                                    Products
                                                </div>
                                                {productResults.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => openProduct(p.id)}
                                                        className="w-full text-left px-4 py-3 hover:bg-primary/15 transition-colors border-b border-neutral-black/5 last:border-b-0"
                                                    >
                                                        <div className="font-display text-[11px] font-black uppercase truncate">{p.name}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {artistResults.length > 0 && (
                                            <div>
                                                <div className="px-4 py-2 bg-neutral-g1 font-display text-[9px] font-black uppercase tracking-[1.5px] text-neutral-g4">
                                                    Artists
                                                </div>
                                                {artistResults.map((a) => (
                                                    <button
                                                        key={a.id}
                                                        onClick={() => openArtist(a.id)}
                                                        className="w-full text-left px-4 py-3 hover:bg-primary/15 transition-colors border-b border-neutral-black/5 last:border-b-0"
                                                    >
                                                        <div className="font-display text-[11px] font-black uppercase truncate">{a.displayName || a.name}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </form>

                    <nav className="flex flex-col gap-2">
                        <NavLink to="/" end className={({ isActive }) => `flex items-center px-5 py-4 font-display text-[15px] font-black tracking-[1.5px] uppercase rounded-[4px] transition-all no-underline border-[2px] ${isActive ? "bg-primary border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "text-neutral-black hover:bg-neutral-g1 border-transparent"}`}>Home</NavLink>
                        <NavLink to="/products" className={({ isActive }) => `flex items-center px-5 py-4 font-display text-[15px] font-black tracking-[1.5px] uppercase rounded-[4px] transition-all no-underline border-[2px] ${isActive ? "bg-primary border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "text-neutral-black hover:bg-neutral-g1 border-transparent"}`}>Shop Catalog</NavLink>
                        <NavLink to="/artists" className={({ isActive }) => `flex items-center px-5 py-4 font-display text-[15px] font-black tracking-[1.5px] uppercase rounded-[4px] transition-all no-underline border-[2px] ${isActive ? "bg-primary border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "text-neutral-black hover:bg-neutral-g1 border-transparent"}`}>Artist Registry</NavLink>
                        <button
                            onClick={handleBecomeArtist}
                            className="flex items-center px-5 py-4 font-display text-[15px] font-black tracking-[1.5px] uppercase rounded-[4px] transition-all no-underline border-[2px] text-neutral-black hover:bg-neutral-g1 border-transparent text-left"
                        >
                            Become an Artist
                        </button>
                    </nav>
                </div>

                <div className="p-6 border-t-[2.5px] border-neutral-black shrink-0 bg-neutral-g1/50">
                    {!isAuthenticated ? (
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center py-4 bg-white border-[2px] border-neutral-black text-neutral-black font-display text-[13px] font-black tracking-[1.5px] uppercase rounded-[4px] no-underline shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Sign In</Link>
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center py-4 bg-primary border-[2px] border-neutral-black text-neutral-black font-display text-[13px] font-black tracking-[1.5px] uppercase rounded-[4px] no-underline shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black italic">Join Now</Link>
                        </div>
                    ) : (
                        <button onClick={handleSignOut} className="flex items-center justify-center gap-3 w-full py-4 text-white bg-neutral-black font-display text-[13px] font-black tracking-[1.5px] uppercase rounded-[4px] transition-all border-[2px] border-neutral-black active:scale-95">
                            <LogOut className="w-5 h-5 text-danger" /> Terminate Session
                        </button>
                    )}
                </div>
            </div>

            {showArtistSwitchModal && (
                <div className="fixed inset-0 z-[220] bg-neutral-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-white border-[3px] border-neutral-black rounded-[8px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="bg-neutral-black text-white p-6 border-b-[3px] border-neutral-black">
                            <h3 className="font-display text-[26px] font-black uppercase leading-none">
                                Turn Your Art Into <span className="text-primary italic">Income</span>
                            </h3>
                            <p className="font-display text-[11px] font-bold uppercase tracking-[1.2px] text-white/60 mt-2">
                                You are currently signed in as a customer node.
                            </p>
                        </div>
                        <div className="p-6 space-y-5">
                            <p className="font-display text-[12px] font-black uppercase tracking-[1.1px] text-neutral-g4">
                                Switch to artist mode in 3 simple steps:
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Create your artist account profile",
                                    "Upload designs and build your product lineup",
                                    "Get paid on every sale from your storefront",
                                ].map((s, i) => (
                                    <div key={s} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-[2px] bg-primary border-[2px] border-neutral-black font-display text-[11px] font-black flex items-center justify-center shrink-0">
                                            {i + 1}
                                        </div>
                                        <p className="font-display text-[13px] font-black uppercase tracking-[0.6px] leading-snug">
                                            {s}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <p className="font-display text-[11px] font-bold uppercase tracking-[1px] text-neutral-g3">
                                To continue, we will securely sign you out and open artist onboarding.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowArtistSwitchModal(false)}
                                    className="flex-1 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1.2px] hover:bg-neutral-g1 transition-all"
                                >
                                    Stay in Customer Mode
                                </button>
                                <button
                                    onClick={confirmBecomeArtist}
                                    className="flex-1 py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1.2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                >
                                    Logout & Become Artist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
