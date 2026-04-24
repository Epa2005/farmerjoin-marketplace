import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useNewTranslation } from "../hooks/useNewTranslation";

function EditUserProfile() {
    const navigate = useNavigate();
    const { t } = useNewTranslation();
    const [profile, setProfile] = useState({
        full_name: "",
        email: "",
        phone: "",
        photo: ""
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setFetchLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await API.get('/api/user/profile');
            const data = response.data;
            
            console.log('Profile data from server:', data);
            
            setProfile({
                full_name: data.full_name || "",
                email: data.email || "",
                phone: data.phone || "",
                photo: data.photo || ""
            });
            setPreview(data.photo || "");
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(t('failedToLoadProfile') || "Failed to load profile data");
        } finally {
            setFetchLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError(t('pleaseSelectImage') || "Please select an image file");
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError(t('imageSizeError') || "Image size should be less than 5MB");
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const formData = new FormData();
            formData.append('full_name', profile.full_name);
            formData.append('email', profile.email);
            formData.append('phone', profile.phone);
            
            if (selectedFile) {
                formData.append('photo', selectedFile);
            }
            
            const response = await API.put('/api/user/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setSuccess(true);
            
            // Update local storage user data with response from server
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.full_name = profile.full_name;
            userData.email = profile.email;
            userData.phone = profile.phone;
            // Update photo from server response
            if (response.data.user && response.data.user.photo) {
                userData.photo = response.data.user.photo;
                setPreview(response.data.user.photo);
            }
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Dispatch event to notify other components (like navbar) of profile update
            window.dispatchEvent(new Event('storage'));
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || t('failedToUpdateProfile') || "Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePhoto = async () => {
        try {
            await API.delete('/api/user/profile/photo');
            setPreview("");
            setProfile({ ...profile, photo: "" });
            setSelectedFile(null);
        } catch (err) {
            setError(t('failedToRemovePhoto') || "Failed to remove photo");
        }
    };

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {t('editProfile') || 'Edit Profile'}
                    </h2>
                    <p className="mt-2 text-gray-600">
                        {t('updateYourProfileInfo') || 'Update your profile information'}
                    </p>
                </div>

                {/* Form */}
                <form className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200" onSubmit={handleSubmit}>
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                            {t('profileUpdatedSuccess') || 'Profile updated successfully! Redirecting...'}
                        </div>
                    )}
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Profile Photo Section */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                            {t('profilePhoto') || 'Profile Photo'}
                        </label>
                        
                        <div className="flex items-center space-x-6">
                            {/* Current/Preview Photo */}
                            <div className="flex-shrink-0">
                                <div className="w-28 h-28 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Profile preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-14 h-14 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upload Controls */}
                            <div className="flex-grow space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">
                                        {t('uploadNewPhoto') || 'Upload new photo'}
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
                                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {t('chooseFile') || 'Choose File'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                        {preview && (
                                            <button
                                                type="button"
                                                onClick={handleRemovePhoto}
                                                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                {t('remove') || 'Remove'}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {t('jpgPngGifUpTo5mb') || 'JPG, PNG, GIF up to 5MB'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('fullName') || 'Full Name'} *
                            </label>
                            <input
                                id="full_name"
                                type="text"
                                placeholder="John Doe"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('email') || 'Email'} *
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('phone') || 'Phone'}
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    placeholder="+250 123 456 789"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('updating') || 'Updating...'}
                                </span>
                            ) : (
                                t('updateProfile') || 'Update Profile'
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditUserProfile;
