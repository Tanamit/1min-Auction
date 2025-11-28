import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config/api";

const MIN_INCREMENT = 500;
const TEMP_USER_ID = "ce729402-fcac-4c62-868d-3d04800c5db7";

// ----------------------------------------
// Decode Supabase bytea image
// ----------------------------------------
function decodeImage(hex) {
  try {
    if (!hex || !hex.startsWith("\\x")) return null;
    const buffer = Buffer.from(hex.replace("\\x", ""), "hex");
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default function Bidding() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [imageURL, setImageURL] = useState(null);

  const [highestBid, setHighestBid] = useState(0);
  const [totalBids, setTotalBids] = useState(0);

  const [bidAmount, setBidAmount] = useState(0);

  const [time, setTime] = useState({ hr: "00", min: "00", sec: "00", ms: "00" });
  const [canBid, setCanBid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [auctionEnded, setAuctionEnded] = useState(false);

  const countdownColor = canBid ? "bg-red-500" : "bg-yellow-500";

  // ============================================================
  // LOAD PRODUCT
  // ============================================================
  async function loadProduct() {
    try {
      const res = await fetch(`${API_BASE_URL}/bids/product/${productId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setProduct(data);

      if (data.product_img) {
        setImageURL(decodeImage(data.product_img));
      }

      setHighestBid(parseFloat(data.start_price));
      setBidAmount(parseFloat(data.start_price) + MIN_INCREMENT);

      setupCountdown(data.start_time, data.end_time, data.virtual_now);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD BIDS — REAL TIME
  // ============================================================
  async function loadBids() {
    if (!product) return;

    try {
      // GET HIGHEST BID
      const highest = await fetch(`${API_BASE_URL}/bids/product/${productId}/highest`);
      const highestData = await highest.json();

      let newHighest = parseFloat(highestData.highest_bid);
      if (isNaN(newHighest)) newHighest = parseFloat(product.start_price);

      setHighestBid(newHighest);

      // GET TOTAL BIDS
      const all = await fetch(`${API_BASE_URL}/bids/product/${productId}/bids`);
      const allData = await all.json();
      setTotalBids(allData.total_bids || 0);

      // Update next minimum bid
      setBidAmount((newHighest + MIN_INCREMENT).toFixed(2));

    } catch (err) {
      console.log("Load bids error:", err);
    }
  }

  // ============================================================
  // COUNTDOWN ENGINE
  // ============================================================
  function setupCountdown(startTime, endTime, virtualNowStr) {
    if (!startTime || !endTime || !virtualNowStr) return;

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    let virtualNow = new Date(virtualNowStr).getTime();

    const timer = setInterval(() => {
      virtualNow += 100;

      // BEFORE START → NOT AVAILABLE
      if (virtualNow < start) {
        const diff = start - virtualNow;
        updateTimer(diff);
        setCanBid(false);
      }

      // AFTER END → FINISH
      else if (virtualNow >= end) {
        updateTimer(0);
        setCanBid(false);
        clearInterval(timer);
        setAuctionEnded(true);
      }

      // DURING AUCTION
      else {
        const diff = end - virtualNow;
        updateTimer(diff);
        setCanBid(true);
      }
    }, 100);
  }

  function updateTimer(diff) {
    const hr = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const min = String(Math.floor((diff / 60000) % 60)).padStart(2, "0");
    const sec = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
    const ms = String(Math.floor((diff % 1000) / 10)).padStart(2, "0");

    setTime({ hr, min, sec, ms });
  }

  // ============================================================
  // SUBMIT BID
  // ============================================================
  async function submitBid() {
    if (!canBid) {
      return Swal.fire("Not Available", "This item is not available right now.", "warning");
    }

    if (!bidAmount || parseFloat(bidAmount) <= highestBid) {
      return Swal.fire("Bid too low", `Bid must be > ฿${highestBid}`, "error");
    }

    try {
      const res = await fetch(`${API_BASE_URLPI}/bids/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          bidder_id: TEMP_USER_ID,
          bid_amount: parseFloat(bidAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      Swal.fire("Success", "Bid submitted!", "success");
      await loadBids();

    } catch (err) {
      Swal.fire("Bid Failed", err.message, "error");
    }
  }

  // ============================================================
  // WINNER POPUP
  // ============================================================
  useEffect(() => {
    if (!auctionEnded) return;

    async function checkWinner() {
      const res = await fetch(`${API_BASE_URL}/bids/product/${productId}/highest`);
      const data = await res.json();

      const winnerId = data?.data?.bidder_id;

      if (!winnerId) {
        Swal.fire("Auction ended", "No winning bid for this item.", "info");
        return;
      }

      if (winnerId === TEMP_USER_ID) {
        Swal.fire("🎉 Congratulations!", "You won this auction!", "success")
          .then(() => {
            // ส่งแค่ productId และ userId
            navigate(`/payment/${productId}?userId=${TEMP_USER_ID}`);
          });
      } else {
        Swal.fire("Auction ended", "You did not win this item.", "info");
      }
    }

    checkWinner();
  }, [auctionEnded]);

  // ============================================================
  // AUTO REFRESH BIDS EVERY 1 SEC
  // ============================================================
  useEffect(() => {
    const interval = setInterval(loadBids, 1000);
    return () => clearInterval(interval);
  }, [product]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  useEffect(() => { loadProduct(); }, []);

  if (loading || !product) return <p className="text-center p-10">Loading...</p>;

  const showStartsAt = totalBids === 0;

  // ============================================================
  // RENDER UI
  // ============================================================
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{product.product_name}</h1>
      <p className="text-gray-600 mb-4">Bidding ID: <span className="font-mono">{product.product_id}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* IMAGE */}
        <div className="border rounded-xl p-6 bg-gray-50 flex items-center justify-center">
          {imageURL ? (
            <img src={imageURL} alt="" className="max-w-full max-h-80 object-cover rounded-lg" />
          ) : (
            <p className="text-gray-500">Main Product Image (Coming Soon)</p>
          )}
        </div>

        {/* BIDDING PANEL */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">

          <p className="text-sm">
            {showStartsAt ? "Starts at" : "Current Bid"}
          </p>

          <h2 className={`text-3xl font-bold mb-3 ${showStartsAt ? "text-black" : "text-red-500"}`}>
            ฿{highestBid.toLocaleString()}
          </h2>

          <p className="text-sm">Total Bids</p>
          <h3 className="text-xl font-semibold mb-4">{totalBids}</h3>

          {/* TIME */}
          <p className="text-sm font-medium mb-1">Time Remaining</p>
          <div className="flex items-center gap-3 mb-4">
            {[time.hr, time.min, time.sec, time.ms].map((v, i) => (
              <div key={i}
                className={`w-16 h-16 ${countdownColor} text-white rounded-full flex items-center justify-center text-xl font-bold`}>
                {v}
              </div>
            ))}
          </div>

          {/* BID INPUT */}
          <p className="text-sm font-semibold mb-2">Your Bid Amount</p>

          <div className="flex items-center gap-3 mb-1">
            <input
              type="number"
              className="w-full p-3 border rounded-lg"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              disabled={!canBid}
            />

            <button
              onClick={() => setBidAmount(prev => Number(prev) + MIN_INCREMENT)}
              disabled={!canBid}
              className={`px-4 py-2 rounded-lg text-lg font-bold ${canBid ? "bg-black text-white" : "bg-gray-300 text-gray-500"
                }`}
            >
              +{MIN_INCREMENT}
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Minimum increment: ฿{MIN_INCREMENT.toLocaleString()}
          </p>

          <button
            onClick={submitBid}
            disabled={!canBid}
            className={`w-full py-3 rounded-lg text-lg ${canBid ? "bg-black text-white" : "bg-gray-300 text-gray-500"
              }`}
          >
            {canBid
              ? `Place Bid — ฿${Number(bidAmount).toLocaleString()}`
              : "This item is not available now"}
          </button>
        </div>
      </div>
    </div>
  );
}