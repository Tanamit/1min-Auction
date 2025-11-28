import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from "../../config/api";

export default function MyProfile() {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        user_email: '',
        user_name: '',
        address: '',
        create_date: '',
        verify_img: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                user_email: user.user_email || '',
                user_name: user.user_name || '',
                address: user.address || '',
                create_date: user.create_date || '',
                verify_img: user.verify_img || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            console.log('Submitting data:', {
                user_id: user.user_id,
                email: formData.user_email,
                username: formData.user_name,
                first_name: formData.firstName,
                last_name: formData.lastName,
                address: formData.address,
                create_date: formData.create_date,
                verify_img: formData.verify_img

            });


            const response = await fetch(`${API_BASE_URL}/api/users/${user.user_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.user_id,
                    user_email: formData.user_email,
                    user_name: formData.user_name,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    address: formData.address,
                    create_date: formData.create_date,
                    verify_img: formData.verify_img
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to update profile');
            }

            const updatedUser = await response.json();

            // อัพเดท user ใน context (ถ้ามี function นี้)
            if (updateUser) {
                updateUser(updatedUser);
            }

            alert('Profile updated successfully!');

        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset to original user data
        if (user) {
            setFormData({
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                user_email: user.user_email || '',
                user_name: user.user_name || '',
                address: user.address || ''
            });
        }
    };

    // ✅ Loading state
    if (!user) {
        return (
            <div className="bg-white shadow-sm rounded-lg p-8">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-sm rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-red-500 mb-6">Edit Your Profile</h2>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            name="user_email"
                            value={formData.user_email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            name="user_name"
                            value={formData.user_name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                        />
                    </div>
                </div>

                {/* Address */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address (default)
                    </label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}