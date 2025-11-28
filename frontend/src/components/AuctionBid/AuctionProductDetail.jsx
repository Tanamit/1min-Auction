import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";

const MIN_INCREMENT = 500;

// Helper: compute remaining time
function computeRemainingTime(targetTime, currentTime = new Date()) {
  if (!targetTime) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };

  const diff = targetTime.getTime() - currentTime.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, ended: false };
}

// Helper: decode image from hex or base64
function decodeImage(raw) {
  if (!raw) return null;
  
  if (raw.startsWith("data:") || raw.startsWith("http")) {
    return raw;
  }
  
  if (raw.startsWith("/9j/") || raw.startsWith("iVBOR") || 
      raw.startsWith("R0lG") || raw.startsWith("UklG")) {
    return `data:image/jpeg;base64,${raw}`;
  }
  
  try {
    let h = raw;
    if (h.startsWith("\\x")) h = h.slice(2);
    else if (h.startsWith("\\\\x")) h = h.slice(3);
    
    if (/^[0-9a-fA-F]+$/.test(h)) {
      const bytes = new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16)));
      return URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    }
  } catch (e) {
    console.error("Error decoding image:", e);
  }
  
  return null;
}

export default function AuctionProductDetail() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentBid, setCurrentBid] = useState(0);
  const [totalBids, setTotalBids] = useState(0);
  const [userBidAmount, setUserBidAmount] = useState(0);
  const [nextMin, setNextMin] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState({});
  const [phase, setPhase] = useState("waiting"); // waiting | active | ended

  // ✅ Load product data
  useEffect(() => {
    async function loadProduct() {
      // ถ้ามี state จาก navigation ใช้เลย
      if (location.state?.productData) {
        const raw = location.state.productData;
        setProductData({
          id: raw.product_id || productId,
          name: raw.product_name || "Unnamed Product",
          description: raw.product_desc || "No description available.",
          startPrice: raw.start_price || 0,
          start_time: raw.start_time || null,
          end_time: raw.end_time || null,
          listedBy: raw.seller_id || "Unknown",
          product_img: raw.product_img || null,
        });
        setLoading(false);
        return;
      }

      // ถ้าไม่มี state ดึงจาก API
      try {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`);
        const data = await res.json();
        
        if (res.ok) {
          setProductData({
            id: data.product_id || productId,
            name: data.product_name || "Unnamed Product",
            description: data.product_desc || "No description available.",
            startPrice: data.start_price || 0,
            start_time: data.start_time || null,
            end_time: data.end_time || null,
            listedBy: data.seller_id || "Unknown",
            product_img: data.product_img || null,
          });
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [productId, location.state]);

  // ✅ Load current highest bid
  useEffect(() => {
    if (!productData) return;
    
    async function loadHighest() {
      try {
        const res = await fetch(`${API_BASE_URL}/bids/${productId}/highest`);
        const data = await res.json();
        const highest = data.highest_bid || productData.startPrice;
        const count = data.total_bids || 0;
        
        setCurrentBid(highest);
        setTotalBids(count);
        setNextMin(highest + MIN_INCREMENT);
        setUserBidAmount(highest + MIN_INCREMENT);
      } catch (err) {
        console.error("❌ Failed to load highest bid:", err);
        setCurrentBid(productData.startPrice);
        setNextMin(productData.startPrice + MIN_INCREMENT);
        setUserBidAmount(productData.startPrice + MIN_INCREMENT);
      }
    }
    
    loadHighest();
    
    // Refresh highest bid ทุก 3 วินาทีระหว่างประมูล
    const interval = setInterval(() => {
      if (phase === "active") {
        loadHighest();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [productId, productData, phase]);

  // ✅ Real Clock + Phase Detection
  useEffect(() => {
    if (!productData) return;

    const timer = setInterval(() => {
      const now = new Date();

      const start = productData.start_time 
        ? new Date(productData.start_time.replace(" ", "T")) 
        : null;
      const end = productData.end_time 
        ? new Date(productData.end_time.replace(" ", "T")) 
        : null;

      if (!start || !end) {
        setPhase("waiting");
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });
        return;
      }

      if (now < start) {
        // ยังไม่ถึงเวลาเริ่ม - countdown ถึง start_time
        setPhase("waiting");
        setTimeRemaining(computeRemainingTime(start, now));
      } else if (now >= start && now < end) {
        // กำลังประมูล - countdown ถึง end_time
        setPhase("active");
        setTimeRemaining(computeRemainingTime(end, now));
      } else {
        // หมดเวลา
        setPhase("ended");
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [productData]);

  // ✅ Finalize auction when ended
  useEffect(() => {
    if (phase === "ended" && productData) {
      finalizeAuction();
    }
  }, [phase]);

  async function finalizeAuction() {
    try {
      const res = await fetch(`${API_BASE_URL}/products/finalize/${productId}`, {
        method: "POST"
      });
      const data = await res.json();
      console.log("Auction finalized:", data);
      
      // ถ้ามีผู้ชนะและเป็น user ปัจจุบัน
      if (data.winner_id && data.winner_id === user?.user_id) {
        Swal.fire({
          icon: "success",
          title: "🎉 Congratulations!",
          text: `You won this auction at ฿${data.final_price?.toLocaleString()}!`,
          confirmButtonText: "Proceed to Payment",
          confirmButtonColor: "#dc2626",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(`/payment/${productId}?userId=${user.user_id}`, {
              state: {
                product: productData,
                winningBid: data.final_price,
                userId: user.user_id
              }
            });
          }
        });
      }
    } catch (err) {
      console.error("Failed to finalize auction:", err);
    }
  }

  const formatTime = (t) => String(t ?? 0).padStart(2, "0");

  // ✅ Submit bid
  const handleBidSubmit = async () => {
    if (phase !== "active") {
      Swal.fire("⚠️ Not Available", "This item is not available for bidding now.", "info");
      return;
    }

    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please Login",
        text: "You need to login to place a bid.",
        confirmButtonText: "Login",
        confirmButtonColor: "#dc2626",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }

    if (userBidAmount < nextMin) {
      Swal.fire({
        icon: "warning",
        title: "⚠️ Invalid Bid",
        text: `Minimum bid: ฿${nextMin.toLocaleString()}`,
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/bids/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productData.id,
          user_id: user.user_id,
          bid_amount: userBidAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Bid failed");

      Swal.fire({
        icon: "success",
        title: "✅ Bid Successful!",
        text: `You placed ฿${userBidAmount.toLocaleString()}`,
        timer: 2000,
        showConfirmButton: false,
      });

      setCurrentBid(userBidAmount);
      setNextMin(userBidAmount + MIN_INCREMENT);
      setUserBidAmount(userBidAmount + MIN_INCREMENT);
      setTotalBids((prev) => prev + 1);
    } catch (err) {
      Swal.fire("Bid Failed", err.message, "error");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">Product not found</p>
      </div>
    );
  }

  // ✅ Decode image
  const imgSrc = decodeImage(productData.product_img) 
    || `https://picsum.photos/seed/${productData.id}/400`;

  // ✅ Format start/end time for display
  const formatDateTime = (timeStr) => {
    if (!timeStr) return "--";
    try {
      const d = new Date(timeStr.replace(" ", "T"));
      return d.toLocaleString("th-TH", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-600 hover:text-red-500">
        ← Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LEFT */}
        <div className="border rounded-xl p-6 bg-gray-50 flex items-center justify-center">
          <img 
            src={imgSrc} 
            alt={productData.name} 
            className="max-w-full max-h-80 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://picsum.photos/seed/${productData.id}/400`;
            }}
          />
        </div>

        {/* RIGHT */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h1 className="text-3xl font-bold mb-2">{productData.name}</h1>
          <p className="text-sm text-gray-500 mb-1">Bidding ID: {productData.id}</p>
          <p className="text-xs text-gray-400 mb-3">
            {phase === "waiting" && `เริ่มประมูล: ${formatDateTime(productData.start_time)}`}
            {phase === "active" && `สิ้นสุด: ${formatDateTime(productData.end_time)}`}
            {phase === "ended" && `สิ้นสุดแล้ว: ${formatDateTime(productData.end_time)}`}
          </p>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Current Bid</p>
            <h2 className="text-3xl font-bold text-red-500">฿{currentBid.toLocaleString()}</h2>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Total Bids</p>
            <h3 className="text-xl font-semibold">{totalBids}</h3>
          </div>

          <div className="mb-2 text-sm">
            {phase === "waiting" && (
              <p className="text-yellow-600">⏳ รอเริ่มประมูล</p>
            )}
            {phase === "active" && (
              <p className="text-green-600 font-semibold">🔥 กำลังประมูล!</p>
            )}
            {phase === "ended" && (
              <p className="text-red-500">🏁 การประมูลสิ้นสุดแล้ว</p>
            )}
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2 mb-4">
            {["days", "hours", "minutes", "seconds"].map((unit, i) => (
              <div key={unit} className="flex items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                  ${phase === "active" ? "bg-green-600" : phase === "ended" ? "bg-gray-400" : "bg-red-600"}`}>
                  {formatTime(timeRemaining[unit])}
                </div>
                {i < 3 && <span className="text-lg">:</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {phase === "waiting" && "เวลาที่เหลือก่อนเริ่มประมูล"}
            {phase === "active" && "เวลาที่เหลือในการประมูล"}
            {phase === "ended" && "การประมูลสิ้นสุดแล้ว"}
          </p>

          {/* Bid Box */}
          {phase === "active" ? (
            <>
              <input
                type="number"
                step={MIN_INCREMENT}
                min={nextMin}
                value={userBidAmount}
                onChange={(e) => setUserBidAmount(Number(e.target.value))}
                className="w-full p-3 border-2 border-green-500 rounded-md text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum next bid: ฿{nextMin.toLocaleString()} (เพิ่มทีละ ฿{MIN_INCREMENT.toLocaleString()})
              </p>
              <button
                onClick={handleBidSubmit}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-md mt-4 hover:bg-green-700 font-semibold text-lg"
              >
                🎯 Place Bid — ฿{userBidAmount.toLocaleString()}
              </button>
            </>
          ) : phase === "waiting" ? (
            <div className="text-center text-yellow-600 mt-4 border border-yellow-300 bg-yellow-50 p-4 rounded-md">
              <p className="font-semibold">⏳ รอเริ่มประมูล</p>
              <p className="text-sm text-gray-500 mt-1">กรุณารอจนกว่าจะถึงเวลาเริ่มประมูล</p>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-4 border border-gray-200 bg-gray-50 p-4 rounded-md">
              <p className="font-semibold">🏁 การประมูลสิ้นสุดแล้ว</p>
              <p className="text-sm mt-1">ราคาสุดท้าย: ฿{currentBid.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 p-6 border rounded-xl">
        <h3 className="text-lg font-semibold mb-2">Product Description</h3>
        <p className="text-gray-600">{productData.description}</p>
      </div>
    </div>
  );
}