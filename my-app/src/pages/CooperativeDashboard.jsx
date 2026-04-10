import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useNewTranslation } from '../hooks/useNewTranslation';

const CooperativeDashboard = () => {
  const { t } = useNewTranslation();
  const navigate = useNavigate();
  const [cooperativeData, setCooperativeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCooperativeData();
  }, []);

  const fetchCooperativeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || user?.role !== 'cooperative') {
        navigate('/login');
        return;
      }

      // Fetch cooperative profile
      const res = await API.get('/cooperative/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCooperativeData(res.data);

    } catch (error) {
      console.error('Error fetching cooperative data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">{t('cooperativeDashboard') || 'Cooperative Dashboard'}</h1>
              {cooperativeData && (
                <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, {cooperativeData.cooperative_name}</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {t('logout') || 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('welcomeToCooperativeDashboard') || 'Welcome to Your Cooperative Dashboard'}</h2>
          <p className="text-gray-600 mb-6">
            {t('manageCooperativeProfile') || 'Manage your cooperative profile, members, and agricultural activities from here.'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">{t('totalMembers') || 'Total Members'}</h3>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">{t('activeProjects') || 'Active Projects'}</h3>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">{t('productsListed') || 'Products Listed'}</h3>
              <p className="text-2xl font-bold text-yellow-600">0</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">{t('revenue') || 'Revenue'}</h3>
              <p className="text-2xl font-bold text-purple-600">$0</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">{t('quickActions') || 'Quick Actions'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/edit-profile"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('editProfile') || 'Edit Profile'}
            </Link>
            
            
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t('manageMembers') || 'Manage Members'}
            </button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">{t('cooperativeInformation') || 'Cooperative Information'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('cooperativeName') || 'Cooperative Name'}</label>
              <input
                type="text"
                defaultValue={cooperativeData?.cooperative_name || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('yourCooperativeName') || "Your cooperative name"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('email') || 'Email'}</label>
              <input
                type="email"
                defaultValue={cooperativeData?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('yourEmail') || "your@email.com"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone') || 'Phone'}</label>
              <input
                type="tel"
                defaultValue={cooperativeData?.phone || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('yourPhone') || "+250788123456"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('location') || 'Location'}</label>
              <input
                type="text"
                defaultValue={cooperativeData?.location || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('districtProvince') || "District, Province"}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('description') || 'Description'}</label>
            <textarea
              rows={4}
              defaultValue={cooperativeData?.description || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={t('tellAboutCooperative') || "Tell customers about your cooperative..."}
            ></textarea>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              {t('saveChanges') || 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CooperativeDashboard;
