import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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
  
  // ถ้าเป็น data URL หรือ http URL แล้ว
  if (raw.startsWith("data:") || raw.startsWith("http")) {
    return raw;
  }
  
  // ถ้าเป็น base64 ของรูปจริง (JPEG/PNG/GIF/WEBP)
  if (raw.startsWith("/9j/") || raw.startsWith("iVBOR") || 
      raw.startsWith("R0lG") || raw.startsWith("UklG")) {
    return `data:image/jpeg;base64,${raw}`;
  }
  
  // ถ้าเป็น hex string จาก Postgres bytea
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

  const raw = location.state?.productData || {};
  const productData = {
    id: raw.product_id || productId,
    name: raw.product_name || raw.name || "Unnamed Product",
    description: raw.product_desc || raw.description || "No description available.",
    startPrice: raw.start_price || raw.startPrice || 0,
    start_time: raw.start_time || null,
    end_time: raw.end_time || null,
    listedBy: raw.seller_id || raw.listedBy || "Unknown",
    product_img: raw.product_img || null,
  };

  const [currentBid, setCurrentBid] = useState(productData.startPrice);
  const [totalBids, setTotalBids] = useState(0);
  const [userBidAmount, setUserBidAmount] = useState(productData.startPrice + MIN_INCREMENT);
  const [nextMin, setNextMin] = useState(productData.startPrice + MIN_INCREMENT);
  const [timeRemaining, setTimeRemaining] = useState({});
  const [phase, setPhase] = useState("waiting"); // waiting | active | ended

  // ✅ Load current highest bid
  useEffect(() => {
    async function loadHighest() {
      try {
        const res = await fetch(`${API_BASE_URL}/bids/${productId}/highest`);
        const data = await res.json();
        const highest = data.highest_bid || productData.startPrice;
        setCurrentBid(highest);
        setNextMin(highest + MIN_INCREMENT);
        setUserBidAmount(highest + MIN_INCREMENT);
      } catch (err) {
        console.error("❌ Failed to load highest bid:", err);
        setCurrentBid(productData.startPrice);
      }
    }
    loadHighest();
  }, [productId]);

  // ✅ Real Clock + Phase Detection
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      // Parse start_time และ end_time
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
        setPhase("waiting");
        setTimeRemaining(computeRemainingTime(start, now));
      } else if (now >= start && now < end) {
        setPhase("active");
        setTimeRemaining(computeRemainingTime(end, now));
      } else {
        setPhase("ended");
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [productData.start_time, productData.end_time]);

  const formatTime = (t) => String(t ?? 0).padStart(2, "0");

  // ✅ Submit bid
  const handleBidSubmit = async () => {
    if (phase !== "active") {
      Swal.fire("⚠️ Not Available", "This item is not available for bidding now.", "info");
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
          user_id: "demo-user-1",
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

  // ✅ Decode image
  const imgSrc = decodeImage(productData.product_img) 
    || `https://picsum.photos/seed/${productData.id}/400`;

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
          <p className="text-sm text-gray-500 mb-3">Bidding ID: {productData.id}</p>

          <div className="mb-4">
            <p className="text-sm">Current Bid</p>
            <h2 className="text-3xl font-bold text-red-500">฿{currentBid.toLocaleString()}</h2>
          </div>

          <div className="mb-4">
            <p className="text-sm">Total Bids</p>
            <h3 className="text-xl font-semibold">{totalBids}</h3>
          </div>

          <div className="mb-2 text-sm text-gray-700">
            {phase === "waiting" && <p>⏳ Auction will start soon</p>}
            {phase === "active" && <p>🔥 Auction live now</p>}
            {phase === "ended" && <p className="text-red-500">Auction ended</p>}
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2 mb-4">
            {["days", "hours", "minutes", "seconds"].map((unit, i) => (
              <div key={unit} className="flex items-center gap-2">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                  {formatTime(timeRemaining[unit])}
                </div>
                {i < 3 && <span className="text-lg">:</span>}
              </div>
            ))}
          </div>

          {/* Bid Box */}
          {phase === "active" ? (
            <>
              <input
                type="number"
                step={MIN_INCREMENT}
                min={nextMin}
                value={userBidAmount}
                onChange={(e) => setUserBidAmount(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum next bid: ฿{nextMin.toLocaleString()}
              </p>
              <button
                onClick={handleBidSubmit}
                className="w-full bg-black text-white py-3 px-6 rounded-md mt-4 hover:bg-gray-800"
              >
                Place Bid — ฿{userBidAmount.toLocaleString()}
              </button>
            </>
          ) : (
            <p className="text-center text-gray-500 mt-4 border border-gray-200 p-3 rounded-md">
              This item is not available now
            </p>
          )}
        </div>
      </div>
    </div>
  );
}