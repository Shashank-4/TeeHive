import { Star, Crown, Sparkles, ArrowRight } from "lucide-react";
function HomePage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                                    <Sparkles className="w-4 h-4" />
                                    <span>New Artist Collection</span>
                                </div>
                                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                    Where Art Meets
                                    <span className="text-yellow-500">
                                        {" "}
                                        Fashion
                                    </span>
                                </h1>
                                <p className="text-xl text-gray-600 leading-relaxed">
                                    Discover unique clothing pieces created by
                                    independent artists from around the world.
                                    Every purchase supports creative
                                    communities.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors flex items-center justify-center space-x-2">
                                    <span>Shop Collection</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors">
                                    Become an Artist
                                </button>
                            </div>
                            <div className="flex items-center space-x-8 pt-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">
                                        500+
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Artists
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">
                                        10K+
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Products
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">
                                        50K+
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Happy Customers
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-3xl overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                                    alt="Fashion Collection"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Crown className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            Premium Quality
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Curated by experts
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Artist of the Month */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Star className="w-4 h-4" />
                            <span>Artist of the Month</span>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Meet Maya Chen
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            A digital artist from Tokyo creating stunning
                            minimalist designs that blend traditional Japanese
                            aesthetics with modern streetwear.
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-white rounded-3xl overflow-hidden">
                        <div className="grid lg:grid-cols-2 gap-12 items-center p-8 lg:p-12">
                            <div className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                                        alt="Maya Chen"
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            Maya Chen
                                        </h3>
                                        <p className="text-gray-600">
                                            Tokyo, Japan
                                        </p>
                                    </div>
                                </div>
                                <p className="text-lg text-gray-700 leading-relaxed">
                                    "My designs are inspired by the harmony
                                    between chaos and order in urban life. Each
                                    piece tells a story of finding peace in the
                                    bustling city."
                                </p>
                                <div className="flex items-center space-x-6">
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-gray-900">
                                            150+
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Designs
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-gray-900">
                                            4.9
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Rating
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-gray-900">
                                            2.5K
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Followers
                                        </div>
                                    </div>
                                </div>
                                <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                                    View Collection
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <img
                                    src="https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                                    alt="Design 1"
                                    className="aspect-square object-cover rounded-2xl"
                                />
                                <img
                                    src="https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=627&q=80"
                                    alt="Design 2"
                                    className="aspect-square object-cover rounded-2xl"
                                />
                                <img
                                    src="https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=627&q=80"
                                    alt="Design 3"
                                    className="aspect-square object-cover rounded-2xl"
                                />
                                <img
                                    src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                                    alt="Design 4"
                                    className="aspect-square object-cover rounded-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Trending Now
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Discover the most popular pieces from our talented
                            artist community
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80",
                                title: "Cosmic Dreams Tee",
                                artist: "Alex Rivera",
                                price: "$45",
                                rating: "4.8",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?ixlib=rb-4.0.3&ixid=M3wxMJA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
                                title: "Urban Jungle Hoodie",
                                artist: "Sam Kim",
                                price: "$78",
                                rating: "4.9",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
                                title: "Vintage Waves Dress",
                                artist: "Luna Martinez",
                                price: "$92",
                                rating: "4.7",
                            },
                            {
                                image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
                                title: "Abstract Lines Jacket",
                                artist: "Taylor Brooks",
                                price: "$125",
                                rating: "4.8",
                            },
                        ].map((product, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="aspect-square overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-gray-900 mb-1">
                                        {product.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-3">
                                        by {product.artist}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {product.price}
                                        </span>
                                        <div className="flex items-center space-x-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="text-sm text-gray-600">
                                                {product.rating}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-white py-3 rounded-full font-semibold mt-4 transition-colors">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Artists Community */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Our Artist Community
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Meet the creative minds behind your favorite designs
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
                        {[
                            {
                                name: "Sofia Rossi",
                                location: "Milan, Italy",
                                specialty: "Minimalist Designs",
                                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
                            },
                            {
                                name: "Marcus Johnson",
                                location: "Brooklyn, NY",
                                specialty: "Street Art",
                                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
                            },
                            {
                                name: "Yuki Tanaka",
                                location: "Kyoto, Japan",
                                specialty: "Traditional Art",
                                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
                            },
                            {
                                name: "Emma Thompson",
                                location: "London, UK",
                                specialty: "Digital Art",
                                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80",
                            },
                            {
                                name: "Diego Santos",
                                location: "São Paulo, Brazil",
                                specialty: "Abstract Art",
                                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
                            },
                        ].map((artist, index) => (
                            <div
                                key={index}
                                className="text-center group cursor-pointer"
                            >
                                <div className="relative mb-4">
                                    <img
                                        src={artist.image}
                                        alt={artist.name}
                                        className="w-24 h-24 rounded-full mx-auto object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">
                                    {artist.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                    {artist.location}
                                </p>
                                <p className="text-xs text-yellow-600 font-medium">
                                    {artist.specialty}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-8 py-3 rounded-full font-semibold transition-colors">
                            View All Artists
                        </button>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Shop by Category
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Find the perfect style that matches your personality
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "T-Shirts & Tops",
                                count: "2,500+ designs",
                                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80",
                            },
                            {
                                title: "Hoodies & Sweatshirts",
                                count: "1,800+ designs",
                                image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
                            },
                            {
                                title: "Dresses & Skirts",
                                count: "1,200+ designs",
                                image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=683&q=80",
                            },
                        ].map((category, index) => (
                            <div
                                key={index}
                                className="relative group cursor-pointer overflow-hidden rounded-3xl"
                            >
                                <div className="aspect-[4/3] overflow-hidden">
                                    <img
                                        src={category.image}
                                        alt={category.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300"></div>
                                <div className="absolute inset-0 flex flex-col justify-end p-8">
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {category.title}
                                    </h3>
                                    <p className="text-yellow-300 font-medium">
                                        {category.count}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="py-20 bg-gradient-to-r from-yellow-400 to-yellow-500">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Stay in the Loop
                    </h2>
                    <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto">
                        Be the first to discover new artists, limited
                        collections, and exclusive designs
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-6 py-4 rounded-full outline-none text-gray-900"
                        />
                        <button className="bg-white text-yellow-500 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors">
                            Subscribe
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomePage;
