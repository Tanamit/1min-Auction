import { useState } from "react";
import Headers from "../common/Header";
import Footer from "../common/Footer";
import MyProfile from "./MyProfile";
import ProductValidation from "./ProductValidation";
import ProductValidationList from "./ProductValidationList";
import ProductStatusLists from "./ProductStatusLists";
import RoleManagement from "./RoleManagement";



export default function ProfileAdmin() {
    const [activeComponent, setActiveComponent] = useState('myProfile');
    
        const renderComponent = () => {
            switch (activeComponent) {
                case 'myProfile':
                    return <MyProfile />;
                case 'myCredential':
                    return <MyCredential />;
                case 'productValidation':
                    return <ProductValidation />;
                case 'productValidationLists':
                    return <ProductValidationList />;
                case 'productStatusLists':
                    return <ProductStatusLists />;
                case 'roleManagement':
                    return <RoleManagement />;
                default:
                    return <MyProfile />;
            }
        };
    

    return (
    <>
    {/* Breadcrumb */}
    <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
                Home / <span className="text-black">My Account</span>
            </p>
            <p className="text-sm">
                Welcome! <span className="text-red-500">Admin01</span>
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
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${
                                                activeComponent === 'myProfile'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                            }`}
                                        >
                                            My Profile
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
                                            onClick={() => setActiveComponent('productValidation')}
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${
                                                activeComponent === 'productValidation'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                            }`}
                                        >
                                            To be Validate
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => setActiveComponent('productValidationLists')}
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${
                                                activeComponent === 'productValidationLists'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                            }`}
                                        >
                                            Validated list
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => setActiveComponent('productStatusLists')}
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${
                                                activeComponent === 'productStatusLists'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                            }`}
                                        >
                                            Item list
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            {/* Role Management Section */}
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Role management</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button
                                            onClick={() => setActiveComponent('roleManagement')}
                                            className={`w-full text-left px-4 py-2 rounded transition-colors ${
                                                activeComponent === 'roleManagement'
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-600 hover:text-red-500'
                                            }`}
                                        >
                                            User
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {renderComponent()}
                    </div>
                </div>
            </div>
    </>
);
}