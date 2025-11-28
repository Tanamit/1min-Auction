// src/pages/Home.jsx

import Categories from "../home/Categories";
import BiddingNow from "../home/BiddingNow";
import ComingUp from "../home/ComingUp";
import WinnerHistory from "../home/WinnerHistory";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="space-y-16 pt-6">

        {/* Category List */}
        <Categories />

        {/* Bidding Now Section */}
        <BiddingNow />

        {/* Coming Up Section */}
        <ComingUp />

        {/* Winner History */}
        <WinnerHistory />

      </main>
    </div>
  );
}
