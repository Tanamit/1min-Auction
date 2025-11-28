import React, { useEffect, useState } from 'react';
import { FiHeart, FiEye } from 'react-icons/fi';
import { API_BASE_URL } from "../../config/api";


export default function WinnerHistory() {
  const LIMIT = 20;
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(4);
  const [failedImages, setFailedImages] = useState({});

  // Decode Postgres bytea hex
  const decodeImage = (hex) => {
    try {
      if (!hex) return null;
      if (hex.startsWith("data:image")) return hex;
      if (!hex.startsWith("\\x")) return null;
      const h = hex.slice(2);
      const pairs = h.match(/.{1,2}/g);
      if (!pairs) return null;
      const bytes = new Uint8Array(pairs.map(p => parseInt(p, 16)));
      let bin = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      return `data:image/jpeg;base64,${btoa(bin)}`;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE_URL}/products/winners?limit=${LIMIT}`)
      .then(r => {
        if (!r.ok) throw new Error("bad");
        return r.json();
      })
      .then(json => {
        if (!mounted) return;
        const arr = (json.items || []).slice(0, LIMIT).map(p => ({
          id: p.product_id,
          sku: p.product_name || `Product-${p.product_id}`,
          winnerName: p.winner_name && p.winner_name.trim() !== "" ? p.winner_name : "Unknown",
          finalPrice: p.final_price ?? p.start_price,
          imageHex: p.product_img,
          endTime: p.end_time,
        }));
        setWinners(arr);
      })
      .catch(() => {
        if (!mounted) return;
        setWinners(sampleData.slice(0, LIMIT));
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // ตรวจสอบขนาดหน้าจอเพื่อกำหนดจำนวนสินค้าต่อแถว
  useEffect(() => {
    const updateItemsPerRow = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setItemsPerRow(4);
      } else if (width >= 992) {
        setItemsPerRow(3);
      } else if (width >= 768) {
        setItemsPerRow(2);
      } else {
        setItemsPerRow(1);
      }
    };

    updateItemsPerRow();
    window.addEventListener('resize', updateItemsPerRow);
    return () => window.removeEventListener('resize', updateItemsPerRow);
  }, []);

  const formatPrice = p =>
    typeof p === 'number' ? new Intl.NumberFormat('en-US').format(p) : p;

  const visibleProducts = winners.slice(currentSlide, currentSlide + itemsPerRow);
  const maxSlide = Math.max(0, winners.length - itemsPerRow);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => Math.min(maxSlide, prev + 1));
  };

  const handleViewAllClick = () => {
    setShowDropdown(!showDropdown);
  };

  const markImageFailed = (key) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  };

  if (loading) {
    return (
      <div className="winner-history-container">
        <div className="loading-state">Loading winners...</div>
        {/* Main styles – REMOVE jsx attribute */}
        <style>{`
          .winner-history-container {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
          }
          /* rest unchanged */
        `}</style>
      </div>
    );
  }

  return (
    <div className="winner-history-container">
      {/* Header */}
      <div className="header-section">
        <div className="header-left">
          <div className="winner-badge">Winner</div>
          <h2 className="section-title">Winner History ✨</h2>
        </div>
        
        <div className="navigation-arrows">
          <button 
            className={`nav-button ${currentSlide === 0 ? 'disabled' : ''}`}
            onClick={handlePrevSlide}
            disabled={currentSlide === 0}
          >
            &lt;
          </button>
          <button 
            className={`nav-button ${currentSlide >= maxSlide ? 'disabled' : ''}`}
            onClick={handleNextSlide}
            disabled={currentSlide >= maxSlide}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="product-info">
        <span>Showing {currentSlide + 1}-{Math.min(currentSlide + itemsPerRow, winners.length)} of {winners.length} winners</span>
      </div>

      {/* Winners Carousel - Single Row */}
      <div className="products-carousel">
        <div className="products-grid">
          {visibleProducts.map(winner => {
            const key = winner.id ?? winner.sku;
            const imgFailed = Boolean(failedImages[key]);
            const imgSrc = !imgFailed
              ? decodeImage(winner.imageHex) || PLACEHOLDER
              : PLACEHOLDER;
            return (
              <div key={key} className="product-card">
                <div className="product-image-container">
                  <div className="product-image-placeholder">
                    <img
                      src={imgSrc}
                      alt={winner.sku}
                      onError={() => markImageFailed(key)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="product-actions">
                    <button className="action-btn" title="Add to wishlist">
                      <FiHeart />
                    </button>
                    <button className="action-btn" title="View details">
                      <FiEye />
                    </button>
                  </div>
                  <div className="winner-status-badge">WINNER</div>
                </div>
                <div className="product-info">
                  <h3 className="product-id">{winner.sku}</h3>
                  <p className="winner-name">Winner: {winner.winnerName}</p>
                  <p className="final-price">Final Price: ${formatPrice(winner.finalPrice)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* View All Button with Dropdown */}
      <div className="view-all-container">
        <button className="view-all-button" onClick={handleViewAllClick}>
          View All Winners
          <span className="product-count">({winners.length} items)</span>
        </button>
        
        {/* Dropdown showing all winners */}
        {showDropdown && (
          <div className="dropdown-overlay" onClick={() => setShowDropdown(false)}>
            <div className="dropdown-content" onClick={(e) => e.stopPropagation()}>
              <div className="dropdown-header">
                <h3>All Winners ({winners.length} items)</h3>
                <button className="close-button" onClick={() => setShowDropdown(false)}>
                  ×
                </button>
              </div>
              
              <div className="dropdown-products-grid">
                {winners.map((winner) => {
                  const key = winner.id ?? winner.sku;
                  const imgFailed = Boolean(failedImages[key]);
                  
                  return (
                    <div key={key} className="dropdown-product-card">
                      <div className="dropdown-product-image-container">
                        {/* Placeholder for future image */}
                        <div className="dropdown-product-image-placeholder">
                          <div className="image-icon">🏆</div>
                        </div>
                        
                        {/* Winner badge */}
                        <div className="dropdown-winner-badge">
                          WINNER
                        </div>
                      </div>

                      <div className="dropdown-product-info">
                        <h4 className="dropdown-product-id">{winner.sku}</h4>
                        <p className="dropdown-winner-name">Winner: {winner.winnerName}</p>
                        <p className="dropdown-final-price">Final: ${formatPrice(winner.finalPrice)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .winner-history-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .winner-badge {
          background-color: #ef4444;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .navigation-arrows {
          display: flex;
          gap: 0.5rem;
        }

        .nav-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f3f4f6;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 600;
          transition: all 0.2s;
          color: #6b7280;
        }

        .nav-button:hover:not(.disabled) {
          background: #ef4444;
          color: white;
          transform: scale(1.1);
        }

        .nav-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .product-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .products-carousel {
          margin-bottom: 3rem;
        }

        .products-grid {
          display: flex;
          gap: 1.5rem;
          overflow-x: auto;
          padding-bottom: 1rem;
        }

        .product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          flex: 0 0 280px;
          min-width: 280px;
          position: relative;
        }

        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .product-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .product-image-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .product-card:hover .product-image-placeholder {
          transform: scale(1.05);
        }

        .image-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          opacity: 0.8;
        }

        .image-text {
          font-size: 0.875rem;
          color: #ef4444;
          font-weight: 500;
          margin: 0;
        }

        .product-actions {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .product-card:hover .product-actions {
          opacity: 1;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .action-btn:hover {
          background: white;
          transform: scale(1.1);
          color: #ef4444;
        }

        .winner-status-badge {
          position: absolute;
          bottom: 0.5rem;
          left: 0.5rem;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .product-info {
          padding: 1rem;
        }

        .product-id {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 0.25rem 0;
        }

        .winner-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .final-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ef4444;
          margin: 0;
        }

        .view-all-container {
          display: flex;
          justify-content: center;
        }

        .view-all-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 1rem 3rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .view-all-button:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .product-count {
          display: block;
          font-size: 0.875rem;
          font-weight: 400;
          opacity: 0.9;
          margin-top: 0.25rem;
        }

        /* Dropdown Styles */
        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .dropdown-content {
          background: white;
          border-radius: 16px;
          max-width: 1200px;
          max-height: 80vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 2rem 1rem 2rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .dropdown-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .close-button {
          width: 32px;
          height: 32px;
          border: none;
          background: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.5rem;
          font-weight: 700;
          color: #6b7280;
        }

        .close-button:hover {
          background: #e5e7eb;
        }

        .dropdown-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          padding: 2rem;
          overflow-y: auto;
          max-height: 60vh;
        }

        .dropdown-product-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
          position: relative;
        }

        .dropdown-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .dropdown-product-image-container {
          position: relative;
          height: 120px;
          overflow: hidden;
        }

        .dropdown-product-image-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dropdown-product-image-placeholder .image-icon {
          font-size: 1.5rem;
          opacity: 0.7;
        }

        .dropdown-winner-badge {
          position: absolute;
          bottom: 0.25rem;
          left: 0.25rem;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .dropdown-product-info {
          padding: 0.75rem;
        }

        .dropdown-product-id {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0 0 0.25rem 0;
        }

        .dropdown-winner-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .dropdown-final-price {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ef4444;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .winner-history-container {
            padding: 1rem;
          }

          .header-section {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .product-card {
            flex: 0 0 200px;
            min-width: 200px;
          }

          .section-title {
            font-size: 1.5rem;
          }

          .dropdown-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 0.75rem;
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .product-card {
            flex: 0 0 180px;
            min-width: 180px;
          }

          .dropdown-overlay {
            padding: 1rem;
          }

          .dropdown-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

/* ---------- helpers / sample data ---------- */

const PLACEHOLDER = 'https://via.placeholder.com/400x400?text=No+Image';

const sampleData = [
  { id: 1, sku: 'RC20-9876', winnerName: 'Buyer01', finalPrice: 260, imageUrl: PLACEHOLDER },
  { id: 2, sku: 'LUX98-1985', winnerName: 'Buyer02', finalPrice: 960, imageUrl: PLACEHOLDER },
  { id: 3, sku: 'LUX20-3029', winnerName: 'Buyer03', finalPrice: 160, imageUrl: PLACEHOLDER },
  { id: 4, sku: 'BS10-1925', winnerName: 'Buyer04', finalPrice: 360, imageUrl: PLACEHOLDER },
  { id: 5, sku: 'Testing_Product5', winnerName: 'Buyer05', finalPrice: 360, imageUrl: PLACEHOLDER },
  { id: 6, sku: 'Testing_Product6', winnerName: 'Buyer06', finalPrice: 420, imageUrl: PLACEHOLDER },
  { id: 7, sku: 'Testing_Product7', winnerName: 'Buyer07', finalPrice: 180, imageUrl: PLACEHOLDER },
  { id: 8, sku: 'Testing_Product8', winnerName: 'Buyer08', finalPrice: 240, imageUrl: PLACEHOLDER },
  { id: 9, sku: 'Testing_Product9', winnerName: 'Buyer09', finalPrice: 520, imageUrl: PLACEHOLDER },
  { id: 10, sku: 'Testing_Product10', winnerName: 'Buyer10', finalPrice: 125, imageUrl: PLACEHOLDER },
  { id: 11, sku: 'Testing_Product11', winnerName: 'Buyer11', finalPrice: 300, imageUrl: PLACEHOLDER },
  { id: 12, sku: 'Testing_Product12', winnerName: 'Buyer12', finalPrice: 410, imageUrl: PLACEHOLDER },
  { id: 13, sku: 'Testing_Product13', winnerName: 'Buyer13', finalPrice: 275, imageUrl: PLACEHOLDER },
  { id: 14, sku: 'Testing_Product14', winnerName: 'Buyer14', finalPrice: 199, imageUrl: PLACEHOLDER },
  { id: 15, sku: 'Testing_Product15', winnerName: 'Buyer15', finalPrice: 650, imageUrl: PLACEHOLDER },
  { id: 16, sku: 'Testing_Product16', winnerName: 'Buyer16', finalPrice: 89, imageUrl: PLACEHOLDER },
  { id: 17, sku: 'Testing_Product17', winnerName: 'Buyer17', finalPrice: 330, imageUrl: PLACEHOLDER },
  { id: 18, sku: 'Testing_Product18', winnerName: 'Buyer18', finalPrice: 470, imageUrl: PLACEHOLDER },
  { id: 19, sku: 'Testing_Product19', winnerName: 'Buyer19', finalPrice: 210, imageUrl: PLACEHOLDER },
  { id: 20, sku: 'Testing_Product20', winnerName: 'Buyer20', finalPrice: 540, imageUrl: PLACEHOLDER },
  { id: 21, sku: 'Testing_Product21', winnerName: 'Buyer21', finalPrice: 540, imageUrl: PLACEHOLDER },
  { id: 22, sku: 'Testing_Product22', winnerName: 'Buyer22', finalPrice: 540, imageUrl: PLACEHOLDER },
];