// frontend/src/components/ProfileAdmin/ProductStatusLists.jsx
import { useEffect, useState } from "react";
import { getProductStatusList } from "../../services/ProfileAdmin/ProfileAdminService";

const money = (n) => `฿${Number(n ?? 0).toLocaleString()}`;

const formatDMY = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

function mapStatusId(statusId) {
  switch (statusId) {
    case 2:
      return "validated"; // Ready / verified
    case 8:
      return "confirmed"; // Bidding / active
    case 4:
      return "deleted"; // Finished / completed (use your own label if you prefer)
    default:
      return "pending";
  }
}

function StatusBadge({ status }) {
  if (status === "validated")
    return <span className="text-blue-600 font-semibold">Validated</span>;
  if (status === "rejected")
    return <span className="text-red-600 font-semibold">Rejected</span>;
  if (status === "deleted")
    return <span className="text-red-600 font-semibold">Completed</span>;
  if (status === "confirmed")
    return <span className="text-green-600 font-semibold">Bidding</span>;
  if (status === "refunded")
    return <span className="text-yellow-600 font-semibold">Refunded</span>;

  return <span className="text-gray-500">Pending</span>;
}

export default function ProductStatusLists() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getProductStatusList();
        if (cancelled) return;

        const rows = res?.items ?? [];

        const mapped = rows.map((row) => ({
          id: row.id,
          name: row.name,
          price: row.price,
          dateAdded: row.start_time,
          statusId: row.status_id,
          status: mapStatusId(row.status_id),
          // If you later store base64 images, convert here
          image: "/placeholder-product.png",
        }));

        setProducts(mapped);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err.message || "Failed to load product status list");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Product Status List
        </h2>
        <p className="text-sm text-gray-500">
          Showing product status from Supabase (role: Admin).
        </p>
      </header>

      {loading && (
        <div className="py-10 text-center text-gray-500">Loading...</div>
      )}

      {error && !loading && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-10 text-center text-gray-500">
          No products found.
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 items-center bg-white shadow-sm px-4 md:px-6 py-4 rounded-md"
            >
              <div className="col-span-6 flex items-center gap-4">
                <div className="relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-16 h-16 rounded-md object-cover border"
                  />
                  {p.status === "pending" && (
                    <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow">
                      !
                    </span>
                  )}
                </div>
                <div className="leading-tight">
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500">
                    ID: <span className="font-mono">{p.id}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-2 text-gray-800">
                {money(p.price)}
              </div>
              <div className="col-span-2 text-gray-700">
                {formatDMY(p.dateAdded)}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
