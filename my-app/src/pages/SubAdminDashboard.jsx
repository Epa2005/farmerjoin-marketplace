import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function SubAdminDashboard() {
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showCreateFarmerModal, setShowCreateFarmerModal] = useState(false);
  const [showEditFarmerModal, setShowEditFarmerModal] = useState(false);
  const [showViewFarmerModal, setShowViewFarmerModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [managedInfo, setManagedInfo] = useState({ count: 0, management_level: '', assigned_location: {} });
  const [farmerData, setFarmerData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    province: "",
    district: "",
    sector: "",
    cooperative_name: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const farmersPerPage = 10;

  useEffect(() => {
    fetchManagedFarmers();
    fetchStatistics();
  }, []);

  const fetchManagedFarmers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/api/users/managed-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle new response format with metadata
      if (response.data.users) {
        setFarmers(response.data.users);
        setManagedInfo({
          count: response.data.count,
          management_level: response.data.management_level,
          assigned_location: response.data.assigned_location
        });
      } else {
        // Handle old response format (backward compatibility)
        setFarmers(response.data);
      }
    } catch (err) {
      console.error("Error fetching managed farmers:", err);
      setError("Failed to fetch managed farmers");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/api/users/statistics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const handleCreateFarmer = async () => {
    const { full_name, email, phone, password, province, district, sector, cooperative_name } = farmerData;
    
    if (!full_name || !email || !phone || !password || !province || !district || !sector) {
      alert('All required fields must be filled (province, district, sector)');
      return;
    }
    
    // Validate that farmer location matches sub-admin's assigned location
    if (managedInfo.assigned_location) {
      const { province: assignedProvince, district: assignedDistrict, sector: assignedSector } = managedInfo.assigned_location;
      
      if (province !== assignedProvince || district !== assignedDistrict || sector !== assignedSector) {
        alert(`You can only register farmers in your assigned location: ${assignedProvince}, ${assignedDistrict}, ${assignedSector}`);
        return;
      }
    }
    
    try {
      const token = localStorage.getItem("token");
      await API.post('/farmers/admin/create-farmer', farmerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchManagedFarmers();
      fetchStatistics();
      setShowCreateFarmerModal(false);
      setFarmerData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        province: "",
        district: "",
        sector: "",
        cooperative_name: ""
      });
      alert('Farmer created successfully');
    } catch (err) {
      console.error('Error creating farmer:', err);
      alert('Failed to create farmer');
    }
  };

  const handleEditFarmer = async () => {
    try {
      const token = localStorage.getItem("token");
      // Use farmer-specific endpoint with location validation
      await API.put(`/api/farmers/admin/${selectedFarmer.farmer_id}`, farmerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchManagedFarmers();
      setShowEditFarmerModal(false);
      setFarmerData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        location: "",
        cooperative_name: ""
      });
      alert('Farmer updated successfully');
    } catch (err) {
      console.error('Error updating farmer:', err);
      alert('Failed to update farmer');
    }
  };

  const handleDeleteFarmer = async (farmerId) => {
    if (window.confirm('Are you sure you want to delete this farmer? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem("token");
        // Use farmer-specific endpoint with location validation
        await API.delete(`/api/farmers/${farmerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        fetchManagedFarmers();
        fetchStatistics();
        alert('Farmer deleted successfully');
      } catch (err) {
        console.error('Error deleting farmer:', err);
        alert('Failed to delete farmer');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = farmer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        farmer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || farmer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastFarmer = currentPage * farmersPerPage;
  const indexOfFirstFarmer = indexOfLastFarmer - farmersPerPage;
  const currentFarmers = filteredFarmers.slice(indexOfFirstFarmer, indexOfLastFarmer);
  const totalPages = Math.ceil(filteredFarmers.length / farmersPerPage);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'banned': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'farmer': return 'bg-emerald-100 text-emerald-800';
      case 'cooperative': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Modern Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full filter blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Modern Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-black/20 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">admin_panel_settings</span>
              </div>
              {sidebarOpen && <span className="text-white font-bold text-lg">Dashboard</span>}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <span className="text-xl">menu</span>
            </button>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: 'dashboard' },
              { id: 'farmers', label: 'Farmers', icon: 'people' },
              { id: 'analytics', label: 'Analytics', icon: 'analytics' },
              { id: 'settings', label: 'Settings', icon: 'settings' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 min-h-screen ${sidebarOpen ? 'ml-64' : 'ml-20'} overflow-y-auto`}>
        {/* Modern Header */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{t('subAdminDashboard.title', 'Sub Admin Dashboard')}</h1>
                <p className="text-white/70">{t('subAdminDashboard.subtitle', 'Manage farmers in your assigned location')}</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Language Selector */}
                <select
                  value={currentLanguage}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="rw">Kinyarwanda</option>
                </select>
                
                <button
                  onClick={() => {
                  // Pre-fill location fields with sub-admin's assigned location
                  if (managedInfo.assigned_location) {
                    setFarmerData({
                      ...farmerData,
                      province: managedInfo.assigned_location.province || '',
                      district: managedInfo.assigned_location.district || '',
                      sector: managedInfo.assigned_location.sector || ''
                    });
                  }
                  setShowCreateFarmerModal(true);
                }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span className="text-lg"></span>
                  <span>{t('createFarmer', 'Create Farmer')}</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span className="text-lg">logout</span>
                  <span>{t('logout', 'Logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">groups</span>
                    </div>
                    <span className="text-white/70 text-sm font-medium">{t('subAdminDashboard.managed', 'Managed')}</span>
                  </div>
                  <h3 className="text-white/80 text-sm mb-2">{t('subAdminDashboard.managedFarmers', 'Farmers I Manage')}</h3>
                  <p className="text-3xl font-bold text-white">{managedInfo.count || 0}</p>
                  <p className="text-white/60 text-xs mt-2">{t('subAdminDashboard.at', 'At')} {managedInfo.management_level || 'sector'} {t('subAdminDashboard.level', 'level')}</p>
                  <div className="mt-4 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-30"></div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">check_circle</span>
                    </div>
                    <span className="text-white/70 text-sm font-medium">{t('subAdminDashboard.active', 'Active')}</span>
                  </div>
                  <h3 className="text-white/80 text-sm mb-2">{t('subAdminDashboard.activeFarmers', 'Active Farmers')}</h3>
                  <p className="text-3xl font-bold text-white">{statistics.activeFarmers || statistics.activeUsers || 0}</p>
                  <div className="mt-4 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-30"></div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">location_on</span>
                    </div>
                    <span className="text-white/70 text-sm font-medium">{t('subAdminDashboard.location', 'Location')}</span>
                  </div>
                  <h3 className="text-white/80 text-sm mb-2">{t('subAdminDashboard.myLocation', 'My Location')}</h3>
                  <p className="text-xl font-bold text-white">{statistics.myLocation || t('subAdminDashboard.notAssigned', 'Not assigned')}</p>
                  <div className="mt-4 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-30"></div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-xl font-bold text-white mb-4">{t('subAdminDashboard.recentActivity', 'Recent Activity')}</h2>
                <div className="space-y-3">
                  {farmers.slice(0, 5).map((farmer) => (
                    <div key={farmer.user_id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">person</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{farmer.full_name}</p>
                          <p className="text-white/60 text-sm">{farmer.email}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(farmer.status)}`}>
                        {farmer.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Farmers Section */}
          {activeSection === 'farmers' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder={t('subAdminDashboard.searchPlaceholder', 'Search farmers...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">{t('subAdminDashboard.allStatus', 'All Status')}</option>
                    <option value="active">{t('subAdminDashboard.active', 'Active')}</option>
                    <option value="banned">{t('subAdminDashboard.banned', 'Banned')}</option>
                    <option value="suspended">{t('subAdminDashboard.suspended', 'Suspended')}</option>
                  </select>
                </div>
              </div>

              {/* Farmers Table */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          {t('subAdminDashboard.farmerInfo', 'Farmer Information')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          {t('subAdminDashboard.role', 'Role')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          {t('subAdminDashboard.status', 'Status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          {t('subAdminDashboard.location', 'Location')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          {t('subAdminDashboard.actions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {currentFarmers.map((farmer) => (
                        <tr key={farmer.user_id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">{farmer.full_name}</div>
                              <div className="text-sm text-white/60">{farmer.email}</div>
                              <div className="text-sm text-white/60">{farmer.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(farmer.role)}`}>
                              {farmer.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(farmer.status)}`}>
                              {farmer.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                            {farmer.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewFarmer(farmer)}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                {t('subAdminDashboard.view', 'View')}
                              </button>
                              <button
                                onClick={() => handleEditFarmer(farmer)}
                                className="text-green-400 hover:text-green-300 transition-colors"
                              >
                                {t('subAdminDashboard.edit', 'Edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteFarmer(farmer.user_id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                {t('subAdminDashboard.delete', 'Delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-xl font-bold text-white mb-4">{t('subAdminDashboard.analytics', 'Analytics')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-2">{t('subAdminDashboard.farmerGrowth', 'Farmer Growth')}</h3>
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-20"></div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-2">{t('subAdminDashboard.statusDistribution', 'Status Distribution')}</h3>
                    <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg opacity-20"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-xl font-bold text-white mb-4">{t('subAdminDashboard.settings', 'Settings')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">{t('notifications', 'Notifications')}</p>
                      <p className="text-white/60 text-sm">{t('notificationsDesc', 'Manage your notification preferences')}</p>
                    </div>
                    <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl transition-colors">
                      {t('configure', 'Configure')}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">{t('language', 'Language')}</p>
                      <p className="text-white/60 text-sm">{t('languageDesc', 'Change your preferred language')}</p>
                    </div>
                    <select
                      value={currentLanguage}
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="rw">Kinyarwanda</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Farmer Modal */}
      {showCreateFarmerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">{t('createFarmer', 'Create New Farmer')}</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('fullName', 'Full Name')}
                value={farmerData.full_name}
                onChange={(e) => setFarmerData({...farmerData, full_name: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="email"
                placeholder={t('email', 'Email')}
                value={farmerData.email}
                onChange={(e) => setFarmerData({...farmerData, email: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="tel"
                placeholder={t('subAdminDashboard.phone', 'Phone')}
                value={farmerData.phone}
                onChange={(e) => setFarmerData({...farmerData, phone: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="password"
                placeholder={t('password', 'Password')}
                value={farmerData.password}
                onChange={(e) => setFarmerData({...farmerData, password: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder={t('province', 'Province')}
                value={farmerData.province}
                onChange={(e) => setFarmerData({...farmerData, province: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder={t('district', 'District')}
                value={farmerData.district}
                onChange={(e) => setFarmerData({...farmerData, district: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder={t('sector', 'Sector')}
                value={farmerData.sector}
                onChange={(e) => setFarmerData({...farmerData, sector: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder={t('cooperativeName', 'Cooperative Name (Optional)')}
                value={farmerData.cooperative_name}
                onChange={(e) => setFarmerData({...farmerData, cooperative_name: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateFarmer}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-300"
              >
                {t('createFarmer', 'Create Farmer')}
              </button>
              <button
                onClick={() => {
                  setShowCreateFarmerModal(false);
                  setFarmerData({
                    full_name: "",
                    email: "",
                    phone: "",
                    password: "",
                    province: "",
                    district: "",
                    sector: "",
                    cooperative_name: ""
                  });
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-300"
              >
                {t('cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Farmer Modal */}
      {showViewFarmerModal && selectedFarmer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">{t('farmerDetails', 'Farmer Details')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">{t('name', 'Name')}:</span>
                <span className="text-white font-medium">{selectedFarmer.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">{t('email', 'Email')}:</span>
                <span className="text-white font-medium">{selectedFarmer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">{t('phone', 'Phone')}:</span>
                <span className="text-white font-medium">{selectedFarmer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">{t('role', 'Role')}:</span>
                <span className="text-white font-medium">{selectedFarmer.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">{t('status', 'Status')}:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedFarmer.status)}`}>
                  {selectedFarmer.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">{t('location', 'Location')}:</span>
                <span className="text-white font-medium">{selectedFarmer.location}</span>
              </div>
            </div>
            <button
              onClick={() => setShowViewFarmerModal(false)}
              className="w-full mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-300"
            >
              {t('close', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubAdminDashboard;
