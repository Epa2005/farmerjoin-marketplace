import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
    
    return (
        <footer className="bg-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-heading font-bold text-primary-500 mb-4 tracking-tight">FarmerJoin</h3>
                        <p className="text-gray-300 mb-4 font-secondary leading-relaxed">
                            Connecting farmers directly with buyers. Fresh produce at fair prices.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-heading font-semibold mb-4 tracking-tight">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-300 hover:text-primary-500 transition-colors">
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-gray-300 hover:text-primary-500 transition-colors">
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard" className="text-gray-300 hover:text-primary-500 transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-lg font-heading font-semibold mb-4 tracking-tight">Contact Us</h4>
                        <ul className="space-y-2 text-gray-300">
                            <li className="flex items-center space-x-2">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>support@farmerjoin.com</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>+1 (555) 123-4567</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2024 FarmerJoin. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
