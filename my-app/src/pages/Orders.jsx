import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useNewTranslation } from "../hooks/useNewTranslation";
import { useDatabaseTranslation } from "../hooks/useDatabaseTranslation";

function Orders() {
    const { t } = useNewTranslation();
    const { useTranslatedOrders } = useDatabaseTranslation();
    const [orders, setOrders] = useState([]);
    const translatedOrders = useTranslatedOrders(orders);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await API.get("/orders/buyer");
            setOrders(res.data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
            // Mock data for demo
            setOrders([
                { order_id: 1, status: 'delivered', total_amount: 50, created_at: '2024-01-15', items: [{ product_name: 'Maize', quantity: 5, price: 10 }] },
                { order_id: 2, status: 'pending', total_amount: 75, created_at: '2024-01-18', items: [{ product_name: 'Coffee', quantity: 3, price: 25 }] },
                { order_id: 3, status: 'pending', total_amount: 125, created_at: '2024-01-20', items: [{ product_name: 'Beans', quantity: 10, price: 12.5 }] },
                { order_id: 4, status: 'delivered', total_amount: 200, created_at: '2024-01-10', items: [{ product_name: 'Rice', quantity: 20, price: 10 }] },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = filter === "all" 
        ? orders 
        : orders.filter(order => order.status === filter);

    // Helper functions
    const translateOrderStatus = (status) => {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed', 
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
            'pending_payment': 'Pending Payment'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'processing': 'bg-purple-100 text-purple-800',
            'shipped': 'bg-indigo-100 text-indigo-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
            'pending_payment': 'bg-orange-100 text-orange-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString, format = 'long') => {
        const date = new Date(dateString);
        if (format === 'short') {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('loadingOrders')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{t('myOrders')}</h1>
                        <p className="mt-2 text-gray-600">{t('trackOrders')}</p>
                    </div>
                    <Link
                        to="/products"
                        className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {t('continueShopping')}
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === "all" 
                                    ? "bg-primary-600 text-white" 
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {t('allOrders')}
                        </button>
                        <button
                            onClick={() => setFilter("pending")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === "pending" 
                                    ? "bg-yellow-500 text-white" 
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {translateOrderStatus('pending')}
                        </button>
                        <button
                            onClick={() => setFilter("delivered")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === "delivered" 
                                    ? "bg-green-500 text-white" 
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {translateOrderStatus('delivered')}
                        </button>
                    </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('noOrdersFound')}</h3>
                        <p className="text-gray-600 mb-6">{t('noOrdersMessage')}</p>
                        <Link 
                            to="/products" 
                            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            {t('startShopping')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div key={order.order_id} className="bg-white rounded-xl shadow-md overflow-hidden">
                                {/* Order Header */}
                                <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between">
                                    <div className="mb-2 md:mb-0">
                                        <span className="text-lg font-bold text-gray-800">Order #{order.order_id}</span>
                                        <span className="ml-3 text-sm text-gray-500">
                                            {formatDate(order.created_at, 'short')}
                                        </span>
                                    </div>
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                        {translateOrderStatus(order.status)}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div className="px-6 py-4">
                                    <div className="space-y-3">
                                        {(order.items || []).map((item, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                                                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{item.product_name}</p>
                                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Total */}
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-800">Total</span>
                                        <span className="text-2xl font-bold text-primary-600">${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Orders;
