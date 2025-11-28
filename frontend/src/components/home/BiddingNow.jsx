// frontend/src/components/home/BiddingNow.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

// Helper: decode image from hex or base64
function decodeImage(raw) {
  if (!raw) return null;
  
  if (raw.startsWith("data:") || raw.startsWith("http")) {
    return raw;
  }
  
  // base64 ของรูปจริง
  if (raw.startsWith("/9j/") || raw.startsWith("iVBOR") || 
      raw.startsWith("R0lG") || raw.startsWith("UklG")) {
    return `data:image/jpeg;base64,${raw}`;
  }
  
  // hex string จาก Postgres
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

export default function BiddingNow() {
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [highestBid, setHighestBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);

  const tickRef = useRef(null);
  const refreshRef = useRef(null);

  // ----------------------------------------------------
  // Load current bidding-now product
  // ----------------------------------------------------
  async function loadNow() {
    try {
      const res = await fetch(`${API_BASE_URL}/products/bidding-now`);
      const data = await res.json();

      console.log("🔥 bidding-now =", data);
      
      if (data.bidding_now) {
        setItem(data.bidding_now);
        setTimeLeft(data.time_remaining_seconds || 60);
        
        // Load highest bid for this product
        loadHighestBid(data.bidding_now.product_id);
      } else {
        setItem(null);
      }
    } catch (err) {
      console.log("❌ Error loading bidding-now", err);
    }
  }

  // ----------------------------------------------------
  // Load highest bid for current product
  // ----------------------------------------------------
  async function loadHighestBid(productId) {
    try {
      const res = await fetch(`${API_BASE_URL}/bids/${productId}/highest`);
      const data = await res.json();
      
      if (data.highest_bid) {
        setHighestBid(data.highest_bid);
        setHighestBidder(data.user_id || null);
      }
    } catch (err) {
      console.log("Error loading highest bid:", err);
    }
  }

  // ----------------------------------------------------
  // Check if auction ended and determine winner
  // ----------------------------------------------------
  async function checkAuctionEnd() {
    if (!item) return;
    
    // ถ้าหมดเวลา
    if (timeLeft !== null && timeLeft <= 0) {
      console.log("⏰ Auction ended for:", item.product_id);
      
      try {
        // เรียก API เพื่อ finalize auction และหาผู้ชนะ
        const res = await fetch(`${API_BASE_URL}/products/finalize/${item.product_id}`, {
          method: 'POST'
        });
        const data = await res.json();
        
        console.log("Finalize result:", data);
        
        // Reload เพื่อดึงสินค้าถัดไป
        loadNow();
      } catch (err) {
        console.error("Error finalizing auction:", err);
        loadNow();
      }
    }
  }

  // ----------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------
  useEffect(() => {
    loadNow();

    // Countdown timer
    tickRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    // Refresh data ทุก 10 วินาที
    refreshRef.current = setInterval(() => {
      loadNow();
    }, 10000);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(refreshRef.current);
    };
  }, []);

  // Check auction end when timeLeft changes
  useEffect(() => {
    if (timeLeft === 0) {
      checkAuctionEnd();
    }
  }, [timeLeft]);

  // Refresh highest bid ทุก 5 วินาที
  useEffect(() => {
    if (!item) return;
    
    const bidInterval = setInterval(() => {
      loadHighestBid(item.product_id);
    }, 5000);
    
    return () => clearInterval(bidInterval);
  }, [item?.product_id]);

  // ----------------------------------------------------
  // Navigate to auction detail
  // ----------------------------------------------------
  const handleClick = () => {
    navigate(`/auction/${item.product_id}`, {
      state: { productData: item },
    });
  };

  // ----------------------------------------------------
  // Format countdown
  // ----------------------------------------------------
  const formatCountdown = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ----------------------------------------------------
  // UI - No active auction
  // ----------------------------------------------------
  if (!item) {
    return (
      <div className="px-8 pt-12 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded">
            Live
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Now Bidding</h2>
        </div>
        <section className="bg-white rounded-2xl shadow-md max-w-6xl mx-auto p-10 text-center">
          <p className="text-gray-500">No active auction right now.</p>
        </section>
      </div>
    );
  }

  // ----------------------------------------------------
  // Decode image
  // ----------------------------------------------------
  const imgSrc = decodeImage(item.product_img) 
    || `https://picsum.photos/seed/${item.product_id}/800/400`;

  // ----------------------------------------------------
  // UI - Active auction
  // ----------------------------------------------------
  return (
    <div className="px-8 pt-12 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded animate-pulse">
          Live
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Now Bidding</h2>
      </div>

      <section className="bg-white rounded-2xl shadow-md overflow-hidden max-w-6xl mx-auto">
        {/* TOP IMAGE */}
        <div
          className="w-full h-[300px] sm:h-[350px] md:h-[380px] overflow-hidden cursor-pointer"
          onClick={handleClick}
        >
          <img
            src={imgSrc}
            alt={item.product_name}
            className="w-full h-full object-cover hover:scale-105 transition duration-300"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://picsum.photos/seed/${item.product_id}/800/400`;
            }}
          />
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold animate-pulse">
              Now Live
            </span>
            <h3 className="text-3xl font-bold">{item.product_name}</h3>
          </div>
          
          <p className="text-gray-600 text-base">
            {item.product_desc || "No description available."}
          </p>
          
          <div className="flex items-center gap-16 mt-4">
            <div>
              <p className="text-sm text-gray-500">Start Price</p>
              <p className="text-xl font-bold text-gray-700">
                ฿{Number(item.start_price).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Bid</p>
              <p className="text-xl font-bold text-red-600">
                ฿{(highestBid || item.start_price).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Left</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCountdown(timeLeft)}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClick}
            className="mt-6 bg-black text-white px-8 py-3 rounded-lg text-base hover:bg-gray-900 transition"
          >
            Place Bid →
          </button>
        </div>
      </section>
    </div>
  );
}