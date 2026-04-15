import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function UserManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [showCreateSubAdminModal, setShowCreateSubAdminModal] = useState(false);
  const [subAdminData, setSubAdminData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    province: "",
    district: "",
    sector: "",
    management_level: "sector"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
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

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      alert('Please provide a reason for banning this user');
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      await API.put(`/api/users/${selectedUser.user_id}/ban`, 
        { reason: banReason },
        { headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchUsers();
      fetchStatistics();
      setShowBanModal(false);
      setBanReason("");
      setSelectedUser(null);
      alert('User banned successfully');
    } catch (err) {
      console.error('Error banning user:', err);
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    if (window.confirm('Are you sure you want to unban this user?')) {
      try {
        const token = localStorage.getItem("token");
        await API.put(`/api/users/${userId}/unban`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        fetchUsers();
        fetchStatistics();
        alert('User unbanned successfully');
      } catch (err) {
        console.error('Error unbanning user:', err);
        alert('Failed to unban user');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem("token");
        await API.delete(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        fetchUsers();
        fetchStatistics();
        alert('User deleted successfully');
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user');
      }
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendReason.trim()) {
      alert('Please provide a reason for suspending this user');
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      await API.put(`/api/users/${selectedUser.user_id}/suspend`, 
        { reason: suspendReason },
        { headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchUsers();
      fetchStatistics();
      setShowSuspendModal(false);
      setSuspendReason("");
      setSelectedUser(null);
      alert('User suspended successfully');
    } catch (err) {
      console.error('Error suspending user:', err);
      alert('Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    if (window.confirm('Are you sure you want to unsuspend this user?')) {
      try {
        const token = localStorage.getItem("token");
        await API.put(`/api/users/${userId}/unsuspend`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        fetchUsers();
        fetchStatistics();
        alert('User unsuspended successfully');
      } catch (err) {
        console.error('Error unsuspending user:', err);
        alert('Failed to unsuspend user');
      }
    }
  };

  const handleCreateSubAdmin = async () => {
    const { full_name, email, phone, password, province, district, sector } = subAdminData;
    
    if (!full_name || !email || !phone || !password || !province || !district || !sector) {
      alert('All fields are required (province, district, sector)');
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      await API.post('/api/users/sub-admin/create', subAdminData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchUsers();
      fetchStatistics();
      setShowCreateSubAdminModal(false);
      setSubAdminData({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        province: "",
        district: "",
        sector: "",
        management_level: "sector"
      });
      alert('Sub Admin created successfully');
    } catch (err) {
      console.error('Error creating sub admin:', err);
      alert('Failed to create sub admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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
      case 'sub_admin': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-indigo-100 text-indigo-800';
      case 'farmer': return 'bg-emerald-100 text-emerald-800';
      case 'cooperative': return 'bg-orange-100 text-orange-800';
      case 'buyer': return 'bg-pink-100 text-pink-800';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">User Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateSubAdminModal(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Create Sub Admin
              </button>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_users || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activeUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 18.364m12.728-12.728L5.636 18.364m12.728-12.728L18.364 5.636M9 12h6m-6 0h6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Banned Users</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.banned_users || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833-.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspended Users</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.suspended_users || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Roles</option>
              <option value="sub_admin">Sub Admin</option>
              <option value="admin">Admin</option>
              <option value="farmer">Farmer</option>
              <option value="cooperative">Cooperative</option>
              <option value="buyer">Buyer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.status === 'active' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowSuspendModal(true);
                              }}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBanModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Ban
                            </button>
                          </>
                        )}
                        {user.status === 'banned' && (
                          <button
                            onClick={() => handleUnbanUser(user.user_id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Unban
                          </button>
                        )}
                        {user.status === 'suspended' && (
                          <button
                            onClick={() => handleUnsuspendUser(user.user_id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Unsuspend
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.user_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Ban User</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to ban {selectedUser?.full_name}?</p>
            <textarea
              placeholder="Reason for banning..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="3"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleBanUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Ban User
              </button>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Suspend User</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to suspend {selectedUser?.full_name}?</p>
            <textarea
              placeholder="Reason for suspending..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="3"
            />
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleSuspendUser}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Suspend User
              </button>
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason("");
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sub Admin Modal */}
      {showCreateSubAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Sub Admin</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={subAdminData.full_name}
                onChange={(e) => setSubAdminData({...subAdminData, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={subAdminData.email}
                onChange={(e) => setSubAdminData({...subAdminData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={subAdminData.phone}
                onChange={(e) => setSubAdminData({...subAdminData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={subAdminData.password}
                onChange={(e) => setSubAdminData({...subAdminData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Province"
                value={subAdminData.province}
                onChange={(e) => setSubAdminData({...subAdminData, province: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="District"
                value={subAdminData.district}
                onChange={(e) => setSubAdminData({...subAdminData, district: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Sector"
                value={subAdminData.sector}
                onChange={(e) => setSubAdminData({...subAdminData, sector: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={subAdminData.management_level}
                onChange={(e) => setSubAdminData({...subAdminData, management_level: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="sector">Sector Level (Most Specific)</option>
                <option value="district">District Level</option>
                <option value="province">Province Level (Broadest)</option>
              </select>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleCreateSubAdmin}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Sub Admin
              </button>
              <button
                onClick={() => {
                  setShowCreateSubAdminModal(false);
                  setSubAdminData({
                    full_name: "",
                    email: "",
                    phone: "",
                    password: "",
                    province: "",
                    district: "",
                    sector: "",
                    management_level: "sector"
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
