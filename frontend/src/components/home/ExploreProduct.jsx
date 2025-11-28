import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiEye, FiRefreshCw } from 'react-icons/fi';

// Mock data - จำลองข้อมูลสินค้า
const generateMockProducts = () => {
  const products = [];
  const productNames = ['Luxury Watch', 'Camera Pro', 'Teddy Bear', 'Action Figure', 'Vintage Item', 'Art Piece', 'Collectible Card', 'Antique Vase'];
  const statuses = ['active', 'sold', 'expired'];
  
  for (let i = 1; i <= 50; i++) {
    products.push({
      id: `EXP-${2000 + i}`,
      name: `${productNames[i % productNames.length]} ${i}`,
      startPrice: Math.floor(Math.random() * 2000) + 200,
      image: `https://picsum.photos/300/300?random=${i + 100}`,
      status: i <= 35 ? 'active' : statuses[Math.floor(Math.random() * 3)], // 35 ชิ้นแรก active
      views: Math.floor(Math.random() * 800) + 100,
      likes: Math.floor(Math.random() * 150) + 20,
      category: ['Electronics', 'Jewelry', 'Collectibles', 'Event tickets', 'Memorabilia'][Math.floor(Math.random() * 5)],
      // เพิ่มข้อมูลสำหรับหน้า auction detail
      auctionId: `LuxOK-${900 + i}`,
      listedBy: `seller${i}`,
      description: `High-quality ${productNames[i % productNames.length]} in excellent condition. Perfect for collectors and enthusiasts.`,
      condition: 'Used - excellent working condition with minor cosmetic wear.',
      currentBid: Math.floor(Math.random() * 5000) + 1000,
      totalBids: Math.floor(Math.random() * 20) + 1,
      timeRemaining: {
        days: Math.floor(Math.random() * 7) + 1,
        hours: Math.floor(Math.random() * 24),
        minutes: Math.floor(Math.random() * 60),
        seconds: Math.floor(Math.random() * 60)
      }
    });
  }
  return products;
};

export default function ExploreProduct() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(5);
  const [showDropdown, setShowDropdown] = useState(false);

  // สร้างข้อมูลสินค้าเมื่อ component mount
  useEffect(() => {
    setProducts(generateMockProducts());
  }, []);

  // ตรวจสอบขนาดหน้าจอเพื่อกำหนดจำนวนสินค้าต่อแถว
  useEffect(() => {
    const updateItemsPerRow = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setItemsPerRow(5);
      } else if (width >= 992) {
        setItemsPerRow(4);
      } else if (width >= 768) {
        setItemsPerRow(3);
      } else if (width >= 576) {
        setItemsPerRow(2);
      } else {
        setItemsPerRow(1);
      }
    };

    updateItemsPerRow();
    window.addEventListener('resize', updateItemsPerRow);
    return () => window.removeEventListener('resize', updateItemsPerRow);
  }, []);

  // กำหนดจำนวนสินค้าที่จะแสดง - แสดงแค่แถวเดียว
  const visibleProducts = products.slice(currentSlide, currentSlide + itemsPerRow);
  
  const maxSlide = Math.max(0, products.length - itemsPerRow);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => Math.min(maxSlide, prev + 1));
  };

  const handleViewAllClick = () => {
    setShowDropdown(!showDropdown);
  };

  // ฟังก์ชันสำหรับไปหน้า auction detail
  const handleProductClick = (product) => {
    if (product.status === 'active') {
      // ส่งข้อมูลสินค้าผ่าน state
      navigate(`/auction/${product.id}`, { state: { productData: product } });
    }
  };

  // ฟังก์ชันสำหรับ action buttons
  const handleHeartClick = (e, productId) => {
    e.stopPropagation();
    console.log('Added to wishlist:', productId);
    // เพิ่มลงใน wishlist
  };

  const handleEyeClick = (e, product) => {
    e.stopPropagation();
    // Quick view หรือไปหน้า detail ทันที
    if (product.status === 'active') {
      navigate(`/auction/${product.id}`, { state: { productData: product } });
    }
  };

  return (
    <div className="explore-products-container">
      {/* Header */}
      <div className="header-section">
        <div className="header-left">
          <div className="explore-badge">Explore</div>
          <h2 className="section-title">Now Bidding</h2>
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
        <FiRefreshCw className="refresh-icon" />
        <span>Showing {currentSlide + 1}-{Math.min(currentSlide + itemsPerRow, products.length)} of {products.length} products</span>
      </div>

      {/* Products Carousel - Single Row */}
      <div className="products-carousel">
        <div className="products-grid">
          {visibleProducts.map((product) => {
            const isExpired = product.status === 'expired';
            const isSold = product.status === 'sold';
            const isClickable = product.status === 'active';
            
            return (
              <div 
                key={product.id} 
                className={`product-card ${isExpired ? 'expired' : ''} ${isSold ? 'sold' : ''} ${isClickable ? 'clickable' : ''}`}
                onClick={() => handleProductClick(product)}
                style={{ cursor: isClickable ? 'pointer' : 'not-allowed' }}
              >
                <div className="product-image-container">
                  {/* Placeholder for future image */}
                  <div className="product-image-placeholder">
                    <div className="image-icon">
                      📷
                    </div>
                    <p className="image-text">Image Coming Soon</p>
                  </div>
                  
                  {/* Status overlay */}
                  {isSold && <div className="status-overlay sold">SOLD</div>}
                  {isExpired && !isSold && <div className="status-overlay expired">EXPIRED</div>}
                  
                  {/* Action buttons */}
                  <div className="product-actions">
                    <button 
                      className="action-btn"
                      onClick={(e) => handleHeartClick(e, product.id)}
                      title="Add to wishlist"
                    >
                      <FiHeart />
                    </button>
                    <button 
                      className="action-btn"
                      onClick={(e) => handleEyeClick(e, product)}
                      title="View details"
                    >
                      <FiEye />
                    </button>
                  </div>

                  {/* Category badge */}
                  <div className="category-badge">
                    {product.category}
                  </div>

                  {/* Click to view indicator for active items */}
                  {isClickable && (
                    <div className="click-indicator">
                      Click to view auction
                    </div>
                  )}
                </div>

                <div className="product-info">
                  <h3 className="product-id">{product.id}</h3>
                  <p className="product-name">{product.name}</p>
                  <p className="product-price">Start at: ${product.startPrice}</p>
                  
                  {/* Current bid for active items */}
                  {isClickable && (
                    <p className="current-bid">Current: ${product.currentBid}</p>
                  )}
                  
                  {/* Product stats */}
                  <div className="product-stats">
                    <span className="stat">
                      <FiEye size={14} /> {product.views}
                    </span>
                    <span className="stat">
                      <FiHeart size={14} /> {product.likes}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .explore-products-container {
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

        .explore-badge {
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

        .refresh-icon {
          font-size: 1rem;
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

        .product-link {
          text-decoration: none;
          color: inherit;
          display: block;
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

        .product-card.clickable:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .product-card.expired {
          opacity: 0.6;
          filter: grayscale(0.3);
        }

        .product-card.sold {
          opacity: 0.7;
          filter: grayscale(0.5);
        }

        .product-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product-image-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .image-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          opacity: 0.7;
        }

        .image-text {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
          margin: 0;
        }

        .dropdown-product-image-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dropdown-product-image-placeholder .image-icon {
          font-size: 1.5rem;
          opacity: 0.7;
        }

        .product-card.clickable:hover .product-image {
          transform: scale(1.05);
        }

        .product-card.clickable:hover .product-image-placeholder {
          transform: scale(1.05);
        }

        .status-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          padding: 1rem 2rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.2rem;
          z-index: 10;
        }

        .status-overlay.sold {
          background: rgba(239, 68, 68, 0.9);
          color: white;
        }

        .status-overlay.expired {
          background: rgba(107, 114, 128, 0.9);
          color: white;
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

        .category-badge {
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

        .click-indicator {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .product-card.clickable:hover .click-indicator {
          opacity: 1;
        }

        .product-info {
          padding: 1rem;
        }

        .product-id {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 0.25rem 0;
        }

        .product-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .product-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ef4444;
          margin: 0 0 0.25rem 0;
        }

        .current-bid {
          font-size: 0.9rem;
          font-weight: 600;
          color: #059669;
          margin: 0 0 0.75rem 0;
        }

        .product-stats {
          display: flex;
          gap: 1rem;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: #6b7280;
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
        }

        .view-all-button:hover {
          background: #dc2626;
          transform: translateY(-2px);
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

        .dropdown-product-card.clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .dropdown-product-card.expired {
          opacity: 0.6;
          filter: grayscale(0.3);
        }

        .dropdown-product-card.sold {
          opacity: 0.7;
          filter: grayscale(0.5);
        }

        .dropdown-product-image-container {
          position: relative;
          height: 120px;
          overflow: hidden;
        }

        .dropdown-product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dropdown-category-badge {
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

        .dropdown-product-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .dropdown-product-price {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ef4444;
          margin: 0 0 0.25rem 0;
        }

        .dropdown-current-bid {
          font-size: 0.8rem;
          font-weight: 600;
          color: #059669;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .explore-products-container {
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