import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import Header from './components/common/Header';
import Footer from './components/common/Footer';

import Home from './components/pages/Home';
import Contact from './components/pages/Contact';
// import About from './components/pages/About';
import SignUp from './components/pages/SignUp';
import Login from './components/pages/Login';
import Payment from './components/pages/Payment';
import Invoice from './components/pages/Invoice';
import ForgetPassword from './components/pages/ForgetPassword';
import ResetPassword from './components/pages/ResetPassword';

import ProfileBuyer from './components/ProfileBuyer/ProfileBuyer';
import ProfileSeller from './components/ProfileSeller/ProfileSeller';
import ProfileAdmin from './components/ProfileAdmin/ProfileAdmin';

import Bidding from './components/bidding/Bidding';
import BiddingNow from './components/home/BiddingNow';
import ComingUp from './components/home/ComingUp';

// ✅ CORRECT FILE
import AuctionProductDetail from "./components/AuctionBid/AuctionProductDetail";

export default function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        
        <Header />

        <main className="flex-grow">

          <Routes>

            {/* MAIN PAGES */}
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            {/* <Route path="/about" element={<About />} /> */}

            {/* AUTH */}
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgetpassword" element={<ForgetPassword />} />
            <Route path="/resetpassword" element={<ResetPassword />} />

            {/* PROFILES */}
            <Route path="/profile/buyer" element={<ProfileBuyer />} />
            <Route path="/profile/seller" element={<ProfileSeller />} />
            <Route path="/profile/admin" element={<ProfileAdmin />} />

            {/* AUCTION ROUTES */}
            <Route path="/auction/:productId" element={<AuctionProductDetail />} />
            <Route path="/bidding/:productId" element={<Bidding />} />
            <Route path="/bidding-now" element={<BiddingNow />} />
            <Route path="/coming-up" element={<ComingUp />} />

            {/* PAYMENT */}
            <Route path="/payment/:productId" element={<Payment />} />
            <Route path="/invoice/:invoiceId" element={<Invoice />} />

          </Routes>

        </main>

        <Footer />

      </div>
    </AuthProvider>
  );
}
