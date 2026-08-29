import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useTranslation } from "../hooks/useTranslation";

function Orders() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [deletingOrderId, setDeletingOrderId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await API.get("/orders/my-orders", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const baseOrders = Array.isArray(res.data) ? res.data : [];
            setOrders(baseOrders);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        const confirmed = window.confirm("Delete this order? This action cannot be undone.");
        if (!confirmed) return;

        try {
            setDeletingOrderId(orderId);
            await API.delete(`/orders/${orderId}`);
            setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
        } catch (err) {
            console.error("Error deleting order:", err);
            alert(err?.response?.data?.message || "Failed to delete order");
        } finally {
            setDeletingOrderId(null);
        }
    };

    const filteredOrders = filter === "all"
        ? orders
        : orders.filter(order => order.status === filter);

    const translateOrderStatus = (status) => t(`status_${status}`) || status;

    const getStatusColor = (status) => {
        const colorMap = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            processing: 'bg-purple-100 text-purple-800',
            shipped: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            pending_payment: 'bg-orange-100 text-orange-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('myOrders')}</h1>
                        <p className="text-gray-600">Manage, track, and clean up your orders</p>
                    </div>
                    <Link
                        to="/products"
                        className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        {t('continueShopping')}
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => setFilter("all")} className={`px-6 py-3 rounded-xl text-sm font-semibold ${filter === "all" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                            {t('allOrders')}
                        </button>
                        <button onClick={() => setFilter("pending")} className={`px-6 py-3 rounded-xl text-sm font-semibold ${filter === "pending" ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white" : "bg-gray-100 text-gray-600"}`}>
                            {translateOrderStatus('pending')}
                        </button>
                        <button onClick={() => setFilter("delivered")} className={`px-6 py-3 rounded-xl text-sm font-semibold ${filter === "delivered" ? "bg-gradient-to-r from-green-400 to-emerald-400 text-white" : "bg-gray-100 text-gray-600"}`}>
                            {translateOrderStatus('delivered')}
                        </button>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('noOrdersFound')}</h3>
                        <p className="text-gray-600 mb-8">{t('noOrdersMessage')}</p>
                        <Link to="/products" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold">
                            {t('startShopping')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredOrders.map((order) => (
                            <div key={order.order_id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                                <div className="bg-gradient-to-r from-gray-50 to-emerald-50 px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100">
                                    <div className="mb-3 md:mb-0">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xl font-bold text-gray-900">#{order.order_id}</span>
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {translateOrderStatus(order.status)}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500 mt-1 block">{formatDate(order.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleDeleteOrder(order.order_id)}
                                            disabled={deletingOrderId === order.order_id}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-semibold transition-colors"
                                        >
                                            {deletingOrderId === order.order_id ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                </div>

                                <div className="px-8 py-6">
                                    <div className="space-y-4">
                                        {(order.items || []).map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                                                    <p className="text-sm text-gray-500">{t('quantity')}: {item.quantity} x FRW {parseFloat(item.price || 0).toFixed(0)}</p>
                                                </div>
                                                <span className="font-bold text-lg text-gray-900">FRW {(parseFloat(item.price || 0) * parseFloat(item.quantity || 0)).toFixed(0)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-xl font-bold text-gray-900">{t('total')}</span>
                                        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">FRW {parseFloat(order.total_amount || 0).toFixed(0)}</span>
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
