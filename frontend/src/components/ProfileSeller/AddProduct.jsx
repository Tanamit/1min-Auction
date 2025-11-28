import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from "../../config/api";


// helpers
const pad = (n) => String(n).padStart(2, '0');
const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const roundedNowTimeLocal = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toIsoWithTZFromDate = (d) => {
    const tz = -d.getTimezoneOffset();
    const sign = tz >= 0 ? '+' : '-';
    const hh = pad(Math.floor(Math.abs(tz) / 60));
    const mm = pad(Math.abs(tz) % 60);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${hh}:${mm}`;
};

export default function AddProduct() {
    const { user } = useAuth();
    const [productData, setProductData] = useState({
        name: '',
        category: '',
        price: '',
        description: '',
        images: [],
        start_date: todayLocal(),        // YYYY-MM-DD
        start_time_hm: roundedNowTimeLocal(), // HH:MM
    });

    const [previewImages, setPreviewImages] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/seller/categories`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed to fetch categories');
                if (mounted) setCategories(data);
            } catch (err) {
                console.error('Error loading categories:', err);
                alert('Cannot load categories');
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleChange = (e) => {
        setProductData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const allowed = Math.max(0, 5 - productData.images.length);
        const take = files.slice(0, allowed);
        const newPreviews = take.map((f) => URL.createObjectURL(f));
        setPreviewImages((prev) => [...prev, ...newPreviews]);
        setProductData((prev) => ({ ...prev, images: [...prev.images, ...take] }));
    };

    const removeImage = (i) => {
        setPreviewImages((prev) => {
            const url = prev[i];
            if (url) URL.revokeObjectURL(url);
            return prev.filter((_, idx) => idx !== i);
        });
        setProductData((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
    };

    useEffect(() => () => previewImages.forEach((u) => URL.revokeObjectURL(u)), [previewImages]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!productData.name || !productData.category || !productData.price) {
            alert('Please fill in all required fields!');
            return;
        }
        if (productData.images.length === 0) {
            alert('Please upload at least one image!');
            return;
        }

        // build Date objects
        const start = new Date(`${productData.start_date}T${productData.start_time_hm}:00`);
        const now = new Date();
        if (isNaN(start.getTime())) {
            alert('Invalid start date/time');
            return;
        }
        if (start < now) {
            alert('Start time must be in the future.');
            return;
        }
        const end = new Date(start.getTime() + 60 * 1000); // +1 minute

        // check slot availability first
        try {
            const checkUrl = `${API_BASE_URL}/api/seller/products/check-slot?start_time=${encodeURIComponent(toIsoWithTZFromDate(start))}`;
            const check = await fetch(checkUrl, { headers: { 'X-User-Id': user?.user_id ?? '' }});
            const okJson = await check.json().catch(() => ({}));
            if (!check.ok || okJson?.available === false) {
                alert(okJson?.message || 'This start time is already taken. Please choose a different time.');
                return;
            }
        } catch (err) {
            console.error('Slot check failed:', err);
            alert('Could not verify start time. Please try again.');
            return;
        }

        // submit
        try {
            const form = new FormData();
            form.append('product_name', productData.name);
            form.append('product_desc', productData.description || '');
            form.append('product_cat_id', productData.category);
            form.append('start_price', productData.price);

            // send start_time & end_time (ISO with timezone)
            form.append('start_time', toIsoWithTZFromDate(start));
            form.append('end_time', toIsoWithTZFromDate(end));

            productData.images.forEach((img, idx) => idx < 5 && form.append(`product_img${idx + 1}`, img));

            const res = await fetch(`${API_BASE_URL}/api/seller/products`, {
                method: 'POST',
                headers: { 'X-User-Id': user?.user_id ?? '' },
                body: form
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.message || 'Upload failed');

            alert('✅ Product added successfully!');
            previewImages.forEach((u) => URL.revokeObjectURL(u));
            setPreviewImages([]);
            setProductData({
                name: '',
                category: '',
                price: '',
                description: '',
                images: [],
                start_date: todayLocal(),
                start_time_hm: roundedNowTimeLocal(),
            });
        } catch (err) {
            console.error('Upload error:', err);
            alert(err.message);
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-red-500 mb-6">Add New Product</h2>

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Images <span className="text-red-500">*</span> (up to 5)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition-colors">
                            <input id="imageUpload" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center">
                                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                                <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</span>
                            </label>
                        </div>
                        {previewImages.length > 0 && (
                            <div className="grid grid-cols-4 gap-4 mt-4">
                                {previewImages.map((p, i) => (
                                    <div key={i} className="relative group">
                                        <img src={p} alt={`Preview ${i + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                                        <button type="button" onClick={() => removeImage(i)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={productData.name} onChange={handleChange} required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Enter product name" />
                    </div>

                    {/* Category, Price, Date & Time */}
                    <div className="grid grid-cols-4 gap-6">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                            <select name="category" value={productData.category} onChange={handleChange} required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price (THB) <span className="text-red-500">*</span></label>
                            <input type="number" name="price" value={productData.price} onChange={handleChange} required min="0" step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="0.00" />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                            <input type="date" name="start_date" value={productData.start_date} onChange={handleChange} required min={todayLocal()}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time (HH:MM) <span className="text-red-500">*</span></label>
                            <input type="time" name="start_time_hm" value={productData.start_time_hm} onChange={handleChange} required step="60"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                            <p className="text-xs text-gray-500 mt-1">End time will be +1 minute automatically.</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                        <textarea name="description" value={productData.description} onChange={handleChange} rows="5"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Describe your product..." />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button type="button" onClick={() => {
                            previewImages.forEach((u) => URL.revokeObjectURL(u));
                            setPreviewImages([]);
                            setProductData({
                                name: '',
                                category: '',
                                price: '',
                                description: '',
                                images: [],
                                start_date: todayLocal(),
                                start_time_hm: roundedNowTimeLocal(),
                            });
                        }} className="px-8 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                            Clear Form
                        </button>
                        <button type="submit" className="px-8 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                            Add Product
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
