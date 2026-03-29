import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-8xl font-black text-yellow-400 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Page not found
                </h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-yellow-400 text-gray-700 px-6 py-3 rounded-full font-semibold transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        Browse Products
                    </Link>
                </div>
            </div>
        </div>
    );
}
