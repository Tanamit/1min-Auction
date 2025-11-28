// frontend/src/components/common/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Support Section */}
          <div>
            <h3 className="text-xl font-bold mb-6">Support</h3>
            <div className="space-y-3">
              <p>888 Salaya, Nakhon</p>
              <p>Pathom, Thailand,</p>
              <p>73170</p>
              <p className="mt-4">1min.exclusive@gmail.com</p>
              <p>+66-88888-8888</p>
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-xl font-bold mb-6">Account</h3>
            <nav className="space-y-3">
              <Link to="/account" className="block hover:underline">
                My Account
              </Link>
              <Link to="/login" className="block hover:underline">
                Login / Register
              </Link>
              <Link to="/cart" className="block hover:underline">
                Cart
              </Link>
              <Link to="/wishlist" className="block hover:underline">
                Wishlist
              </Link>
              <Link to="/shop" className="block hover:underline">
                Shop
              </Link>
            </nav>
          </div>

          {/* Quick Link Section */}
          <div>
            <h3 className="text-xl font-bold mb-6">Quick Link</h3>
            <nav className="space-y-3">
              <Link to="/privacy-policy" className="block hover:underline">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block hover:underline">
                Terms Of Use
              </Link>
              <Link to="/faq" className="block hover:underline">
                FAQ
              </Link>
              <Link to="/contact" className="block hover:underline">
                Contact
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-blue-800 mt-8 pt-6 text-center text-sm opacity-75">
          <p>© 2025 1min-Auction. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}