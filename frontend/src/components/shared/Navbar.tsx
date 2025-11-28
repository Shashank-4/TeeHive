import { NavLink } from "react-router-dom";
import { Search, Heart, ShoppingBag, Crown } from "lucide-react";
export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                                <Crown className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                TeeHive
                            </span>
                        </div>
                        <div className="md:flex space-x-8">
                            <NavLink
                                to="/products"
                                className="text-gray-700 hover:text-yellow-500 transition-colors font-medium"
                            >
                                Collections
                            </NavLink>
                            <NavLink
                                to="/artists"
                                className="text-gray-700 hover:text-yellow-500 transition-colors font-medium"
                            >
                                Artists
                            </NavLink>
                            <NavLink to="/new-drops" className="">
                                New Drops
                            </NavLink>
                            <NavLink
                                to="/about"
                                className="text-gray-700 hover:text-yellow-500 transition-colors font-medium"
                            >
                                About
                            </NavLink>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center bg-gray-50 rounded-full px-4 py-2 w-64">
                            <Search className="w-4 h-4 text-gray-400 mr-3" />
                            <input
                                type="text"
                                placeholder="Search artists, products..."
                                className="bg-transparent outline-none text-sm flex-1"
                            />
                        </div>
                        <button className="p-2 text-gray-700 hover:text-yellow-500 transition-colors">
                            <Heart className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-700 hover:text-yellow-500 transition-colors relative">
                            <ShoppingBag className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                3
                            </span>
                        </button>
                        <NavLink
                            to="/login"
                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-full font-medium transition-colors"
                        >
                            Sign In
                        </NavLink>
                        {/* <button
                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-full font-medium transition-colors"
                            onClick={goToSignIn}
                        >
                            Sign In
                        </button> */}
                    </div>
                </div>
            </div>
        </nav>
    );
}
