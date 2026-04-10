import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../api";
import { useAuth } from "../contexts/AuthContext";

function FarmerNotifications() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await API.get("/farmer/notifications");
            setNotifications(res.data || []);
            
            // Count unread notifications
            const unread = (res.data || []).filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            // Mock data for demo
            const mockNotifications = [
                {
                    id: 1,
                    type: 'order_placed',
                    title: 'New Order Received',
                    message: 'John Doe placed an order for Fresh Maize (Quantity: 5, Order #123)',
                    buyer_name: 'John Doe',
                    product_name: 'Fresh Maize',
                    order_id: 123,
                    read: false,
                    time: '2 minutes ago',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    type: 'cart_add',
                    title: 'Product Added to Cart',
                    message: 'Jane Smith added Fresh Tomatoes to their cart (Quantity: 3)',
                    buyer_name: 'Jane Smith',
                    product_name: 'Fresh Tomatoes',
                    read: false,
                    time: '15 minutes ago',
                    created_at: new Date(Date.now() - 15 * 60000).toISOString()
                },
                {
                    id: 3,
                    type: 'order_placed',
                    title: 'New Order Received',
                    message: 'Mike Johnson placed an order for Organic Coffee (Quantity: 2, Order #122)',
                    buyer_name: 'Mike Johnson',
                    product_name: 'Organic Coffee',
                    order_id: 122,
                    read: true,
                    time: '1 hour ago',
                    created_at: new Date(Date.now() - 60 * 60000).toISOString()
                }
            ];
            setNotifications(mockNotifications);
            setUnreadCount(mockNotifications.filter(n => !n.read).length);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await API.put(`/farmer/notifications/${notificationId}/read`);
            // Update local state
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Mark each unread notification as read
            const unreadNotifications = notifications.filter(n => !n.read);
            await Promise.all(unreadNotifications.map(n => 
                API.put(`/farmer/notifications/${n.id}/read`)
            ));
            
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Error marking all notifications as read:", err);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_placed':
                return (
                    <div className="p-2 bg-green-100 rounded-full">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                );
            case 'cart_add':
                return (
                    <div className="p-2 bg-blue-100 rounded-full">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                );
            case 'low_stock':
                return (
                    <div className="p-2 bg-yellow-100 rounded-full">
                        <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'product_out_of_stock':
                return (
                    <div className="p-2 bg-red-100 rounded-full">
                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="p-2 bg-gray-100 rounded-full">
                        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <h4 className="text-lg font-medium text-gray-800 mb-2">No notifications</h4>
                        <p className="text-gray-600">You'll see notifications here when customers interact with your products</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mr-3">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-900">
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {notification.time}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                    </p>
                                    {notification.buyer_name && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Customer: {notification.buyer_name}
                                        </p>
                                    )}
                                    {notification.order_id && (
                                        <div className="mt-2">
                                            <a
                                                href={`/farmer/orders/${notification.order_id}`}
                                                className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                View Order
                                                <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </a>
                                        </div>
                                    )}
                                </div>
                                {!notification.read && (
                                    <div className="flex-shrink-0 ml-2">
                                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default FarmerNotifications;
