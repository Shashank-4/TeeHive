import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingBag,
    LogOut,
    Menu,
    ChevronLeft,
    Crown,
    Shield,
    Palette,
    Tag,
    Settings,
    Bell,
    ExternalLink,
    Search,
    FolderLock,
    Droplet,
    Star
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

const pageTitles: Record<string, { title: string; subtitle: string; code: string }> = {
    "/admin/dashboard": { title: "CENTRAL INTELLIGENCE", subtitle: "Global platform telemetry & vitals", code: "SYS_OVERVIEW_01" },
    "/admin/artists": { title: "PERSONNEL DIRECTORY", subtitle: "Authorized creator nodes & verification", code: "AUTH_NODES_02" },
    "/admin/designs": { title: "SECURE VAULT", subtitle: "Centralized design asset management", code: "DSGN_VAULT_08" },
    "/admin/products": { title: "ASSET REPOSITORY", subtitle: "SKU management & publication states", code: "INV_LOG_03" },
    "/admin/categories": { title: "TAXONOMY ENGINE", subtitle: "System-wide classification schema", code: "STRUC_NODE_04" },
    "/admin/colors": { title: "COLOR MATRIX", subtitle: "Global blank mockup and hex mappings", code: "CLR_ATTRIB_09" },
    "/admin/orders": { title: "LOGISTICS LEDGER", subtitle: "Transaction fulfillment & authorization", code: "TRANS_OPS_05" },
    "/admin/reviews": { title: "CUSTOMER FEEDBACKS", subtitle: "Monitor product quality & artist ratings", code: "CUST_FB_10" },
    "/admin/users": { title: "IDENTITY REGISTRY", subtitle: "Access level monitoring & control", code: "USR_SESS_06" },
    "/admin/config": { title: "SYSTEM PROTOCOLS", subtitle: "Global site toggles & endpoint logic", code: "CORE_CFG_07" },
};

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

    const currentPage = pageTitles[location.pathname] || { title: "SECURE CONSOLE", subtitle: "Restricted Administrative Interface", code: "AUTH_REQ" };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white">
            {/* Logo */}
            <div className="flex items-center justify-between px-5 h-[72px] border-b-[2px] border-neutral-black shrink-0 overflow-hidden bg-white">
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate("/admin/dashboard")}
                >
                    <div className="w-9 h-9 bg-neutral-black text-primary border-[2px] border-neutral-black rounded-[4px] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Crown className="w-5 h-5" />
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <span className="font-display text-[18px] font-black tracking-[1px] text-neutral-black whitespace-nowrap leading-none">
                                TEE<span className="text-primary italic">HIVE</span>
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[2px] text-neutral-black/40 mt-0.5">
                                CONTROL_UNIT
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex items-center justify-center w-8 h-8 rounded-[4px] bg-neutral-g1 hover:bg-neutral-black hover:text-white border-[2px] border-neutral-black transition-all shrink-0 active:scale-90"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`} />
                </button>
            </div>            

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-hide px-3 space-y-1">
                {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;

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
                            {sidebarOpen && <span className="flex-1">{item.label}</span>}
                            {sidebarOpen && isActive && <div className="w-1.5 h-1.5 bg-neutral-black rounded-full animate-pulse" />}
                        </NavLink>
                    );
                })}
            </nav>

            {/* System Footer */}
            <div className="px-4 py-6 border-t-[2px] border-neutral-black shrink-0 space-y-3">
                <button
                    onClick={() => window.open('/', '_blank')}
                    className={`group w-full flex items-center gap-3 py-3 px-3 border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] hover:bg-neutral-black hover:text-white transition-all ${!sidebarOpen ? 'justify-center border-none p-2' : ''}`}
                >
                    <ExternalLink className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    {sidebarOpen && <span>View Main Feed</span>}
                </button>
                <button
                    onClick={handleSignOut}
                    className={`w-full flex items-center gap-3 py-3 px-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] text-danger hover:bg-danger hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none translate-y-[-1px] active:translate-y-0 ${!sidebarOpen ? "justify-center border-none p-2 bg-transparent" : ""}`}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {sidebarOpen && <span>Terminate Session</span>}
                </button>
            </div>
        </div>
    );

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
                <SidebarContent />
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

                {/* Outlet Content */}
                <main className="flex-1 overflow-y-auto w-full custom-scrollbar scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
