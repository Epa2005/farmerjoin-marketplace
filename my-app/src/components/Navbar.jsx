import { Link } from "react-router-dom";
import { useState } from "react";

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-primary-600 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="text-white text-xl font-heading font-bold tracking-tight">FarmerJoin</span>
                        </Link>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link 
                            to="/about" 
                            className="text-white hover:bg-primary-700 px-3 py-2 rounded-md font-medium transition-colors font-ui tracking-wide"
                        >
                            About
                        </Link>
                        <Link 
                            to="/products" 
                            className="text-white hover:bg-primary-700 px-3 py-2 rounded-md font-medium transition-colors font-ui tracking-wide"
                        >
                            Products
                        </Link>
                        <Link 
                            to="/login" 
                            className="text-white hover:bg-primary-700 px-3 py-2 rounded-md font-medium transition-colors font-ui tracking-wide"
                        >
                            Login
                        </Link>
                        <Link 
                            to="/dashboard" 
                            className="bg-white text-primary-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-colors font-ui tracking-wide"
                        >
                            Dashboard
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-white hover:bg-primary-700 p-2 rounded-md"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-primary-600">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link 
                            to="/about" 
                            className="text-white hover:bg-primary-700 block px-3 py-2 rounded-md font-medium"
                        >
                            About
                        </Link>
                        <Link 
                            to="/login" 
                            className="text-white hover:bg-primary-700 block px-3 py-2 rounded-md font-medium"
                        >
                            Login
                        </Link>
                        <Link 
                            to="/products" 
                            className="text-white hover:bg-primary-700 block px-3 py-2 rounded-md font-medium"
                        >
                            Products
                        </Link>
                        <Link 
                            to="/dashboard" 
                            className="text-white hover:bg-primary-700 block px-3 py-2 rounded-md font-medium"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
