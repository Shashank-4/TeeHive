import React, { useState, useEffect } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Users,
    Shield,
    Calendar,
    Filter,
    CreditCard,
    ShoppingBag
} from "lucide-react";
import api from "../../api/axios";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
    orderCount: number;
    totalSpent: number;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const roleSelectClass = (role: string) => {
    if (role === "admin") return "bg-neutral-black text-white border-neutral-black shadow-[2px_2px_0px_0px_rgba(34,197,94,0.3)]";
    if (role === "artist") return "bg-primary text-neutral-black border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
    return "bg-white text-neutral-black border-neutral-black";
};

export default function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const fetchUsers = async (page = 1, search = searchQuery, role = roleFilter) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/users`, { params: { page, limit: 10, search, role } });
            setUsers(res.data.data.users);
            setPagination(res.data.data.pagination);
            setError(null);
        } catch (err) {
            console.error("Failed to load users", err);
            setError("Failed to load user database. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchUsers(1, searchQuery, roleFilter); };
    const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const v = e.target.value; setRoleFilter(v); fetchUsers(1, searchQuery, v); };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setActionLoading({ ...actionLoading, [userId]: true });
        try {
            await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error("Failed to update role", err);
            alert("Failed to update user role");
        } finally {
            setActionLoading({ ...actionLoading, [userId]: false });
        }
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 text-neutral-black">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Users className="w-3 h-3 text-primary" /> Personnel Database
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Identity <span className="text-primary italic">Registry</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Manage global access levels and monitor subject participation metrics.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-[2px] border-red-500 p-6 rounded-[4px] mb-8 flex items-center gap-4 animate-bounce">
                        <Shield className="text-red-500 w-8 h-8" />
                        <div>
                            <h4 className="font-display text-[12px] font-black uppercase text-red-500 tracking-[1px]">Data Access Violation</h4>
                            <p className="font-display text-[11px] font-bold text-red-400 uppercase">{error}</p>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <form onSubmit={handleSearch} className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6 mb-8">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black" />
                        <input
                            type="text"
                            placeholder="SEARCH BY NAME, EMAIL OR UNIQUE IDENTITY..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black pointer-events-none" />
                            <select
                                value={roleFilter}
                                onChange={handleRoleFilterChange}
                                className="pl-11 pr-10 py-4 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none cursor-pointer hover:bg-primary transition-all appearance-none min-w-[180px]"
                            >
                                <option value="all">Global Access</option>
                                <option value="user">Subjects (Users)</option>
                                <option value="artist">Creators (Artists)</option>
                                <option value="admin">Controllers (Admins)</option>
                            </select>
                        </div>
                        <button type="submit" className="px-10 py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                            Scan Database
                        </button>
                    </div>
                </form>

                {/* Table Container */}
                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    {["Identity Node", "Communication Node", "Asset Flow", "Credit Value", "Clearance Level", "Registration index"].map(h => (
                                        <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-6 text-left whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y-[1px] divide-neutral-black/10">
                                {loading && users.length === 0 ? (
                                    <tr><td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                            <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Syncing Personnel Feed...</p>
                                        </div>
                                    </td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Users className="w-16 h-16" />
                                            <p className="font-display text-[12px] font-black uppercase tracking-[2px]">Database Query: 0 Results</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-neutral-black border-[2px] border-neutral-black rounded-[4px] flex items-center justify-center font-display text-[16px] font-black text-white group-hover:bg-primary group-hover:text-neutral-black transition-all group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] italic">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-display text-[15px] font-black text-neutral-black uppercase tracking-tight truncate">{user.name}</span>
                                                        <span className="font-display text-[8px] font-bold text-neutral-g3 uppercase tracking-widest">SUB_ID: {user.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 font-display text-[12px] font-bold text-neutral-g4 uppercase">{user.email}</td>
                                            <td className="py-5 px-6 font-display text-[14px] font-black text-neutral-black uppercase flex items-center gap-2">
                                                <ShoppingBag className="w-3 h-3 text-primary" /> {user.orderCount} <span className="text-[9px] opacity-40">Orders</span>
                                            </td>
                                            <td className="py-5 px-6 font-display text-[18px] font-black text-neutral-black italic tracking-tighter">
                                                <div className="flex items-center gap-2 font-display text-[18px] font-black text-neutral-black italic">
                                                    <CreditCard className="w-3 h-3 opacity-20" /> ₹{user.totalSpent.toLocaleString('en-IN')}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    disabled={actionLoading[user.id]}
                                                    className={`appearance-none px-4 py-2 pr-8 rounded-[2px] font-display text-[9px] font-black tracking-[1.5px] uppercase border-[2px] focus:outline-none cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-1px] translate-y-[-1px] hover:translate-x-0 hover:translate-y-0 ${roleSelectClass(user.role)} ${actionLoading[user.id] ? "opacity-30 cursor-wait" : ""}`}
                                                >
                                                    <option value="user">User Node</option>
                                                    <option value="artist">Creator Node</option>
                                                    <option value="admin">System Admin</option>
                                                </select>
                                            </td>
                                            <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-g4 uppercase">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" /> {new Date(user.joinedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && users.length > 0 && (
                        <div className="bg-neutral-black px-8 py-5 flex items-center justify-between">
                            <span className="font-display text-[10px] font-black text-primary uppercase tracking-[2px]">
                                Database Page {pagination.page} / {pagination.totalPages} — {pagination.total} Identities Encrypted
                            </span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page === 1}
                                    className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                                    className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
