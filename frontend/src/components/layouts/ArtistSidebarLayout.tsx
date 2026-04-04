import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
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
    Star,
} from "lucide-react";
import { useState, useEffect } from "react";

const artistNavItems = [
    { to: "/artist/dashboard", icon: LayoutDashboard, label: "Dashboard", requiresVerified: true },
    { to: "/artist/orders", icon: ClipboardList, label: "Orders", requiresVerified: true },
    { to: "/artist/manage-designs", icon: Palette, label: "My Designs", requiresVerified: true },
    { to: "/artist/create-mockup", icon: Image, label: "Mockup Creator", requiresVerified: true },
    { to: "/artist/manage-products", icon: Package, label: "My Products", requiresVerified: true },
    { to: "/artist/payout", icon: ShieldCheck, label: "Payout", requiresVerified: true },
    { to: "/artist/earnings", icon: Crown, label: "Earnings", requiresVerified: true },
    { to: "/artist/reviews", icon: Star, label: "Reviews", requiresVerified: true },
    { to: "/artist/profile", icon: UserCircle, label: "Profile", requiresVerified: false },
];

export default function ArtistSidebarLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [headerLogo, setHeaderLogo] = useState("");

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

    useEffect(() => {
        const fetchHeaderLogo = async () => {
            try {
                const res = await api.get("/api/config/site_banners");
                const logo = res.data?.data?.config?.headerLogo;
                if (typeof logo === "string") setHeaderLogo(logo);
            } catch {
                // Keep current fallback logo treatment.
            }
        };
        fetchHeaderLogo();
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    const StatusBadge = () => {
        if (isVerified) return (
            <div className="flex items-center gap-[5px] font-display text-[9px] font-extrabold tracking-[1px] uppercase text-success mt-1">
                <span className="w-[6px] h-[6px] rounded-full bg-success"></span>
                {sidebarOpen && <span>Verified</span>}
            </div>
        );
        if (isPending) return (
            <div className="flex items-center gap-[5px] font-display text-[9px] font-extrabold tracking-[1px] uppercase text-primary-dark mt-1">
                <span className="w-[6px] h-[6px] rounded-full bg-primary-dark"></span>
                {sidebarOpen && <span>Under Review</span>}
            </div>
        );
        if (isRejected) return (
            <div className="flex items-center gap-[5px] font-display text-[9px] font-extrabold tracking-[1px] uppercase text-danger mt-1">
                <span className="w-[6px] h-[6px] rounded-full bg-danger"></span>
                {sidebarOpen && <span>Rejected</span>}
            </div>
        );
        return (
            <div className="flex items-center gap-[5px] font-display text-[9px] font-extrabold tracking-[1px] uppercase text-neutral-g4 mt-1">
                <span className="w-[6px] h-[6px] rounded-full bg-neutral-g3"></span>
                {sidebarOpen && <span>Setup Required</span>}
            </div>
        );
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between px-[14px] h-[60px] border-b-[1.5px] border-neutral-black shrink-0 overflow-hidden">
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate("/artist/dashboard")}
                >
                    {headerLogo ? (
                        <img
                            src={headerLogo}
                            alt="TeeHive"
                            className={`${sidebarOpen ? "h-8 w-auto max-w-[140px]" : "h-8 w-8"} object-contain shrink-0`}
                        />
                    ) : (
                        <>
                            <div className="w-8 h-8 bg-primary rounded-[4px] flex items-center justify-center shrink-0">
                                <Crown className="w-4 h-4 text-neutral-black" />
                            </div>
                            {sidebarOpen && (
                                <span className="font-display text-[21px] font-black tracking-[2px] text-neutral-black whitespace-nowrap transition-opacity duration-200">
                                    TEEHIVE
                                </span>
                            )}
                        </>
                    )}
                </div>
                {/* Desktop toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex items-center justify-center w-7 h-7 rounded-[4px] bg-neutral-g1 hover:bg-primary transition-colors shrink-0"
                >
                    <ChevronLeft className={`w-[14px] h-[14px] stroke-neutral-black stroke-[2.5] transition-transform duration-200 ${!sidebarOpen ? "rotate-180" : ""}`} />
                </button>
                {/* Mobile close */}
                <button
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
                    {sidebarOpen && (
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
                <StatusBadge />
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
                            {sidebarOpen && <span className="transition-opacity duration-200">{item.label}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Sign Out */}
            <div className="px-[14px] py-3 border-t border-neutral-g2 shrink-0">
                <button
                    onClick={handleSignOut}
                    className={`flex items-center gap-[10px] font-display text-[12px] font-bold tracking-[0.5px] uppercase text-neutral-g4 hover:text-danger transition-colors whitespace-nowrap ${!sidebarOpen ? "justify-center w-full" : ""
                        }`}
                >
                    <LogOut className="w-4 h-4 shrink-0 stroke-current stroke-[1.8]" />
                    {sidebarOpen && <span>Sign Out</span>}
                </button>
            </div>
        </div>
    );

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
                <SidebarContent />
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
                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
