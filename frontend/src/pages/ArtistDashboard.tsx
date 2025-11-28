import {
    Crown,
    TrendingUp,
    Package,
    Users,
    DollarSign,
    Plus,
    Edit,
    Eye,
    Trash2,
    Search,
    Filter,
    Download,
    Upload,
    Settings,
    Bell,
    Star,
    ShoppingBag,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
} from "lucide-react";

export default function ArtistDashboard() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">
                                    Artist Dashboard
                                </h1>
                                <p className="text-xs text-gray-500">
                                    Welcome back, Maya Chen
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-900">
                                <Settings className="w-5 h-5" />
                            </button>
                            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                                <img
                                    src="https://images.unsplash.com/photo-1571945153237-4929e783af4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                                    alt="Artist"
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="hidden md:block">
                                    <p className="text-sm font-semibold text-gray-900">
                                        Maya Chen
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Artist Account
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Revenue */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                                <ArrowUpRight className="w-4 h-4" />
                                <span>12.5%</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            $12,458
                        </h3>
                        <p className="text-sm text-gray-500">Total Revenue</p>
                        <p className="text-xs text-gray-400 mt-2">This month</p>
                    </div>

                    {/* Total Sales */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                                <ArrowUpRight className="w-4 h-4" />
                                <span>8.2%</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            342
                        </h3>
                        <p className="text-sm text-gray-500">Total Sales</p>
                        <p className="text-xs text-gray-400 mt-2">This month</p>
                    </div>

                    {/* Products */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="flex items-center space-x-1 text-gray-600 text-sm font-medium">
                                <span>-</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            156
                        </h3>
                        <p className="text-sm text-gray-500">Active Products</p>
                        <p className="text-xs text-gray-400 mt-2">
                            12 pending review
                        </p>
                    </div>

                    {/* Followers */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                                <ArrowUpRight className="w-4 h-4" />
                                <span>15.3%</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            2,547
                        </h3>
                        <p className="text-sm text-gray-500">Followers</p>
                        <p className="text-xs text-gray-400 mt-2">
                            +127 this week
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Chart Placeholder */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Revenue Overview
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Monthly earnings trend
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Week
                                </button>
                                <button className="px-4 py-2 text-sm font-medium text-white bg-yellow-400 rounded-lg hover:bg-yellow-500 transition-colors">
                                    Month
                                </button>
                                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Year
                                </button>
                            </div>
                        </div>
                        {/* Chart Placeholder */}
                        <div className="h-64 bg-gradient-to-br from-yellow-50 to-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">
                                    Revenue Chart
                                </p>
                                <p className="text-sm text-gray-400">
                                    Chart visualization goes here
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all">
                                <Plus className="w-5 h-5" />
                                <span className="font-semibold">
                                    Add New Product
                                </span>
                            </button>
                            <button className="w-full flex items-center space-x-3 p-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                                <Upload className="w-5 h-5" />
                                <span className="font-semibold">
                                    Upload Design
                                </span>
                            </button>
                            <button className="w-full flex items-center space-x-3 p-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                                <Download className="w-5 h-5" />
                                <span className="font-semibold">
                                    Export Reports
                                </span>
                            </button>
                            <button className="w-full flex items-center space-x-3 p-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                                <Edit className="w-5 h-5" />
                                <span className="font-semibold">
                                    Edit Profile
                                </span>
                            </button>
                        </div>

                        {/* Artist Rating */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    Artist Rating
                                </span>
                                <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-bold text-gray-900">
                                        4.9
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600">
                                Based on 1,234 reviews
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Recent Orders
                            </h3>
                            <p className="text-sm text-gray-500">
                                Latest customer purchases
                            </p>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors">
                            View All
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                        Order ID
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                        Product
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                        Customer
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                        Date
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                        Amount
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    {
                                        id: "#ORD-2547",
                                        product: "Cosmic Dreams Tee",
                                        customer: "John Doe",
                                        date: "Dec 15, 2024",
                                        amount: "$45.00",
                                        status: "Completed",
                                    },
                                    {
                                        id: "#ORD-2546",
                                        product: "Urban Jungle Hoodie",
                                        customer: "Jane Smith",
                                        date: "Dec 14, 2024",
                                        amount: "$78.00",
                                        status: "Processing",
                                    },
                                    {
                                        id: "#ORD-2545",
                                        product: "Abstract Lines Jacket",
                                        customer: "Mike Johnson",
                                        date: "Dec 14, 2024",
                                        amount: "$125.00",
                                        status: "Completed",
                                    },
                                    {
                                        id: "#ORD-2544",
                                        product: "Vintage Waves Dress",
                                        customer: "Sarah Williams",
                                        date: "Dec 13, 2024",
                                        amount: "$92.00",
                                        status: "Shipped",
                                    },
                                    {
                                        id: "#ORD-2543",
                                        product: "Cosmic Dreams Tee",
                                        customer: "Tom Brown",
                                        date: "Dec 13, 2024",
                                        amount: "$45.00",
                                        status: "Completed",
                                    },
                                ].map((order, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-medium text-gray-900">
                                                {order.id}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm text-gray-700">
                                                {order.product}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm text-gray-700">
                                                {order.customer}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm text-gray-500">
                                                {order.date}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {order.amount}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                                    order.status === "Completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : order.status ===
                                                          "Processing"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-blue-100 text-blue-700"
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <button className="p-1 text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Products Management */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                My Products
                            </h3>
                            <p className="text-sm text-gray-500">
                                Manage your product listings
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 w-full sm:w-64"
                                />
                            </div>
                            <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Filter
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80",
                                title: "Cosmic Dreams Tee",
                                price: "$45.00",
                                sales: 342,
                                stock: 125,
                                status: "Active",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
                                title: "Urban Jungle Hoodie",
                                price: "$78.00",
                                sales: 256,
                                stock: 89,
                                status: "Active",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
                                title: "Vintage Waves Dress",
                                price: "$92.00",
                                sales: 178,
                                stock: 45,
                                status: "Low Stock",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
                                title: "Abstract Lines Jacket",
                                price: "$125.00",
                                sales: 134,
                                stock: 67,
                                status: "Active",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
                                title: "Minimalist Basic Tee",
                                price: "$38.00",
                                sales: 421,
                                stock: 0,
                                status: "Out of Stock",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1581791538302-1dcfc2d1e2ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
                                title: "Neon Dreams Hoodie",
                                price: "$82.00",
                                sales: 98,
                                stock: 156,
                                status: "Active",
                            },
                        ].map((product, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="aspect-square overflow-hidden relative group">
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                product.status === "Active"
                                                    ? "bg-green-100 text-green-700"
                                                    : product.status ===
                                                      "Low Stock"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {product.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-gray-900 mb-1">
                                        {product.title}
                                    </h4>
                                    <p className="text-lg font-bold text-yellow-600 mb-3">
                                        {product.price}
                                    </p>
                                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                                        <span>{product.sales} sales</span>
                                        <span>{product.stock} in stock</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className="flex-1 flex items-center justify-center space-x-2 py-2 border border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                                            <Eye className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                View
                                            </span>
                                        </button>
                                        <button className="flex-1 flex items-center justify-center space-x-2 py-2 border border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                                            <Edit className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                Edit
                                            </span>
                                        </button>
                                        <button className="p-2 border border-gray-200 rounded-lg hover:border-red-400 hover:bg-red-50 text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center mt-6">
                        <button className="px-6 py-3 text-sm font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors">
                            Load More Products
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
