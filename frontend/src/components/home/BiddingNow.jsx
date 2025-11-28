import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

export default function BiddingNow() {
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const tickRef = useRef(null);
  const refreshRef = useRef(null);
  const resyncRef = useRef(null);

  // ----------------------------------------------------
  // Load current bidding-now product
  // ----------------------------------------------------
  async function loadNow() {
    try {
      const res = await fetch(`${API_BASE_URL}/products/bidding-now`);
      const data = await res.json();

      console.log("🔥 bidding-now =", data);
      setItem(data.bidding_now || null);
    } catch (err) {
      console.log("❌ Error loading bidding-now", err);
    }
  }

  // ----------------------------------------------------
  // Sync virtual seconds
  // ----------------------------------------------------
  async function syncVirtualSecond() {
    try {
      const res = await fetch(`${API_BASE_URL}/products/time/virtual`);
      const data = await res.json();

      const sec = Number(data.seconds ?? 0);
      const remaining = (60 - (sec % 60)) % 60;
      setTimeLeft(remaining);
    } catch {
      const local = new Date().getSeconds();
      setTimeLeft((60 - (local % 60)) % 60);
    }
  }

  // ----------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------
  useEffect(() => {
    loadNow();
    syncVirtualSecond();

    tickRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);

    refreshRef.current = setInterval(loadNow, 60000);
    resyncRef.current = setInterval(syncVirtualSecond, 15000);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(refreshRef.current);
      clearInterval(resyncRef.current);
    };
  }, []);

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

  const imgSrc =
    item.product_img ||
    `https://picsum.photos/seed/${item.product_id}/800/400`;

  const handleClick = () =>
    navigate(`/bidding/${item.product_id}`, {
      state: { productData: item },
    });

  // ----------------------------------------------------
  // UI (Matches your screenshot EXACTLY)
  // ----------------------------------------------------

  return (
    <div className="px-8 pt-12 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded">
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
          />
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
              Now Live
            </span>
            <h3 className="text-3xl font-bold">{item.product_name}</h3>
          </div>
          <p className="text-gray-600 text-base">
            {item.product_desc || "All-day access included."}
          </p>
          <div className="flex items-center gap-16 mt-4">
            <div>
              <p className="text-sm text-gray-500">Start Price</p>
              <p className="text-xl font-bold text-red-600">
                ฿{Number(item.start_price).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Refresh</p>
              <p className="text-xl font-semibold">
                {timeLeft !== null ? `${timeLeft}s` : "--"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="mt-6 bg-black text-white px-8 py-3 rounded-lg text-base hover:bg-gray-900 transition"
          >
            Go To Auction →
          </button>
        </div>
      </section>
    </div>
  );
}