import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../api";
import { useTranslation } from "../hooks/useTranslation";

function Dashboard() {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        revenue: 0
    });
    const [farmers, setFarmers] = useState([]);
    const [showAddFarmer, setShowAddFarmer] = useState(false);
    const [newFarmer, setNewFarmer] = useState({
        full_name: "",
        email: "",
        phone: "",
        cooperative_name: "",
        location: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setUser({ name: "Admin" });
            fetchFarmers();
        }
    }, []);

    const fetchFarmers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await API.get("/admin/farmers", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFarmers(response.data || []);
        } catch (error) {
            console.error("Error fetching farmers:", error);
            setFarmers([]);
        }
    };

    const handleAddFarmer = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const token = localStorage.getItem("token");
            const response = await API.post("/admin/create-farmer", newFarmer, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage(t('farmerAccountCreated') || `Farmer account created! Email: ${newFarmer.email}, Password: ${response.data.password}`);
            setNewFarmer({
                full_name: "",
                email: "",
                phone: "",
                cooperative_name: "",
                location: ""
            });
            setShowAddFarmer(false);
            fetchFarmers();
        } catch (error) {
            setMessage(t('errorCreatingFarmer') || "Error creating farmer account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {t('adminDashboard') || 'Admin Dashboard'}
                    </h1>
                    <p className="mt-2 text-gray-600">
                        {t('manageProductsOrdersFarmers') || 'Manage products, orders, and farmer accounts'}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Products Stats */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8-8 4m16 0l-8 4-8-8 4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">{t('totalProducts') || 'Total Products'}</p>
                                <p className="text-2xl font-semibold text-gray-800">{stats.products}</p>
                            </div>
                        </div>
                    </div>

                    {/* Manage Farmers Section */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">{t('manageFarmers') || 'Manage Farmers'}</h2>
                            <button
                                onClick={() => setShowAddFarmer(!showAddFarmer)}
                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                {showAddFarmer ? (t('cancel') || 'Cancel') : (t('addFarmer') || 'Add Farmer')}
                            </button>
                        </div>

                        {/* Add Farmer Form */}
                        {showAddFarmer && (
                            <form onSubmit={handleAddFarmer} className="space-y-4">
                                {message && (
                                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
                                        {message}
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName') || 'Full Name'}</label>
                                        <input
                                            type="text"
                                            value={newFarmer.full_name}
                                            onChange={(e) => setNewFarmer({...newFarmer, full_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('email') || 'Email'}</label>
                                        <input
                                            type="email"
                                            value={newFarmer.email}
                                            onChange={(e) => setNewFarmer({...newFarmer, email: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone') || 'Phone'}</label>
                                        <input
                                            type="tel"
                                            value={newFarmer.phone}
                                            onChange={(e) => setNewFarmer({...newFarmer, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('cooperativeName') || 'Cooperative Name'}</label>
                                        <input
                                            type="text"
                                            value={newFarmer.cooperative_name}
                                            onChange={(e) => setNewFarmer({...newFarmer, cooperative_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('location') || 'Location'}</label>
                                    <input
                                        type="text"
                                        value={newFarmer.location}
                                        onChange={(e) => setNewFarmer({...newFarmer, location: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? (t('creating') || 'Creating...') : (t('createAccount') || 'Create Account')}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Farmers List */}
                        {!showAddFarmer && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Registered Farmers</h3>
                                <div className="space-y-2">
                                    {farmers.map((farmer, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-800">{farmer.full_name}</p>
                                                    <p className="text-sm text-gray-600">{farmer.email}</p>
                                                    <p className="text-sm text-gray-600">{farmer.cooperative_name}</p>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    <p>{farmer.location}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Orders Stats */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                                <svg className="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                                <p className="text-2xl font-semibold text-gray-800">{stats.orders}</p>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Stats */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-semibold text-gray-800">${stats.revenue}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <Link
                            to="/products"
                            className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="h-8 w-8 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">View Products</span>
                        </Link>

                        <Link
                            to="/"
                            className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="h-8 w-8 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Home</span>
                        </Link>

                        <button
                            onClick={() => {
                                localStorage.removeItem("token");
                                window.location.href = "/login";
                            }}
                            className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <svg className="h-8 w-8 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium text-red-700">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
                    <div className="text-center py-8">
                        <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-500">No recent activity</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
