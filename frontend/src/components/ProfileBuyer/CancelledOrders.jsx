import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";


const PLACEHOLDER = "https://via.placeholder.com/200x200?text=No+Image";

export default function CancelledOrders() {
  const { user } = useAuth();
  const userId = user?.user_id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/buyer/orders?status=cancelled`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-User-Id": userId,
            },
          }
        );
        const data = await res.json();
        setOrders(data);
      } catch (e) {
        console.error(e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) return <div>Loading…</div>;

  return (
    <div className="bg-white p-8 rounded shadow">
      <h3 className="text-xl font-medium mb-4">Cancelled Orders</h3>

      {orders.length === 0 && <div>No cancelled orders.</div>}

      <div className="space-y-4">
        {orders.map((o) => (
          <div
            key={o.productId}
            className="flex flex-col sm:flex-row gap-4 border p-3 rounded"
          >
            <img
              src={o.thumbnailUrl || PLACEHOLDER}
              className="w-20 h-20 object-contain bg-gray-50 rounded"
            />

            <div className="flex-1">
              <div className="font-medium">{o.productName}</div>
              <div className="text-sm text-gray-600">
                Cancelled at:{" "}
                {o.cancelledAt
                  ? new Date(o.cancelledAt).toLocaleString()
                  : "—"}
              </div>

              <div className="mt-2 grid sm:grid-cols-3 gap-2">
                <div>
                  <div className="text-xs text-gray-500">Product ID</div>
                  <div>{o.productId}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Final price</div>
                  <div className="text-red-500 font-semibold">
                    ฿{o.finalPrice}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-red-500 font-semibold">Refunded</div>
          </div>
        ))}
      </div>
    </div>
  );
}
