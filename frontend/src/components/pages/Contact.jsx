

export default function Contact() {  
  return (
    <>
    <div className="min-h-screen bg-white">
      <main className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="mb-4">If you have any questions or need assistance, please reach out to us:</p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            Email: <a href="mailto:support@1min-auction.com" className="text-blue-600 hover:underline">
              support@1min-auction.com
            </a>
          </li>
          <li>Phone: +1 (123) 456-7890</li>
          <li>Address: 1234 Auction St, Bid City, Country</li>
        </ul>
        
      </main>
      
    </div>
    </>
  );
}