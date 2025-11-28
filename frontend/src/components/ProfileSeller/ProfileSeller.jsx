import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';   // ✅ get user from context
import MyProfile from './MyProfile';
import AddressBook from './AddressBook';
import MyCredential from './MyCredential';
import AddProduct from './AddProduct';
import ProductLists from './ProductLists';

export default function ProfileSeller() {
    const { user } = useAuth(); // { user_name, first_name, last_name, ... }
    const [activeComponent, setActiveComponent] = useState('myProfile');

    const renderComponent = () => {
        switch (activeComponent) {
            case 'myProfile':
                return <MyProfile />;
            case 'addressBook':
                return <AddressBook />;
            case 'myCredential':
                return <MyCredential />;
            case 'addProduct':
                return <AddProduct />;
            case 'productLists':
                return <ProductLists />;
            default:
                return <MyProfile />;
        }
    };

    // Prefer "First Last" → user_name → fallback
    const displayName =
        (user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '') ||
        user?.user_name ||
        'Seller';

    return (
        <>
            {/* Breadcrumb */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Home / <span className="text-black">My Account</span>
                    </p>
                    <p className="text-sm">
                        Welcome! <span className="text-red-500">{displayName}</span>
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <div className="space-y-6">
                            {/* Manage My Account Section */}
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Manage My Account</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button
                                            onClick={() => setActiveComponent('myProfile')}
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${activeComponent === 'myProfile'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                                }`}
                                        >
                                            My Profile
                                        </button>
                                    </li>
                                    {/* <li>
                    <button
                      onClick={() => setActiveComponent('addressBook')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${
                        activeComponent === 'addressBook'
                          ? 'text-red-500 bg-red-50'
                          : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      Address Book
                    </button>
                  </li> */}
                                    <li>
                                        <button
                                            onClick={() => setActiveComponent('myCredential')}
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${activeComponent === 'myCredential'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                                }`}
                                        >
                                            My Credential
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* Product Management Section */}
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Product management</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button
                                            onClick={() => setActiveComponent('addProduct')}
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${activeComponent === 'addProduct'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                                }`}
                                        >
                                            Add product
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => setActiveComponent('productLists')}
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${activeComponent === 'productLists'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                                }`}
                                        >
                                            Product lists
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">{renderComponent()}</div>
                </div>
            </div>
        </>
    );
}
