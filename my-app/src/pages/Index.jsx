import { useState } from "react"
import { useTranslation } from "../hooks/useTranslation"
import { Link } from "react-router-dom"
import ImageSlider from "../components/ImageSlider"

export default function Index(){
    const { t } = useTranslation();
    const [name,setName] = useState("");

    function handleClickName(){
        const inputName = document.getElementById("name").value;
        setName(inputName)
    }

    return(
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Hero Section with Image Slider */}
            <div className="relative">
                <ImageSlider />
                
                {/* Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            FarmerJoin
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
                            Connecting Farmers and Buyers for a Sustainable Agricultural Future
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                to="/login" 
                                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg transform hover:scale-105"
                            >
                                Get Started
                            </Link>
                            <Link 
                                to="/register" 
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold transition-all border border-white/30"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">Why Choose FarmerJoin?</h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Empowering farmers with technology and connecting them directly with buyers
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-12 h-12 bg-emerald-500/30 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Direct Farm Sales</h3>
                        <p className="text-gray-300">Connect directly with farmers and get fresh produce at fair prices</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Quality Assured</h3>
                        <p className="text-gray-300">All products are verified and quality checked for your safety</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                        <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Fast Delivery</h3>
                        <p className="text-gray-300">Quick and reliable delivery from farm to your doorstep</p>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-emerald-400 mb-2">1000+</div>
                        <div className="text-gray-300">Active Farmers</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-blue-400 mb-2">5000+</div>
                        <div className="text-gray-300">Happy Customers</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-purple-400 mb-2">100+</div>
                        <div className="text-gray-300">Products Available</div>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-orange-400 mb-2">24/7</div>
                        <div className="text-gray-300">Support Available</div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-black/30 backdrop-blur-md border-t border-white/10 py-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400"> 2024 FarmerJoin. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}