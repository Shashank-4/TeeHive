import {
    ArrowLeft,
    Star,
    Users,
    MapPin,
    Award,
    Heart,
    ShoppingBag,
    Share2,
    MessageCircle,
    Instagram,
    Twitter,
    Globe,
    Filter,
    Search,
    TrendingUp,
    Package,
    CheckCircle,
    ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ArtistProfile() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Navigation */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link
                            to={"http://localhost:5173/"}
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back to Home</span>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-900 relative transition-colors">
                                <ShoppingBag className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    3
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Cover Image */}
            <div className="relative h-80 bg-gradient-to-br from-yellow-100 via-yellow-50 to-white overflow-hidden">
                <img
                    src="https://plus.unsplash.com/premium_photo-1674978723881-2e780192e416?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2071"
                    alt="Cover"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 from-transparent to-gray-50" />
            </div>

            {/* Profile Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Image */}
                        <div className="relative flex-shrink-0">
                            <img
                                src="https://images.unsplash.com/photo-1571945153237-4929e783af4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                                alt="Maya Chen"
                                className="w-40 h-40 rounded-2xl object-cover border-4 border-white shadow-lg"
                            />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        {/* Artist Info */}
                        <div className="flex-1" style={{ margin: "60px 0" }}>
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                            Maya Chen
                                        </h1>
                                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-200">
                                            Verified Artist
                                        </span>
                                    </div>
                                    <p className="text-lg text-gray-600 mb-2">
                                        Digital Artist & Designer
                                    </p>
                                    <div className="flex items-center text-gray-600 mb-3">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        <span>Tokyo, Japan</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                            Minimalist Design
                                        </span>
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                            Streetwear Specialist
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                                        <Heart className="w-5 h-5" />
                                        <span>Follow Artist</span>
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Users className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        2,547
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Followers
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Package className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        156
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Products
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <ShoppingBag className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        8.5K
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Sales
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-4 border border-yellow-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        4.9
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        1,234 Reviews
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="bg-gray-50 rounded-2xl p-6 mb-4">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                                    <Award className="w-5 h-5 mr-2 text-yellow-500" />
                                    About the Artist
                                </h3>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    Maya Chen is a celebrated digital artist
                                    based in Tokyo, specializing in minimalist
                                    designs that seamlessly blend traditional
                                    Japanese aesthetics with contemporary
                                    streetwear culture. With over 8 years of
                                    experience, Maya has built a reputation for
                                    creating unique, thought-provoking pieces
                                    that resonate with fashion enthusiasts
                                    worldwide.
                                </p>
                                <div className="bg-white border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-gray-700 italic">
                                        "My designs are inspired by the harmony
                                        between chaos and order in urban life.
                                        Each piece tells a story of finding
                                        peace in the bustling city. I believe
                                        that fashion is more than just
                                        clothing—it's a form of self-expression
                                        and art."
                                    </p>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 font-medium">
                                    Connect:
                                </span>
                                <button className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition-colors">
                                    <Instagram className="w-5 h-5" />
                                    <span className="text-sm font-medium">
                                        @mayachenart
                                    </span>
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                                    <Twitter className="w-5 h-5" />
                                    <span className="text-sm font-medium">
                                        @mayachendesign
                                    </span>
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
                                    <Globe className="w-5 h-5" />
                                    <span className="text-sm font-medium">
                                        Portfolio
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Achievements Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                            Achievements & Recognition
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    Artist of the Month
                                </p>
                                <p className="text-xs text-gray-600">
                                    December 2024
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    Top Seller
                                </p>
                                <p className="text-xs text-gray-600">Q4 2024</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <Star className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    5-Star Rated
                                </p>
                                <p className="text-xs text-gray-600">
                                    1,234 reviews
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    2K+ Followers
                                </p>
                                <p className="text-xs text-gray-600">
                                    Growing community
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                Product Collection
                            </h2>
                            <p className="text-gray-600">
                                Explore Maya's unique designs and creations
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-yellow-400 w-full sm:w-64 transition-colors"
                                />
                            </div>
                            <button className="flex items-center justify-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded-full hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Filter
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Tags */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        <button className="px-5 py-2 bg-yellow-400 text-white rounded-full text-sm font-semibold hover:bg-yellow-500 transition-colors shadow-md">
                            All Products
                        </button>
                        <button className="px-5 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                            T-Shirts
                        </button>
                        <button className="px-5 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                            Hoodies
                        </button>
                        <button className="px-5 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                            Dresses
                        </button>
                        <button className="px-5 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                            Jackets
                        </button>
                        <button className="px-5 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                            Best Sellers
                        </button>
                    </div>

                    {/* Products Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            {
                                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=880&q=80",
                                title: "Cosmic Dreams Tee",
                                price: "$45",
                                rating: "4.8",
                                sales: "342 sold",
                                tag: "Best Seller",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
                                title: "Urban Jungle Hoodie",
                                price: "$78",
                                rating: "4.9",
                                sales: "256 sold",
                                tag: "Trending",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                                title: "Vintage Waves Dress",
                                price: "$92",
                                rating: "4.7",
                                sales: "178 sold",
                                tag: null,
                            },
                            {
                                image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
                                title: "Abstract Lines Jacket",
                                price: "$125",
                                rating: "4.8",
                                sales: "134 sold",
                                tag: "New",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                                title: "Minimalist Basic Tee",
                                price: "$38",
                                rating: "4.9",
                                sales: "421 sold",
                                tag: "Best Seller",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1581791538302-1dcfc2d1e2ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                                title: "Neon Dreams Hoodie",
                                price: "$82",
                                rating: "4.6",
                                sales: "98 sold",
                                tag: null,
                            },
                            {
                                image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-4.0.3&auto=format&fit=crop&w=627&q=80",
                                title: "Zen Garden Sweatshirt",
                                price: "$65",
                                rating: "4.8",
                                sales: "203 sold",
                                tag: "Trending",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                                title: "Tokyo Nights Tee",
                                price: "$42",
                                rating: "4.7",
                                sales: "312 sold",
                                tag: null,
                            },
                            {
                                image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=683&q=80",
                                title: "Harmony Flow Dress",
                                price: "$88",
                                rating: "4.9",
                                sales: "167 sold",
                                tag: "New",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1169&q=80",
                                title: "Street Art Bomber",
                                price: "$135",
                                rating: "4.8",
                                sales: "89 sold",
                                tag: null,
                            },
                            {
                                image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80",
                                title: "Sakura Blossom Tee",
                                price: "$48",
                                rating: "4.9",
                                sales: "278 sold",
                                tag: "Best Seller",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3&auto=format&fit=crop&w=715&q=80",
                                title: "Minimalist Hoodie",
                                price: "$72",
                                rating: "4.7",
                                sales: "145 sold",
                                tag: "Trending",
                            },
                        ].map((product, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group border border-gray-100"
                            >
                                <div className="aspect-square overflow-hidden relative">
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {product.tag && (
                                        <div className="absolute top-3 left-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                                                    product.tag ===
                                                    "Best Seller"
                                                        ? "bg-yellow-400 text-white"
                                                        : product.tag ===
                                                          "Trending"
                                                        ? "bg-green-500 text-white"
                                                        : "bg-blue-500 text-white"
                                                }`}
                                            >
                                                {product.tag}
                                            </span>
                                        </div>
                                    )}
                                    <button className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-50">
                                        <Heart className="w-5 h-5 text-gray-700 hover:text-red-500" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-gray-900 mb-1 truncate">
                                        {product.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-3">
                                        {product.sales}
                                    </p>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {product.price}
                                        </span>
                                        <div className="flex items-center space-x-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="text-sm font-semibold text-gray-600">
                                                {product.rating}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-full font-semibold transition-colors shadow-md hover:shadow-lg">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More */}
                    <div className="text-center">
                        <button className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                            Load More Products
                        </button>
                    </div>
                </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="bg-white border-t border-gray-200 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                Customer Reviews
                            </h2>
                            <p className="text-gray-600">
                                What customers are saying about Maya's work
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200 mt-4 md:mt-0">
                            <div className="flex items-center space-x-3 mb-2">
                                <Star className="w-8 h-8 text-yellow-400 fill-current" />
                                <span className="text-4xl font-bold text-gray-900">
                                    4.9
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                Based on 1,234 reviews
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {[
                            {
                                name: "Sarah Johnson",
                                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                                rating: 5,
                                date: "2 days ago",
                                product: "Cosmic Dreams Tee",
                                review: "Absolutely love this design! The quality is exceptional and the print is stunning. Maya's attention to detail really shows in her work.",
                            },
                            {
                                name: "Michael Chen",
                                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
                                rating: 5,
                                date: "5 days ago",
                                product: "Urban Jungle Hoodie",
                                review: "Best hoodie I've ever bought! The design is unique and the material is so comfortable. Will definitely be ordering more from this artist.",
                            },
                            {
                                name: "Emma Williams",
                                avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=688&q=80",
                                rating: 5,
                                date: "1 week ago",
                                product: "Vintage Waves Dress",
                                review: "The dress exceeded my expectations! It's beautifully designed and fits perfectly. Maya is an incredibly talented artist.",
                            },
                        ].map((review, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center space-x-3 mb-4">
                                    <img
                                        src={review.avatar}
                                        alt={review.name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {review.name}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {review.date}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 mb-3">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="w-4 h-4 text-yellow-400 fill-current"
                                        />
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-gray-500 mb-2">
                                    Purchased: {review.product}
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    {review.review}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <button className="px-6 py-3 text-yellow-600 font-semibold hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors">
                            View All Reviews →
                        </button>
                    </div>
                </div>
            </div>

            {/* Similar Artists Section */}
            <div className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                        Similar Artists You Might Like
                    </h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            {
                                name: "Sofia Rossi",
                                location: "Milan, Italy",
                                specialty: "Minimalist Designs",
                                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                                rating: 4.8,
                                followers: "1.2K",
                            },
                            {
                                name: "Marcus Johnson",
                                location: "Brooklyn, NY",
                                specialty: "Street Art",
                                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
                                rating: 4.9,
                                followers: "2.8K",
                            },
                            {
                                name: "Yuki Tanaka",
                                location: "Kyoto, Japan",
                                specialty: "Traditional Art",
                                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
                                rating: 4.7,
                                followers: "1.8K",
                            },
                            {
                                name: "Emma Thompson",
                                location: "London, UK",
                                specialty: "Digital Art",
                                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=688&q=80",
                                rating: 4.8,
                                followers: "3.1K",
                            },
                        ].map((artist, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all cursor-pointer group"
                            >
                                <img
                                    src={artist.image}
                                    alt={artist.name}
                                    className="w-24 h-24 rounded-full mx-auto object-cover mb-4 border-4 border-gray-100 group-hover:border-yellow-400 transition-all"
                                />
                                <h3 className="font-bold text-gray-900 text-center mb-1">
                                    {artist.name}
                                </h3>
                                <p className="text-sm text-gray-600 text-center mb-2">
                                    {artist.location}
                                </p>
                                <p className="text-xs text-yellow-600 font-semibold text-center mb-4 bg-yellow-50 py-1 px-3 rounded-full inline-block w-full">
                                    {artist.specialty}
                                </p>
                                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center space-x-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span className="font-semibold">
                                            {artist.rating}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Users className="w-4 h-4" />
                                        <span className="font-semibold">
                                            {artist.followers}
                                        </span>
                                    </div>
                                </div>
                                <button className="w-full py-2 border-2 border-yellow-400 text-yellow-600 rounded-full font-semibold hover:bg-yellow-50 transition-colors">
                                    View Profile
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
