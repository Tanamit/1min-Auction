// frontend/src/components/common/Header.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiMenu, FiX, FiChevronDown, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import TopBanner from './TopBanner';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth(); // ✅ ดึง user data จาก context

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate('/login');
  };

  // สร้าง profile link ตาม role
  const getProfileLink = () => {
    if (!user) return '/login';
    console.log(user);

    switch (user.role_id) {
      case 1: return '/profile/admin';
      case 2: return '/profile/seller';
      case 3: return '/profile/buyer';
      default: return '/';
    }
  };

  const getRoleName = () => {
    if (!user) return 'Guest';

    switch (user.role_id) {
      case 1: return 'Admin';
      case 2: return 'Seller';
      case 3: return 'Buyer';
      default: return 'User';
    }
  };

  return (
    <>
      <TopBanner />
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Hamburger Menu */}
            <div className="flex items-center gap-4">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                <h1 className="text-2xl font-bold cursor-pointer hover:opacity-80">
                  1min-Auction
                </h1>
              </Link>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden"
              >
                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-8">
              <Link to="/" className="hover:underline">Home</Link>
              <Link to="/contact" className="hover:underline">Contact</Link>
              <Link to="/about" className="hover:underline">About</Link>
              {!isAuthenticated && (
                <Link to="/signup" className="hover:underline">Sign Up</Link>
              )}
              {!isAuthenticated && (
                <Link to="/login" className="hover:underline">Log In</Link>
              )}
            </nav>

            {/* Search & Icons */}
            <div className="flex items-center gap-4">
              {/* Desktop Search Bar */}
              <div className="hidden lg:flex items-center bg-gray-100 px-4 py-2 rounded">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="bg-transparent outline-none w-64"
                />
                <FiSearch className="text-gray-600" />
              </div>

              {/* Profile Dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-80 cursor-pointer transition-opacity"
                >
                  <FiUser size={24} />
                  <FiChevronDown size={16} />

                  {/* ✅ แสดงชื่อ user */}
                  {isAuthenticated && (
                    <span className="hidden lg:inline text-sm font-medium">
                      {user.user_name || user.email}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
                    {isAuthenticated ? (
                      <>
                        {/* User Info */}
                        <div className="px-4 py-2 border-b">
                          <p className="font-semibold text-gray-800">
                            {user.user_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Role: {getRoleName()}
                          </p>
                        </div>

                        {/* Profile Link */}
                        <Link
                          to={getProfileLink()}
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          My Profile
                        </Link>

                        {/* Logout */}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t mt-2"
                        >
                          <FiLogOut size={16} />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Not Logged In */}
                        <Link
                          to="/login"
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          to="/signup"
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4">
              {/* Mobile Search */}
              <div className="flex items-center bg-gray-100 px-4 py-2 rounded mb-4">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="bg-transparent outline-none w-full"
                />
                <FiSearch className="text-gray-600" />
              </div>

              {/* User Info (Mobile) */}
              {isAuthenticated && (
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <p className="font-semibold">{user.user_name || 'User'}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-blue-600 mt-1">Role: {getRoleName()}</p>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-4">
                <Link
                  to="/"
                  className="hover:underline py-2 border-b"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/contact"
                  className="hover:underline py-2 border-b"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  to="/about"
                  className="hover:underline py-2 border-b"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to={getProfileLink()}
                      className="hover:underline py-2 border-b"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="text-left text-red-600 py-2 border-b flex items-center gap-2"
                    >
                      <FiLogOut size={16} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="hover:underline py-2 border-b"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="hover:underline py-2 border-b"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}