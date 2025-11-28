// frontend/src/components/pages/Payment.jsx
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL } from "../../config/api";


const Payment = () => {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ← เพิ่ม

  const stateData = location.state || {};

  // ดึง userId จาก URL query params
  const userIdFromUrl = searchParams.get('userId'); // ← เพิ่ม

  const [product, setProduct] = useState(stateData.product || null);
  const [winningBid, setWinningBid] = useState(stateData.winningBid || 0);
  const [userId, setUserId] = useState(stateData.userId || userIdFromUrl || null); // ← แก้ไข
  const [loading, setLoading] = useState(!stateData.product);

  const [showQRModal, setShowQRModal] = useState(false);
  const [slipImage, setSlipImage] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    street: '',
    apartment: '',
    city: '',
    phone: '',
    email: ''
  });

  // Debug log
  useEffect(() => {
    console.log('=== Payment Component Loaded ===');
    console.log('location.state:', location.state);
    console.log('productId:', productId);
    console.log('userIdFromUrl:', userIdFromUrl); // ← เพิ่ม
    console.log('userId (final):', userId); // ← แก้ไข
    console.log('product:', product);
    console.log('winningBid:', winningBid);
    console.log('================================');
  }, []);

  useEffect(() => {
    if (!product) {
      loadProduct();
    } else {
      setLoading(false);
    }
  }, [productId]);

  async function loadProduct() {
    try {
      const res = await fetch(`${API_BASE_URL}/bids/product/${productId}`);
      const data = await res.json();
      setProduct(data);

      const bidRes = await fetch(`${API_BASE_URL}/bids/product/${productId}/highest`);
      const bidData = await bidRes.json();
      setWinningBid(parseFloat(bidData.highest_bid || data.start_price));

    } catch (error) {
      console.error("Error loading product:", error);
      alert("Failed to load product data");
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.street || !formData.city || !formData.phone || !formData.email) {
      Swal.fire('Error', 'Please fill in all required fields', 'error');
      return;
    }

    setShowQRModal(true);
  };

  const handleSlipUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('Error', 'File size must be less than 10MB', 'error');
        return;
      }

      setSlipImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async () => {
    if (!slipImage) {
      Swal.fire('Error', 'Please upload payment slip', 'error');
      return;
    }

    if (!userId) {
      Swal.fire('Error', 'User ID is missing. Please try again.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();

      const address = `${formData.street}, ${formData.apartment ? formData.apartment + ', ' : ''}${formData.city}`;

      formDataToSend.append('product_id', productId);
      formDataToSend.append('user_id', userId);
      formDataToSend.append('amount', total);
      formDataToSend.append('address', address);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('payment_slip', slipImage);
      formDataToSend.append('payment_status', 'pending');

      console.log('📤 Sending payment data:', {
        product_id: productId,
        user_id: userId,
        amount: total,
        address: address
      });

      const res = await fetch(`${API_BASE_URL}/payment/create`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit payment');
      }

      Swal.fire({
        title: 'Payment Submitted!',
        text: 'Your payment is being verified.',
        icon: 'success',
        confirmButtonColor: '#dc2626',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        setShowQRModal(false);

        navigate(`/invoice/${data.invoice_id}`, {
          state: {
            invoiceData: {
              number: `INV-${data.payment_id.slice(-6)}`,
              payable: total,
              issueDate: new Date().toLocaleDateString('en-GB'),
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
              billedTo: {
                name: formData.firstName,
                address: address,
              },
              from: {
                name: "1MIN Auction",
                address: "888 Salaya, Nakhon Pathom, Thailand, 73170",
                taxId: "00XXXXX1234X0XX",
              },
              item: {
                description: product.product_name,
                qty: 1,
                amount: total,
              },
              paymentId: data.payment_id,
              invoiceId: data.invoice_id,
            }
          }
        });
      });

    } catch (error) {
      console.error('Payment submission error:', error);
      Swal.fire('Error', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-500">Product not found</p>
      </div>
    );
  }

  const total = winningBid || parseFloat(product.start_price) || 0;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 font-sans">

        <button
          onClick={handleBack}
          className="flex items-center text-sm font-semibold text-gray-700 mb-6 hover:text-red-600 transition duration-150"
        >
          <span className="text-xl mr-2">&larr;</span>
          Back
        </button>

        <div className="text-sm text-gray-600 mb-6">
          <span>Account / My Account / Product / Bidding / </span>
          <span className="font-semibold text-gray-800">Checkout</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">

          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Billing Details</h2>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name*"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
              <input
                type="text"
                name="street"
                placeholder="Street Address*"
                value={formData.street}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
              <input
                type="text"
                name="apartment"
                placeholder="Apartment, floor, etc."
                value={formData.apartment}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
              <input
                type="text"
                name="city"
                placeholder="Town/City*"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number*"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address*"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
            </form>
          </div>

          <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-lg shadow h-fit">

            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
              <div className="flex-grow">
                <div className="font-semibold text-gray-900">{product.product_name}</div>
                <div className="text-sm text-gray-500">Product ID: {product.product_id}</div>
              </div>
              <div className="font-semibold text-gray-900">฿{total.toLocaleString()}</div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">฿{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-bold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200 text-lg font-bold">
                <span>Total:</span>
                <span>฿{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full py-3 mt-6 bg-red-600 text-white text-lg font-bold rounded-md hover:bg-red-700 transition duration-200 shadow-md"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>

      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Payment</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 flex flex-col items-center mb-6">
              <p className="text-sm text-gray-600 mb-4">Scan QR Code to Pay</p>

              <div className="w-64 h-64 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Payment-1minAuction-ProductID-${productId}-Amount-${total}`}
                  alt="QR Code for Payment"
                  className="w-full h-full object-contain p-2"
                />
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">฿{total.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Total Amount</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-800">Upload Payment Slip</h4>

              {slipPreview && (
                <div className="mb-4">
                  <img
                    src={slipPreview}
                    alt="Slip preview"
                    className="w-full h-48 object-contain bg-gray-100 rounded-lg border"
                  />
                </div>
              )}

              <label className="block">
                <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-red-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlipUpload}
                    className="hidden"
                    disabled={submitting}
                  />
                  <div className="text-gray-600">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="mt-2 text-sm">Click to upload payment slip</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </label>

              <button
                onClick={handleConfirmPayment}
                disabled={!slipImage || submitting}
                className={`w-full py-3 mt-4 rounded-lg text-lg font-bold transition ${slipImage && !submitting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {submitting ? 'Submitting...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Payment;