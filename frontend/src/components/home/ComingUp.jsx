import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const PLACEHOLDER = "https://via.placeholder.com/300x200?text=No+Image";

// ----------------------------------------------------
// Decode Postgres bytea hex -> object URL (JPEG)
// หรือถ้าเป็น base64 ก็แสดงได้เลย
// ----------------------------------------------------
function decodeImage(raw) {
  try {
    if (!raw) return null;
    
    // ถ้าเป็น base64 ของรูปจริง (JPEG/PNG/GIF/WEBP)
    if (raw.startsWith("/9j/") || raw.startsWith("iVBOR") || 
        raw.startsWith("R0lG") || raw.startsWith("UklG")) {
      return `data:image/jpeg;base64,${raw}`;
    }
    
    // ถ้าเป็น hex string จาก Postgres bytea
    let h = raw;
    if (h.startsWith("\\x")) h = h.slice(2);
    else if (h.startsWith("\\\\x")) h = h.slice(3);
    
    if (!/^[0-9a-fA-F]+$/.test(h)) return null;
    
    const bytes = new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    return URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
  } catch {
    return null;
  }
}

export default function ComingUp() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(5);
  const [showAll, setShowAll] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);

  // ----------------------------------------------
  // Initial load + auto refresh every minute
  // ----------------------------------------------
  useEffect(() => {
    loadUpcoming();
    const timer = setInterval(() => {
      setCountdown(t => {
        if (t <= 1) {
          loadUpcoming(selectedCat);
          return 60;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCat]);

  // Listen for external category changes
  useEffect(() => {
    const handler = (e) => {
      const raw = e.detail?.productCatId;
      const val = raw === null || raw === undefined || raw === "" ? null : Number(raw);
      setSelectedCat(Number.isNaN(val) ? null : val);
      setSlideIndex(0);
    };
    window.addEventListener("categoryFilterChange", handler);
    return () => window.removeEventListener("categoryFilterChange", handler);
  }, []);

  async function loadUpcoming(catId = null) {
    try {
      const url = `${API_BASE_URL}/products/upcoming?limit=60${catId != null ? `&product_cat_id=${catId}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      
      // เรียงตาม start_time (ใกล้ถึงเวลาประมูลก่อน)
      const sortedItems = (json.items || []).sort((a, b) => {
        const timeA = new Date(a.start_time?.replace(" ", "T") || 0);
        const timeB = new Date(b.start_time?.replace(" ", "T") || 0);
        return timeA - timeB;
      });
      
      setItems(sortedItems);
      
      if (json.current_time) {
        setCountdown(secondsToNextMinute(json.current_time));
      } else {
        setCountdown(60);
      }
      setSlideIndex(0);
    } catch (e) {
      console.error("Upcoming load failed", e);
    }
  }

  // ----------------------------------------------
  // Compute seconds until next minute
  // ----------------------------------------------
  function secondsToNextMinute(timeStr) {
    if (!timeStr) return 60;
    const t = new Date(timeStr.replace(" ", "T"));
    if (isNaN(t.getTime())) return 60;
    return Math.max(0, 60 - t.getSeconds());
  }

  // ----------------------------------------------
  // Format time for display (เวลาไทย)
  // ----------------------------------------------
  function formatTime(timeStr) {
    if (!timeStr) return "--:--";
    try {
      const d = new Date(timeStr.replace(" ", "T"));
      return d.toLocaleTimeString("th-TH", { 
        hour: "2-digit", 
        minute: "2-digit",
        hour12: false 
      });
    } catch {
      return timeStr.slice(11, 16);
    }
  }

  // ----------------------------------------------
  // Format date and time (เวลาไทย)
  // ----------------------------------------------
  function formatDateTime(timeStr) {
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
  }

  // ----------------------------------------------
  // Calculate time until auction starts
  // ----------------------------------------------
  function getTimeUntilStart(timeStr) {
    if (!timeStr) return null;
    try {
      const start = new Date(timeStr.replace(" ", "T"));
      const now = new Date();
      const diff = start - now;
      
      if (diff <= 0) return "กำลังประมูล";
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      
      if (days > 0) return `อีก ${days} วัน ${hours} ชม.`;
      if (hours > 0) return `อีก ${hours} ชม. ${minutes} นาที`;
      return `อีก ${minutes} นาที`;
    } catch {
      return null;
    }
  }

  // ----------------------------------------------
  // Responsive columns
  // ----------------------------------------------
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1200) setItemsPerRow(5);
      else if (w >= 992) setItemsPerRow(4);
      else if (w >= 768) setItemsPerRow(3);
      else if (w >= 576) setItemsPerRow(2);
      else setItemsPerRow(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Client-side filter
  const filtered = selectedCat == null
    ? items
    : items.filter(p => Number(p.product_cat_id) === Number(selectedCat));

  // ----------------------------------------------
  // Carousel slicing
  // ----------------------------------------------
  const maxSlide = Math.max(0, filtered.length - itemsPerRow);
  const visible = filtered.slice(slideIndex, slideIndex + itemsPerRow);
  const prevSlide = () => setSlideIndex(i => Math.max(0, i - 1));
  const nextSlide = () => setSlideIndex(i => Math.min(maxSlide, i + 1));

  // ----------------------------------------------
  // Helpers
  // ----------------------------------------------
  function formatCountdown(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function goDetail(item) {
    navigate(`/auction/${item.product_id}`, {
      state: { productData: item },
    });
  }

  // ----------------------------------------------
  // UI
  // ----------------------------------------------
  return (
    <div className="px-8 pt-12 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded">Today's</div>
        <h2 className="text-3xl font-bold text-gray-900">
          Upcoming Products
          {selectedCat != null && (
            <span className="ml-3 text-base text-red-600 font-medium">(Filtered)</span>
          )}
        </h2>
      </div>

      <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
        <span>
          Showing {filtered.length ? `${slideIndex + 1}-${Math.min(slideIndex + itemsPerRow, filtered.length)}` : "0-0"} of {filtered.length} upcoming
        </span>
        <span>Next refresh in: {formatCountdown(countdown)}</span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={prevSlide} disabled={slideIndex === 0}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border
          ${slideIndex === 0 ? "border-gray-200 text-gray-300" : "border-gray-300 hover:bg-red-500 hover:text-white"}`}>
          &lt;
        </button>
        <button onClick={nextSlide} disabled={slideIndex >= maxSlide}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border
          ${slideIndex >= maxSlide ? "border-gray-200 text-gray-300" : "border-gray-300 hover:bg-red-500 hover:text-white"}`}>
          &gt;
        </button>
        {selectedCat != null && (
          <button
            onClick={() => setSelectedCat(null)}
            className="ml-4 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4">
        {visible.map(prod => {
          const imgSrc = decodeImage(prod.product_img) || PLACEHOLDER;
          const timeUntil = getTimeUntilStart(prod.start_time);
          return (
            <div key={prod.product_id} onClick={() => goDetail(prod)}
              className="min-w-[240px] bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden">
              <div className="h-40 overflow-hidden relative">
                <img src={imgSrc} alt={prod.product_name}
                  className="w-full h-full object-cover hover:scale-105 transition" />
                {timeUntil && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {timeUntil}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm mb-1 line-clamp-1">{prod.product_name}</p>
                <p className="text-xs text-gray-500">เริ่มประมูล: {formatTime(prod.start_time)} น.</p>
                <p className="mt-1 text-red-600 text-sm font-bold">฿{Number(prod.start_price).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
        {!filtered.length && <div className="text-gray-500 text-sm">No upcoming products.</div>}
      </div>

      <div className="flex justify-center mt-6 mb-2">
        <button onClick={() => setShowAll(true)}
          className="bg-red-500 text-white px-10 py-4 rounded-lg font-semibold text-base hover:bg-red-600 transition">
          View All Upcoming
          <span className="block text-sm opacity-90 mt-1">({filtered.length} items)</span>
        </button>
      </div>

      {showAll && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-8 overflow-y-auto"
             onClick={() => setShowAll(false)}>
          <div className="bg-white rounded-2xl w-full max-w-6xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                All Upcoming ({filtered.length} items){selectedCat != null && " (Filtered)"}
              </h3>
              <button onClick={() => setShowAll(false)} className="text-gray-500 hover:text-red-600 text-2xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(prod => {
                const imgSrc = decodeImage(prod.product_img) || PLACEHOLDER;
                const timeUntil = getTimeUntilStart(prod.start_time);
                return (
                  <div key={prod.product_id}
                       onClick={() => { goDetail(prod); setShowAll(false); }}
                       className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden">
                    <div className="h-32 overflow-hidden relative">
                      <img src={imgSrc} alt={prod.product_name}
                           className="w-full h-full object-cover hover:scale-105 transition" />
                      {timeUntil && (
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {timeUntil}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-xs mb-1 line-clamp-1">{prod.product_name}</p>
                      <p className="text-[11px] text-gray-500">{formatDateTime(prod.start_time)}</p>
                      <p className="mt-1 text-red-600 text-xs font-bold">฿{Number(prod.start_price).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
              {!filtered.length && <div className="text-gray-500 text-sm col-span-full">No upcoming products.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}