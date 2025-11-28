// frontend/src/components/ProfileBuyer/CompletedOrders.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";


const PLACEHOLDER = "https://via.placeholder.com/200x200?text=No+Image";
const STATUS = "completed";

// -------------------------------------------------------------------
// Sorting: Unreceived at top, received at bottom
// -------------------------------------------------------------------
const sortOrders = (list) => {
  const priority = {
    completed: 0,   // ready to receive → top
    refunded: 1,    // cancelled but still visible → middle
    received: 2     // already received → bottom
  };

  return [...list].sort((a, b) => {
    const pa = priority[a.status] ?? 99;
    const pb = priority[b.status] ?? 99;
    return pa - pb;
  });
};

export default function CompletedOrders() {
  const { user } = useAuth();
  const userId = user?.user_id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const [modal, setModal] = useState({ open: false, title: "", message: "" });

  // -------------------------------------------------------------------
  // Load orders
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("You must be logged in to see your orders.");
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE_URL}/api/buyer/orders?status=${STATUS}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-User-Id": userId,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load completed orders");
        }

        const data = await res.json();
        if (cancelled) return;

        setOrders(sortOrders(Array.isArray(data) ? data : []));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Cannot load completed orders right now. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Helpers
  const formatPrice = (p) =>
    typeof p === "number" ? new Intl.NumberFormat("en-US").format(p) : p;

  const markImageFailed = (key) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  };

  const openModal = (title, message) =>
    setModal({ open: true, title, message });

  const closeModal = () => setModal({ open: false, title: "", message: "" });

  // -------------------------------------------------------------------
  // Mark as Received
  // -------------------------------------------------------------------
  const handleReceive = async (order) => {
    if (order.status !== "completed") return;

    if (!window.confirm("Confirm you have received this product?")) return;

    try {
      const id = order.productId;

      const res = await fetch(
        `${API_BASE_URL}/api/buyer/orders/${encodeURIComponent(id)}/receive`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
        }
      );

      if (!res.ok) throw new Error("Receive failed");

      const updated = await res.json(); // now status = received

      setOrders((prev) =>
        sortOrders(
          prev.map((o) => (o.productId === updated.productId ? updated : o))
        )
      );

      openModal(
        "Order Received",
        "Your order has been marked as received. Thank you for shopping!"
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update. Please try again.");
    }
  };

  // -------------------------------------------------------------------
  // Refund
  // -------------------------------------------------------------------
  const handleRefund = async (order) => {
    if (order.status !== "completed") return;

    if (!window.confirm("Are you sure you want to request a refund?")) return;

    try {
      const id = order.productId;

      const res = await fetch(
        `${API_BASE_URL}/api/buyer/orders/${encodeURIComponent(id)}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
        }
      );

      if (!res.ok) throw new Error("Refund failed");

      const updated = await res.json();

      // Remove refunded item from CompletedOrders page
      setOrders((prev) =>
        prev.filter((o) => o.productId !== updated.productId)
      );

      openModal(
        "Order Cancelled",
        "Your refund request has been submitted. Admin will contact you soon."
      );
    } catch (err) {
      console.error(err);
      alert("Failed to request refund.");
    }
  };

  // -------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------

  if (loading) return <div className="bg-white p-8 rounded shadow">Loading…</div>;

  return (
    <div className="bg-white p-8 rounded shadow relative">
      <h3 className="text-xl font-medium mb-4">Completed Orders</h3>

      {error && <div className="mb-4 text-sm text-yellow-700">{error}</div>}

      {orders.length === 0 ? (
        <div className="text-gray-500">No completed orders.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const key = o.productId;
            const imgFailed = Boolean(failedImages[key]);

            return (
              <div
                key={key}
                className="flex flex-col sm:flex-row items-center gap-4 border rounded p-3"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={o.thumbnailUrl || PLACEHOLDER}
                    alt={o.productName}
                    className="w-20 h-20 object-contain bg-gray-50 rounded"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PLACEHOLDER;
                      markImageFailed(key);
                    }}
                  />
                  {imgFailed && (
                    <div className="absolute left-0 top-0 bg-yellow-100 text-yellow-800 px-2 py-1 text-xs rounded">
                      Image unavailable
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Product name</div>
                      <div className="font-medium text-sm">
                        {o.productName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">Order date</div>
                      <div className="text-sm text-gray-600">
                        {o.purchasedAt
                          ? new Date(o.purchasedAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 mt-2">
                        Product ID
                      </div>
                      <div className="text-sm">{o.productId}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Quantity</div>
                      <div className="text-sm">{o.quantity ?? 1}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Final price</div>
                      <div className="text-sm text-red-500 font-semibold">
                        ฿{formatPrice(o.finalPrice)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm border rounded ${
                      o.status === "completed"
                        ? "text-white bg-red-500 hover:bg-red-600"
                        : "text-gray-500 bg-gray-100 cursor-not-allowed"
                    }`}
                    onClick={() => handleReceive(o)}
                    disabled={o.status !== "completed"}
                  >
                    {o.status === "received" ? "Received" : "Receive"}
                  </button>

                  {o.status === "completed" && (
                    <button
                      type="button"
                      className="px-3 py-1 text-sm border rounded text-red-500 bg-white hover:bg-red-50"
                      onClick={() => handleRefund(o)}
                    >
                      Refund
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h4 className="text-lg font-semibold mb-2">{modal.title}</h4>
            <p className="text-sm text-gray-700 mb-4">{modal.message}</p>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded bg-red-500 text-white hover:bg-red-600"
              onClick={closeModal}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
