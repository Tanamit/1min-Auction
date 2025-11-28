import { useState } from 'react';

export default function AddressBook() {
    const [addresses, setAddresses] = useState([
        {
            id: 1,
            name: 'Home',
            address: '999 Phutthamonthon Sai 4 Rd',
            district: 'Salaya, Phutthamonthon District',
            city: 'Nakhon Pathom',
            postalCode: '73170',
            phone: '+66-88888-8888',
            isDefault: true
        },
        {
            id: 2,
            name: 'Office',
            address: '888 Salaya, Nakhon Pathom',
            district: 'Salaya, Phutthamonthon District',
            city: 'Nakhon Pathom',
            postalCode: '73170',
            phone: '+66-88888-8888',
            isDefault: false
        }
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        name: '',
        address: '',
        district: '',
        city: '',
        postalCode: '',
        phone: '',
        isDefault: false
    });

    const handleAddAddress = () => {
        if (newAddress.name && newAddress.address) {
            setAddresses([
                ...addresses,
                { ...newAddress, id: Date.now() }
            ]);
            setNewAddress({
                name: '',
                address: '',
                district: '',
                city: '',
                postalCode: '',
                phone: '',
                isDefault: false
            });
            setShowAddForm(false);
        }
    };

    const handleSetDefault = (id) => {
        setAddresses(addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === id
        })));
    };

    const handleDeleteAddress = (id) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            setAddresses(addresses.filter(addr => addr.id !== id));
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-lg p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-red-500">Address Book</h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                    + Add New Address
                </button>
            </div>

            {/* Add Address Form */}
            {showAddForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">New Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Name (e.g., Home, Office)"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <input
                            type="text"
                            placeholder="Address"
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <input
                            type="text"
                            placeholder="District"
                            value={newAddress.district}
                            onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <input
                            type="text"
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <input
                            type="text"
                            placeholder="Postal Code"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div className="flex justify-end gap-4 mt-4">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddAddress}
                            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                            Save Address
                        </button>
                    </div>
                </div>
            )}

            {/* Address List */}
            <div className="space-y-4">
                {addresses.map((addr) => (
                    <div
                        key={addr.id}
                        className={`p-6 border rounded-lg ${
                            addr.isDefault ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold">{addr.name}</h3>
                                    {addr.isDefault && (
                                        <span className="px-3 py-1 bg-red-500 text-white text-xs rounded-full">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-700">{addr.address}</p>
                                <p className="text-gray-700">{addr.district}</p>
                                <p className="text-gray-700">
                                    {addr.city} {addr.postalCode}
                                </p>
                                <p className="text-gray-700 mt-2">Phone: {addr.phone}</p>
                            </div>
                            <div className="flex gap-2">
                                {!addr.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(addr.id)}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Set as Default
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteAddress(addr.id)}
                                    className="px-4 py-2 text-sm text-red-500 border border-red-500 rounded-md hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}