import { useState, useEffect } from "react";
import API from "../api";
import FarmerNotifications from "./FarmerNotifications";

function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await API.get("/farmer/notifications?unread_only=true");
            setUnreadCount(res.data?.length || 0);
        } catch (err) {
            console.error("Error fetching unread count:", err);
            // Mock for demo
            setUnreadCount(2);
        }
    };

    const toggleNotifications = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Refresh notifications when opening
            fetchUnreadCount();
        }
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={toggleNotifications}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Notifications"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                {/* Unread count badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Notifications Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                        <FarmerNotifications />
                    </div>
                </>
            )}
        </div>
    );
}

export default NotificationBell;
