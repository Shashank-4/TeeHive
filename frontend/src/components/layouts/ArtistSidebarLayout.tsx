import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSiteHeaderLogo } from "../../hooks/useSiteHeaderLogo";
import {
    LayoutDashboard,
    Palette,
    Image,
    Package,
    UserCircle,
    LogOut,
    X,
    ChevronLeft,
    Crown,
    ShieldCheck,
    ClipboardList,
    ExternalLink,
    Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import { artistPublicPath } from "../../utils/artistRoutes";

const artistNavItems = [
    { to: "/artist/dashboard", icon: LayoutDashboard, label: "Dashboard", requiresVerified: true },
    { to: "/artist/orders", icon: ClipboardList, label: "Orders", requiresVerified: true },
    { to: "/artist/manage-designs", icon: Palette, label: "My Designs", requiresVerified: true },
    { to: "/artist/create-mockup", icon: Image, label: "Mockup Creator", requiresVerified: true },
    { to: "/artist/manage-products", icon: Package, label: "My Products", requiresVerified: true },
    { to: "/artist/payout", icon: ShieldCheck, label: "Payout", requiresVerified: true },
    { to: "/artist/earnings", icon: Crown, label: "Earnings", requiresVerified: true },
    { to: "/artist/profile", icon: UserCircle, label: "Profile", requiresVerified: false },
];

export default function ArtistSidebarLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const headerLogoSrc = useSiteHeaderLogo();

    const isVerified = user?.verificationStatus === "VERIFIED";
    const isPending = user?.verificationStatus === "PENDING_VERIFICATION";
    const isRejected = user?.verificationStatus === "REJECTED";

    useEffect(() => {
        if (!user) return;
        if (!user.isArtist) { navigate("/"); return; }
        const currentNavItem = artistNavItems.find(item => item.to === location.pathname);
        if (currentNavItem?.requiresVerified && !isVerified) {
            navigate("/artist/verification-status", { replace: true });
        }
    }, [user, navigate, location.pathname, isVerified]);

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    const openPublicStorefront = () => {
        if (!user?.id) return;
        const path = artistPublicPath({ id: user.id, artistSlug: user.artistSlug });
        window.open(path, "_blank", "noopener,noreferrer");
    };

    const StatusBadge = ({ showOpen }: { showOpen: boolean }) => {
        if (isVerified) return (
            <div className="flex items-center gap-[5px] font-display text-[9px] font-extrabold tracking-[1px] uppercase text-success mt-1">
                <span className="w-[6px] h-[6px] rounded-full bg-success"></span>
                {showOpen && <span>Verified</span>}
            </div>
        );
        if (isPending) return (
            <div className="flex items-center gap-[5px] font-display text-[9px] font-extrabold tracking-[1px] uppercase text-primary-dark mt-1">
                <span className="w-[6px] h-[6px] rounded-full bg-primary-dark"></span>
                {showOpen && <span>Under Review</span>}
            </div>
        );
        if (isRejected) return (
            <div className="flex items-center gap-[5px] font-display text-[9px] font-extrabold tracking-[1px] uppercase text-danger mt-1">
                <span className="w-[6px] h-[6px] rounded-full bg-danger"></span>
                {showOpen && <span>Rejected</span>}
            </div>
        );
        return (
            <div className="flex items-center gap-[5px] font-display text-[9px] font-extrabold tracking-[1px] uppercase text-neutral-g4 mt-1">
                <span className="w-[6px] h-[6px] rounded-full bg-neutral-g3"></span>
                {showOpen && <span>Setup Required</span>}
            </div>
        );
    };

    const SidebarContent = ({ forceExpanded = false }: { forceExpanded?: boolean }) => {
        const showOpen = forceExpanded || sidebarOpen;

        return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between px-[14px] h-[60px] border-b-[1.5px] border-neutral-black shrink-0 overflow-hidden">
                <div
                    className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                    onClick={() => navigate("/artist/dashboard")}
                >
                    <img
                        src={headerLogoSrc}
                        alt="TeeHive"
                        className={`object-contain shrink-0 ${showOpen ? "h-16 w-auto max-w-[140px]" : "h-8 w-auto max-w-[100px]"}`}
                    />
                </div>
                {/* Desktop toggle */}
                <button
                    type="button"
                    aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex items-center justify-center w-9 h-9 rounded-[4px] bg-neutral-g1 hover:bg-primary border-[1.5px] border-neutral-black transition-all shrink-0 active:scale-95"
                >
                    <ChevronLeft className={`w-4 h-4 stroke-neutral-black stroke-[2.5] transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
                </button>
                {/* Mobile close */}
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden flex items-center justify-center w-7 h-7 rounded-[4px] bg-neutral-g1 hover:bg-primary transition-colors"
                >
                    <X className="w-[14px] h-[14px] stroke-neutral-black stroke-[2.5]" />
                </button>
            </div>

            {/* Profile */}
            <div className="px-[14px] py-3 border-b border-neutral-g2 shrink-0 overflow-hidden">
                <div className="flex items-center gap-[10px]">
                    <div className="w-[38px] h-[38px] rounded-[4px] bg-primary flex items-center justify-center font-display text-[17px] font-black text-neutral-black shrink-0">
                        {user?.displayPhotoUrl ? (
                            <img src={user.displayPhotoUrl} alt="" className="w-full h-full object-cover rounded-[4px]" />
                        ) : (
                            (user?.displayName || user?.name || "A").charAt(0).toUpperCase()
                        )}
                    </div>
                    {showOpen && (
                        <div className="min-w-0">
                            <div className="font-display text-[13px] font-extrabold text-neutral-black truncate">
                                {user?.displayName || user?.name}
                            </div>
                            <div className="text-[10px] text-neutral-g4 truncate max-w-[155px] mt-[1px]">
                                {user?.email}
                            </div>
                        </div>
                    )}
                </div>
                <StatusBadge showOpen={showOpen} />
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-[6px] overflow-y-auto overflow-x-hidden scrollbar-hide">
                {artistNavItems.map((item) => {
                    const isDisabled = item.requiresVerified && !isVerified;
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;

                    return (
                        <NavLink
                            key={item.to}
                            to={isDisabled ? "#" : item.to}
                            onClick={(e) => {
                                if (isDisabled) e.preventDefault();
                                setMobileOpen(false);
                            }}
                            className={`flex items-center gap-3 py-[11px] px-[14px] font-display text-[13px] font-bold tracking-[0.5px] uppercase transition-all duration-150 border-l-[3px] whitespace-nowrap ${isActive
                                ? "bg-primary-light text-neutral-black border-l-primary"
                                : isDisabled
                                    ? "text-neutral-g3 cursor-not-allowed border-l-transparent"
                                    : "text-neutral-g4 hover:bg-neutral-g1 hover:text-neutral-black border-l-transparent hover:border-l-neutral-g3"
                                }`}
                        >
                            <Icon className={`w-[17px] h-[17px] shrink-0 stroke-[1.8] ${isActive ? "stroke-neutral-black" : isDisabled ? "stroke-neutral-g3" : "stroke-current"
                                }`} />
                            {showOpen && <span className="transition-opacity duration-200">{item.label}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Storefront + Sign Out — aligned with admin sidebar footer */}
            <div className="px-4 py-6 border-t-[2px] border-neutral-black shrink-0 space-y-3 bg-white">
                <button
                    type="button"
                    onClick={openPublicStorefront}
                    className={`group w-full flex items-center gap-3 py-3 px-3 border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] text-neutral-black bg-white hover:bg-neutral-black hover:text-white transition-all ${!showOpen ? "justify-center border-none p-2" : ""}`}
                >
                    <ExternalLink className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 stroke-[2]" />
                    {showOpen && <span>View Storefront</span>}
                </button>
                <button
                    type="button"
                    onClick={handleSignOut}
                    className={`w-full flex items-center gap-3 py-3 px-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] text-danger hover:bg-danger hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none translate-y-[-1px] active:translate-y-0 ${!showOpen ? "justify-center border-none p-2 bg-transparent" : ""}`}
                >
                    <LogOut className="w-4 h-4 shrink-0 stroke-current stroke-[2]" />
                    {showOpen && <span>Terminate Session</span>}
                </button>
            </div>
        </div>
        );
    };

    return (
        <div className="flex h-screen bg-neutral-g1 overflow-hidden font-body">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r-[1.5px] border-neutral-black transform transition-transform duration-200 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <SidebarContent forceExpanded />
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex lg:flex-col bg-white border-r-[1.5px] border-neutral-black transition-all duration-200 shrink-0 ${sidebarOpen ? "w-[240px]" : "w-16"
                    }`}
            >
                <SidebarContent />
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="lg:hidden shrink-0 flex items-center gap-3 h-[52px] px-3 bg-white border-b-[1.5px] border-neutral-black z-[30]">
                    <button
                        type="button"
                        aria-label="Open menu"
                        onClick={() => setMobileOpen(true)}
                        className="flex items-center justify-center w-10 h-10 rounded-[4px] border-[1.5px] border-neutral-black bg-neutral-g1 hover:bg-primary active:scale-95 transition-all"
                    >
                        <Menu className="w-5 h-5 stroke-neutral-black stroke-[2.5]" />
                    </button>
                    <span className="font-display text-[14px] font-black tracking-[1px] text-neutral-black truncate uppercase">
                        Artist Studio
                    </span>
                </header>
                <main className="flex-1 overflow-y-auto min-h-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
