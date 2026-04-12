import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingBag,
    LogOut,
    ChevronLeft,
    Crown,
    Palette,
    Tag,
    Settings,
    ExternalLink,
    FolderLock,
    Droplet,
    Star,
    Menu,
    X,
} from "lucide-react";
import { useState, useEffect } from "react";

const adminNavItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Command Center" },
    { to: "/admin/artists", icon: Palette, label: "Personnel" },
    { to: "/admin/designs", icon: FolderLock, label: "Designs Vault" },
    { to: "/admin/products", icon: Package, label: "Inventory" },
    { to: "/admin/categories", icon: Tag, label: "Taxonomy" },
    { to: "/admin/colors", icon: Droplet, label: "Global Colors" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Logistics" },
    { to: "/admin/reviews", icon: Star, label: "Feedbacks" },
    { to: "/admin/users", icon: Users, label: "Identities" },
    { to: "/admin/config", icon: Settings, label: "Protocol Config" },
];

export default function AdminSidebarLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (user && !user.isAdmin) {
            navigate("/");
        }
    }, [user, navigate]);

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    const SidebarContent = ({ forceExpanded = false }: { forceExpanded?: boolean }) => {
        const showOpen = forceExpanded || sidebarOpen;

        return (
        <div className="flex flex-col h-full bg-white">
            {/* Logo */}
            <div className="flex items-center justify-between gap-3 px-5 h-[72px] border-b-[2px] border-neutral-black shrink-0 overflow-hidden bg-white">
                <div
                    className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
                    onClick={() => navigate("/admin/dashboard")}
                >
                    <div className="w-9 h-9 bg-neutral-black text-primary border-[2px] border-neutral-black rounded-[4px] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Crown className="w-5 h-5" />
                    </div>
                    {showOpen && (
                        <div className="flex flex-col min-w-0">
                            <span className="font-display text-[18px] font-black tracking-[1px] text-neutral-black whitespace-nowrap leading-none">
                                TEE<span className="text-primary italic">HIVE</span>
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[2px] text-neutral-black/40 mt-0.5">
                                CONTROL_UNIT
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-[4px] bg-neutral-g1 hover:bg-primary border-[2px] border-neutral-black transition-all active:scale-95"
                    >
                        <X className="w-4 h-4 stroke-neutral-black stroke-[2.5]" />
                    </button>
                    <button
                        type="button"
                        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-[4px] bg-neutral-g1 hover:bg-neutral-black hover:text-white border-[2px] border-neutral-black transition-all shrink-0 active:scale-90"
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-hide px-3 space-y-1 min-h-0">
                {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        location.pathname === item.to ||
                        (item.to !== "/admin/dashboard" && location.pathname.startsWith(item.to + "/"));

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-4 py-3.5 px-3.5 font-display text-[11px] font-black uppercase tracking-[1px] transition-all border-[2px] rounded-[4px] whitespace-nowrap group ${isActive
                                ? "bg-primary border-neutral-black text-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                : "text-neutral-g4 hover:bg-neutral-g1 hover:border-neutral-black hover:text-neutral-black border-transparent"
                                }`}
                        >
                            <Icon className={`w-5 h-5 shrink-0 group-hover:scale-110 transition-transform ${isActive ? "text-neutral-black" : "text-neutral-g3 group-hover:text-black"}`} />
                            {showOpen && <span className="flex-1">{item.label}</span>}
                            {showOpen && isActive && <div className="w-1.5 h-1.5 bg-neutral-black rounded-full animate-pulse" />}
                        </NavLink>
                    );
                })}
            </nav>

            {/* System Footer */}
            <div className="px-4 py-6 border-t-[2px] border-neutral-black shrink-0 space-y-3">
                <button
                    type="button"
                    onClick={() => window.open("/", "_blank", "noopener,noreferrer")}
                    className={`group w-full flex items-center gap-3 py-3 px-3 border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] hover:bg-neutral-black hover:text-white transition-all ${!showOpen ? "justify-center border-none p-2" : ""}`}
                >
                    <ExternalLink className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    {showOpen && <span>View Main Feed</span>}
                </button>
                <button
                    type="button"
                    onClick={handleSignOut}
                    className={`w-full flex items-center gap-3 py-3 px-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] text-danger hover:bg-danger hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none translate-y-[-1px] active:translate-y-0 ${!showOpen ? "justify-center border-none p-2 bg-transparent" : ""}`}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {showOpen && <span>Terminate Session</span>}
                </button>
            </div>
        </div>
        );
    };

    return (
        <div className="flex h-screen bg-neutral-g1 overflow-hidden font-display text-neutral-black">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-neutral-black/80 backdrop-blur-md lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={`fixed inset-y-0 left-4 z-[110] w-[260px] my-4 rounded-[8px] overflow-hidden border-[3px] border-neutral-black transform transition-transform duration-300 ease-in-out lg:hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+20px)]"}`}
            >
                <SidebarContent forceExpanded />
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex lg:flex-col bg-white border-r-[3px] border-neutral-black transition-all duration-300 shrink-0 ${sidebarOpen ? "w-[280px]" : "w-[88px]"}`}
            >
                <SidebarContent />
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />

                <header className="lg:hidden shrink-0 flex items-center gap-3 h-[56px] px-3 bg-white border-b-[2px] border-neutral-black relative z-[25]">
                    <button
                        type="button"
                        aria-label="Open menu"
                        onClick={() => setMobileOpen(true)}
                        className="flex items-center justify-center w-10 h-10 rounded-[4px] border-[2px] border-neutral-black bg-neutral-g1 hover:bg-primary active:scale-95 transition-all"
                    >
                        <Menu className="w-5 h-5 stroke-neutral-black stroke-[2.5]" />
                    </button>
                    <span className="font-display text-[13px] font-black tracking-[1px] text-neutral-black truncate uppercase">
                        Admin Control
                    </span>
                </header>

                {/* Outlet Content */}
                <main className="flex-1 overflow-y-auto w-full min-h-0 custom-scrollbar scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
