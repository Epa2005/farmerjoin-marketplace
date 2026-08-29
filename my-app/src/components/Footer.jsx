import React from "react";
import { Link } from "react-router-dom";
import { useNewTranslation } from "../hooks/useNewTranslation";

const Footer = () => {
    const { t } = useNewTranslation();
    
    return (
        <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
            {/* Modern Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-600/10 rounded-full filter blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Company Info */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-2xl">grass</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white">FarmerJoin</h3>
                        </div>
                        <p className="text-gray-300 mb-6 leading-relaxed text-lg">
                            {t('footerDescription')}
                        </p>
                        <div className="flex space-x-4">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                                <span className="text-sm">f</span>
                            </div>
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                                <span className="text-sm">t</span>
                            </div>
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                                <span className="text-sm">in</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-xl font-bold text-white mb-6">{t('quickLinks')}</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/" className="text-gray-300 hover:text-primary-400 transition-all duration-300 hover:translate-x-1 block">
                                    {t('products')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-gray-300 hover:text-primary-400 transition-all duration-300 hover:translate-x-1 block">
                                    {t('login')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard" className="text-gray-300 hover:text-primary-400 transition-all duration-300 hover:translate-x-1 block">
                                    {t('dashboard')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-300 hover:text-primary-400 transition-all duration-300 hover:translate-x-1 block">
                                    {t('about')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-xl font-bold text-white mb-6">{t('contactUs')}</h4>
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex items-center space-x-3 hover:text-primary-400 transition-colors cursor-pointer">
                                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span className="text-sm">@</span>
                                </div>
                                <span>{t('supportEmail')}</span>
                            </li>
                            <li className="flex items-center space-x-3 hover:text-primary-400 transition-colors cursor-pointer">
                                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span className="text-sm">phone</span>
                                </div>
                                <span>{t('phone')}</span>
                            </li>
                            <li className="flex items-center space-x-3 hover:text-primary-400 transition-colors cursor-pointer">
                                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <span className="text-sm">loc</span>
                                </div>
                                <span>{t('location')}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-12 pt-8 text-center">
                    <p className="text-gray-400">{t('copyright')}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
