import { useMemo, useState } from "react";

const money = (n) => `$${Number(n).toLocaleString()}`;
const formatDMY = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

function StatusBadge({ status }) {
  if (status === "validated") return <span className="text-blue-600 font-semibold">Validated</span>;
  if (status === "rejected")  return <span className="text-red-600 font-semibold">Rejected</span>;
  if (status === "deleted")  return <span className="text-red-600 font-semibold">Deleted</span>;
  if (status === "confirmed")  return <span className="text-green-600 font-semibold">Confirmed</span>;
  if (status === "refunded")  return <span className="text-yellow-600 font-semibold">Refunded</span>;

  return <span className="text-gray-500">Pending</span>;
}

export default function ProductValidation() {
  const [products, setProducts] = useState([
    { id: 3, name: "H1 Gamepad",  price: 550, dateAdded: "2025-10-18", status: "rejected",  image: "https://via.placeholder.com/72x72.png?text=PAD" },
    { id: 4, name: "Gamepad",  price: 400, dateAdded: "2025-10-18", status: "validated", image: "https://via.placeholder.com/72x72.png?text=PAD" },
    { id: 5, name: "Sunglasses",  price: 120, dateAdded: "2025-10-18", status: "deleted", image: "https://via.placeholder.com/72x72.png?text=PAD" },
    { id: 5, name: "Headphone",  price: 200, dateAdded: "2025-10-18", status: "confirmed", image: "https://via.placeholder.com/72x72.png?text=PAD" },
    { id: 5, name: "Car key?",  price: 10, dateAdded: "2025-10-18", status: "validated", image: "https://via.placeholder.com/72x72.png?text=PAD" },
    { id: 5, name: "Apple watch",  price: 750, dateAdded: "2025-10-18", status: "validated", image: "https://via.placeholder.com/72x72.png?text=PAD" },
    { id: 5, name: "Iphone-13",  price: 450, dateAdded: "2025-10-18", status: "refunded", image: "https://via.placeholder.com/72x72.png?text=PAD" },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("validate"); // validate | reject
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");

  const pendingCount = useMemo(() => products.filter(p => p.status === "pending").length, [products]);

  const openModal = (p, type) => { setSelected(p); setModalType(type); setNote(""); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);
  const confirmAction = () => {
    if (!selected) return;
    setProducts(prev => prev.map(p => p.id === selected.id
      ? { ...p, status: modalType === "validate" ? "validated" : "rejected", note }
      : p
    ));
    setModalOpen(false);
  };

  return (
    <section className="bg-white shadow-sm rounded-lg p-6 md:p-8">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-red-500 mb-6">Product list</h2>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-4 md:px-6 py-3 bg-gray-50 rounded-md shadow-sm">
        <div className="col-span-6 text-sm font-semibold text-gray-600">Product</div>
        <div className="col-span-2 text-sm font-semibold text-gray-600">Price</div>
        <div className="col-span-2 text-sm font-semibold text-gray-600">Registration date</div>
        <div className="col-span-2 text-sm font-semibold text-gray-600 text-right">Status</div>
      </div>

      {/* Product Rows */}
      <div className="space-y-4 mt-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-12 items-center bg-white shadow-sm px-4 md:px-6 py-4 rounded-md"
          >
            <div className="col-span-6 flex items-center gap-4">
              <div className="relative">
                <img src={p.image} alt={p.name} className="w-16 h-16 rounded-md object-cover border" />
                {p.status === "pending" && (
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] shadow">
                    !
                  </span>
                )}
              </div>
              <div className="leading-tight">
                <div className="font-medium text-gray-900">{p.name}</div>
              </div>
            </div>

            <div className="col-span-2 text-gray-800">{money(p.price)}</div>
            <div className="col-span-2 text-gray-700">{formatDMY(p.dateAdded)}</div>

            <div className="col-span-2 flex items-center justify-end gap-2">
                <StatusBadge status={p.status} />
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
