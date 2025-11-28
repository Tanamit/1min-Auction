import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";

/* ---------- image helpers ---------- */
// sniff MIME from magic numbers
const mimeFromBytes = (u8) => {
    if (u8.length >= 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return "image/jpeg";
    if (u8.length >= 8 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return "image/png";
    if (u8.length >= 3 && u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46) return "image/gif";
    if (
        u8.length >= 12 &&
        u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46 &&
        u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50
    ) return "image/webp";
    return "image/jpeg";
};

const hexToU8 = (hex) => {
    const clean = hex.replace(/^\\x/i, "").replace(/^0x/i, "");
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    return bytes;
};

const base64MimeHint = (b64) => {
    if (!b64) return "image/jpeg";
    const c = b64[0];
    if (c === "i") return "image/png";     // iVBOR... (PNG)
    if (c === "/") return "image/jpeg";    // /9j/... (JPEG)
    if (c === "R") return "image/gif";     // R0lG... (GIF)
    if (c === "U") return "image/webp";    // UklG... (WEBP)
    return "image/jpeg";
};

/** normalize product_img into a src string usable by <img> */
const toThumbSrc = (raw, trackUrl) => {
    if (!raw || typeof raw !== "string") return null;

    // already data URL
    if (raw.startsWith("data:")) return raw;

    // hex from PostgREST bytea (e.g., "\\x89504e47...")
    if (raw.startsWith("\\x") || raw.startsWith("0x")) {
        const u8 = hexToU8(raw);
        const mime = mimeFromBytes(u8);
        const url = URL.createObjectURL(new Blob([u8], { type: mime }));
        trackUrl && trackUrl(url);
        return url;
    }

    // assume plain base64
    const mime = base64MimeHint(raw);
    return `data:${mime};base64,${raw}`;
};

/* ---------- other helpers ---------- */
const formatTHB = (n) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n ?? 0);

const toLocalString = (utcStrOrNaive) => {
    if (!utcStrOrNaive) return "-";
    // backend sends "YYYY-MM-DD HH:MM:SS" (UTC naive) — treat as UTC
    const d = utcStrOrNaive.includes("T")
        ? new Date(utcStrOrNaive)
        : new Date(utcStrOrNaive.replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const StatusBadge = ({ status_id }) => {
    const map = {
        1: { label: "Normal", bg: "bg-gray-100", text: "text-gray-800" },
        2: { label: "Verified", bg: "bg-green-100", text: "text-green-800" },
        3: { label: "Inactive", bg: "bg-gray-100", text: "text-gray-600" },
    };
    const s = map[status_id] ?? map[1];
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
};

export default function ProductLists() {
    const { user } = useAuth();

    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [filter, setFilter] = useState("all"); // all | 1 | 2 | 3
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // track created object URLs to revoke later
    const blobUrlsRef = useRef(new Set());
    const trackBlobUrl = (u) => blobUrlsRef.current.add(u);

    // revoke any blob URLs on unmount or when list changes
    useEffect(() => {
        return () => {
            for (const u of blobUrlsRef.current) URL.revokeObjectURL(u);
            blobUrlsRef.current.clear();
        };
    }, []);
    useEffect(() => {
        for (const u of blobUrlsRef.current) URL.revokeObjectURL(u);
        blobUrlsRef.current.clear();
    }, [items]);

    const catName = useMemo(() => {
        const m = new Map();
        categories.forEach((c) => m.set(c.category_id, c.category_name));
        return (id) => m.get(id) || "-";
    }, [categories]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/seller/categories`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Failed to load categories");
                setCategories(data);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    const fetchProducts = async () => {
        if (!user?.user_id) return;
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("page_size", String(pageSize));
            if (searchTerm.trim()) params.set("search", searchTerm.trim());
            if (filter !== "all") params.set("status_id", filter);

            const url = `${API_BASE_URL}/api/seller/products?${params.toString()}`;
            const res = await fetch(url, { headers: { "X-User-Id": user.user_id } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to load products");
            setItems(data.items || []);
            setTotal(data.total || 0);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.user_id, page]);

    const onSearch = async (e) => {
        e?.preventDefault?.();
        setPage(1);
        await fetchProducts();
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="bg-white shadow-sm rounded-lg p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-red-500">Product Lists</h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 mb-1">Total Products</p>
                    <p className="text-2xl font-bold text-blue-900">{total}</p>
                </div>
            </div>

            {/* Filters + Search */}
            <form onSubmit={onSearch} className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search name or description…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                    <option value="all">All Status</option>
                    <option value="1">Normal</option>
                    <option value="2">Verified</option>
                    <option value="3">Inactive</option>
                </select>
                <button type="submit" className="px-5 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
                    Search
                </button>
            </form>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Start</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">End</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Loading…</td></tr>
                        ) : error ? (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-red-500">{error}</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
                        ) : (
                            items.map((p) => {
                                const thumb = toThumbSrc(p.product_img, trackBlobUrl);
                                return (
                                    <tr key={p.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        alt={p.product_name}
                                                        className="w-12 h-12 object-cover rounded-md border border-gray-200"
                                                        onError={(e) => { e.currentTarget.style.opacity = 0; }}
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                                        No Img
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{p.product_name}</p>
                                                    <p className="text-xs text-gray-500">ID: {p.product_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700">{catName(p.product_cat_id)}</td>
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatTHB(p.start_price)}</td>
                                        <td className="px-4 py-4 text-sm text-gray-700">{toLocalString(p.start_time)}</td>
                                        <td className="px-4 py-4 text-sm text-gray-700">{toLocalString(p.end_time)}</td>
                                        <td className="px-4 py-4"><StatusBadge status_id={p.status_id} /></td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-600">
                    Page {page} / {Math.max(1, Math.ceil(total / pageSize))} — Showing {items.length} of {total} products
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page * pageSize >= total}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
