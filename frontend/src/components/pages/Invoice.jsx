import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function Invoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  
  // รับข้อมูลจาก Payment.jsx
  const invoiceData = location.state?.invoiceData || {
    number: "INV-088",
    payable: 32000,
    issueDate: "01/10/2025",
    dueDate: "15/10/2025",
    billedTo: {
      name: "Guest User",
      address: "Bangkok, Thailand",
    },
    from: {
      name: "1MIN Auction",
      address: "888 Salaya, Nakhon Pathom, Thailand, 73170",
      taxId: "00XXXXX1234X0XX",
    },
    item: {
      description: "Auction Item",
      qty: 1,
      amount: 32000,
    },
  };

  // Debug log
  console.log('🧾 Invoice Component Loaded');
  console.log('Invoice ID from URL:', invoiceId);
  console.log('Invoice Data:', invoiceData);

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      <main className="flex-grow container mx-auto px-6 py-12">

        {/* Title */}
        <h1 className="text-3xl font-bold mb-10">INVOICE</h1>

        {/* Invoice box */}
        <div className="bg-white shadow-md rounded-lg p-8 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <p className="font-semibold">
                Payable{" "}
                <span className="text-red-600 text-lg">
                  ฿{invoiceData.payable.toLocaleString()}
                </span>
              </p>
              <p>Dues {invoiceData.dueDate}</p>
              <p>Issued {invoiceData.issueDate}</p>
              <p>Ref. #{invoiceData.number}</p>
            </div>

            <div>
              <h2 className="font-semibold mb-1">Billed to</h2>
              <p>{invoiceData.billedTo.name}</p>
              <p className="text-gray-600 text-sm">{invoiceData.billedTo.address}</p>
            </div>

            <div>
              <h2 className="font-semibold mb-1">From</h2>
              <p>{invoiceData.from.name}</p>
              <p className="text-gray-600 text-sm">{invoiceData.from.address}</p>
              <p className="text-gray-600 text-sm">TAX ID {invoiceData.from.taxId}</p>
            </div>
          </div>

          {/* Item Table */}
          <table className="w-full text-left border-t border-gray-300">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-3 text-gray-600">Item description</th>
                <th className="py-3 text-gray-600 text-center">Qty</th>
                <th className="py-3 text-gray-600 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-3 font-semibold">{invoiceData.item.description}</td>
                <td className="py-3 text-center">{invoiceData.item.qty}</td>
                <td className="py-3 text-right">
                  ฿{invoiceData.item.amount.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td></td>
                <td className="py-3 text-right font-semibold">Subtotal</td>
                <td className="py-3 text-right">
                  ฿{invoiceData.item.amount.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td></td>
                <td className="py-3 text-right font-semibold">Total (THB)</td>
                <td className="py-3 text-right text-red-600 font-bold">
                  ฿{invoiceData.payable.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleBackToHome}
              className="bg-gray-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-700 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>

    </div>
  );
}