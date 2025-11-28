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
  return <span className="text-gray-500">Pending</span>;
}

export default function ProductValidation() {
  const [products, setProducts] = useState([
    { id: 3, name: "H1 Gamepad",  price: 550, dateAdded: "2025-10-18", status: "rejected",  image: "https://via.placeholder.com/72x72.png?text=PAD" },
    { id: 4, name: "H1 Gamepad",  price: 550, dateAdded: "2025-10-18", status: "validated", image: "https://via.placeholder.com/72x72.png?text=PAD" },
    { id: 5, name: "H1 Gamepad",  price: 550, dateAdded: "2025-10-18", status: "validated", image: "https://via.placeholder.com/72x72.png?text=PAD" },
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
              {p.status === "pending" ? (
                <>
                  <button
                    onClick={() => openModal(p, "validate")}
                    className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 text-sm font-medium"
                  >
                    Validate
                  </button>
                  <button
                    onClick={() => openModal(p, "reject")}
                    className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 text-sm font-medium"
                  >
                    Reject
                  </button>
                </>
              ) : (
                <StatusBadge status={p.status} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalType === "validate" ? "Validate product" : "Reject product"}
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-sm text-gray-700">
                  Product: <span className="font-medium">{selected.name}</span>
                </div>
                <label className="block text-sm text-gray-600">
                  Note (optional)
                  <textarea
                    className="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={modalType === "validate" ? "Add validation note…" : "Reason for rejection…"}
                  />
                </label>
              </div>
              <div className="px-5 py-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`px-4 py-2 rounded-md text-white ${
                    modalType === "validate"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {modalType === "validate" ? "Confirm Validate" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
