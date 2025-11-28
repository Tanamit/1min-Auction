import { useState } from "react";
import MyProfile from "./MyProfile";
import CompletedOrders from "./CompletedOrders";
import CancelledOrders from "./CancelledOrders";
import MyCredential from "./MyCredential";

export default function ProfileBuyer() {
  const [activeComponent, setActiveComponent] = useState('myProfile');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'myProfile':
        return <MyProfile />;
      case 'myCredential':
        return <MyCredential />;
      case 'completed':
        return <CompletedOrders />;
      case 'cancelled':
        return <CancelledOrders />;
      default:
        return <MyProfile />;
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb / header */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600">Home / <span className="text-black">My Account</span></p>
          <p className="text-sm">Welcome! <span className="text-red-500">Buyer01</span></p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Manage My Account</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveComponent('myProfile')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${activeComponent === 'myProfile' ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500'}`}
                    >
                      My Profile
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveComponent('myCredential')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${activeComponent === 'myCredential' ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500'}`}
                    >
                      My Credential
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">My Orders</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveComponent('completed')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${activeComponent === 'completed' ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500'}`}
                    >
                      Completed
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveComponent('cancelled')}
                      className={`w-full text-left px-4 py-2 rounded transition-colors ${activeComponent === 'cancelled' ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500'}`}
                    >
                      Cancelled
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Content area */}
          <main className="flex-1">
            {renderComponent()}
          </main>
        </div>
      </div>

    </>
  );
}