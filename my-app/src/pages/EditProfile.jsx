import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function EditProfile() {
    const { farmerId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [profile, setProfile] = useState({
        full_name: "",
        farm_name: "",
        bio: "",
        location: "",
        email: "",
        phone: "",
        profile_photo: ""
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, [farmerId]);

    const fetchProfileData = async () => {
        try {
            const response = await API.get(`/farmers/${farmerId}`);
            const data = response.data;
            setProfile({
                full_name: data.full_name || "",
                farm_name: data.farm_name || "",
                bio: data.bio || "",
                location: data.location || "",
                email: data.email || "",
                phone: data.phone || "",
                profile_photo: data.profile_photo || ""
            });
            setPreview(data.profile_photo || "");
        } catch (err) {
            setError("Failed to load profile data");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError("Please select an image file");
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("Image size should be less than 5MB");
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            setError(""); // Clear any previous errors
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const formData = new FormData();
            formData.append('full_name', profile.full_name);
            formData.append('farm_name', profile.farm_name);
            formData.append('bio', profile.bio);
            formData.append('location', profile.location);
            formData.append('email', profile.email);
            formData.append('phone', profile.phone);
            
            if (selectedFile) {
                formData.append('profile_photo', selectedFile);
            } else if (profile.profile_photo) {
                formData.append('profile_photo_url', profile.profile_photo);
            }
            
            await API.put(`/farmers/${farmerId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setSuccess(true);
            setTimeout(() => {
                navigate(`/farmer/${farmerId}`);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">
                        {t('editProfile') || 'Edit Profile'}
                    </h2>
                    <p className="mt-2 text-gray-600">
                        {t('updateFarmProfileInfo') || 'Update your farm profile information'}
                    </p>
                </div>

                {/* Form */}
                <form className="bg-white p-8 rounded-xl shadow-md" onSubmit={handleSubmit}>
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-6">
                            {t('profileUpdatedSuccess') || 'Profile updated successfully! Redirecting...'}
                        </div>
                    )}
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
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
                                <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Profile preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upload Controls */}
                            <div className="flex-grow">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">{t('uploadNewPhoto') || 'Upload new photo'}</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t('jpgPngGifUpTo5mb') || 'JPG, PNG, GIF up to 5MB'}</p>
                                    </div>
                                    
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">{t('or') || 'Or'}</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">{t('photoUrl') || 'Photo URL'}</label>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/photo.jpg"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                            value={profile.profile_photo}
                                            onChange={(e) => {
                                                setProfile({ ...profile, profile_photo: e.target.value });
                                                setPreview(e.target.value);
                                                setSelectedFile(null);
                                            }}
                                            disabled={!!selectedFile}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('fullName') || 'Full Name'} *
                                </label>
                                <input
                                    id="full_name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={profile.full_name}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="farm_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('farmName') || 'Farm Name'} *
                                </label>
                                <input
                                    id="farm_name"
                                    type="text"
                                    placeholder="Green Valley Farm"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={profile.farm_name}
                                    onChange={(e) => setProfile({ ...profile, farm_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('bio') || 'Bio'}
                            </label>
                            <textarea
                                id="bio"
                                rows={4}
                                placeholder={t('tellUsAboutFarm') || "Tell us about your farm and farming practices..."}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('location') || 'Location'}
                                </label>
                                <input
                                    id="location"
                                    type="text"
                                    placeholder="City, State"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={profile.location}
                                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('email') || 'Email'}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="farm@example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('phone') || 'Phone'}
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                            onClick={() => navigate(`/farmer/${farmerId}`)}
                            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfile;
