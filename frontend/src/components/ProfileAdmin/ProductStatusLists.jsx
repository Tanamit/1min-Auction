import { useEffect, useRef, useState } from "react";
import { getProductStatusList } from "../../services/ProfileAdmin/productAdminService";

/* ---------- money + date ---------- */

const money = (n) => `฿${Number(n ?? 0).toLocaleString()}`;

const formatDMY = (iso) => {
  if (!iso) return "-";
  const d = iso.includes("T")
    ? new Date(iso)
    : new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/* ---------- image helpers (simplified from ProductLists.jsx) ---------- */

// detect MIME from first bytes
const mimeFromBytes = (u8) => {
  if (u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff)
    return "image/jpeg";
  if (
    u8.length >= 8 &&
    u8[0] === 0x89 &&
    u8[1] === 0x50 &&
    u8[2] === 0x4e &&
    u8[3] === 0x47
  )
    return "image/png";
  if (u8.length >= 3 && u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46)
    return "image/gif";
  if (
    u8.length >= 12 &&
    u8[0] === 0x52 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x46 &&
    u8[8] === 0x57 &&
    u8[9] === 0x45 &&
    u8[10] === 0x42 &&
    u8[11] === 0x50
  )
    return "image/webp";
  return "image/jpeg";
};

const hexToU8 = (hex) => {
  const clean = hex.replace(/(\\\\x|\\x|0x)/gi, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
};

const base64MimeHint = (b64) => {
  if (!b64) return "image/jpeg";
  const c = b64[0];
  if (c === "i") return "image/png"; // iVBOR... (PNG)
  if (c === "/") return "image/jpeg"; // /9j/... (JPEG)
  if (c === "R") return "image/gif"; // R0lG... (GIF)
  if (c === "U") return "image/webp"; // UklG... (WEBP)
  return "image/jpeg";
};

const isValidImageBase64 = (b64) => {
  if (!b64 || typeof b64 !== "string") return false;
  const validPrefixes = ["/9j/", "iVBOR", "R0lG", "UklG"];
  return validPrefixes.some((p) => b64.startsWith(p));
};

/** normalize product_img into a src string usable by <img> */
const toThumbSrc = (raw, trackUrl) => {
  if (!raw || typeof raw !== "string") return null;

  // already data URL
  if (raw.startsWith("data:")) return raw;

  // hex from bytea
  if (/^(\\\\x|\\x|0x)/i.test(raw)) {
    try {
      const u8 = hexToU8(raw);
      const mime = mimeFromBytes(u8);
      const url = URL.createObjectURL(new Blob([u8], { type: mime }));
      trackUrl && trackUrl(url);
      return url;
    } catch (e) {
      console.error("Error converting hex to image:", e);
      return null;
    }
  }

  // bare base64
  if (isValidImageBase64(raw)) {
    const mime = base64MimeHint(raw);
    return `data:${mime};base64,${raw}`;
  }

  return null;
};

const PlaceholderImage = ({ name }) => (
  <div className="w-16 h-16 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center">
    <span className="text-gray-400 text-sm font-medium">
      {name ? name.charAt(0).toUpperCase() : "?"}
    </span>
  </div>
);

/* ---------- status badge ---------- */

function mapStatusId(statusId) {
  switch (statusId) {
    case 2:
      return "Validated";
    case 4:
      return "Deleted";
    case 6:
      return "Refunded";
    case 7:
      return "Canceled";
    case 8:
      return "Bidding";
    case 9:
      return "Delivered";
    default:
      return "Unvalidated";
  }
}

function StatusBadge({ status }) {
  if (status === "Validated")
    return <span className="text-green-600 font-semibold">Validated</span>;
  if (status === "Deleted")
    return <span className="text-red-600 font-semibold">Deleted</span>;
  if (status === "Canceled")
    return <span className="text-red-600 font-semibold">Canceled</span>;
  if (status === "Bidding")
    return <span className="text-blue-600 font-semibold">Bidding</span>;
  if (status === "Delivered")
    return <span className="text-green-600 font-semibold">Delivered</span>;
  if (status === "Refunded")
    return <span className="text-yellow-600 font-semibold">Refunded</span>;
  if (status === "Unvalidated")
    return <span className="text-red-600 font-semibold">Unvalidated</span>;
  return <span className="text-red-500">Unvalidated</span>;
}

/* ---------- main component ---------- */

export default function ProductStatusLists() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const blobUrlsRef = useRef(new Set());

  // cleanup blob URLs
  useEffect(() => {
    return () => {
      for (const u of blobUrlsRef.current) URL.revokeObjectURL(u);
      blobUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await getProductStatusList();

        if (cancelled) return;
        const rows = res?.items ?? [];

        const mapped = rows.map((row) => {
          const imgSrc = toThumbSrc(row.product_img, (url) =>
            blobUrlsRef.current.add(url)
          );
          return {
            id: row.id,
            name: row.name,
            price: row.price,
            dateAdded: row.start_time,
            statusId: row.status_id,
            status: mapStatusId(row.status_id),
            imageSrc: imgSrc,
          };
        });

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
                  {p.imageSrc ? (
                    <img
                      src={p.imageSrc}
                      alt={p.name}
                      className="w-16 h-16 rounded-md object-cover border"
                    />
                  ) : (
                    <PlaceholderImage name={p.name} />
                  )}
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
