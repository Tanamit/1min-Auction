import { useState, useEffect } from 'react';
import { FiHeart, FiEye, FiX, FiUser, FiMapPin, FiClock } from 'react-icons/fi';

// Mock data - จำลองข้อมูลสินค้าที่เกี่ยวข้อง
const generateRelatedProducts = (mainProductCategory = 'Electronics') => {
  const products = [];
  const productsByCategory = {
    Electronics: [
      'Canon EOS R5', 'Sony A7R IV', 'Nikon D850', 'Fujifilm X-T4', 
      'Panasonic GH5', 'Olympus OM-1', 'Leica Q2', 'Hasselblad X1D'
    ],
    Jewelry: [
      'Diamond Ring', 'Gold Necklace', 'Silver Bracelet', 'Pearl Earrings',
      'Ruby Pendant', 'Emerald Ring', 'Sapphire Brooch', 'Platinum Watch'
    ],
    Collectibles: [
      'Vintage Coin', 'Rare Stamp', 'Antique Toy', 'Comic Book',
      'Trading Card', 'Figurine', 'Poster', 'Memorabilia'
    ],
    'Event tickets': [
      'Concert Ticket', 'Sports Event', 'Theater Show', 'Festival Pass',
      'VIP Experience', 'Meet & Greet', 'Backstage Pass', 'Premium Seat'
    ],
    Memorabilia: [
      'Signed Photo', 'Vintage Poster', 'Sports Jersey', 'Movie Prop',
      'Autographed Item', 'Historical Document', 'Rare Book', 'Artifact'
    ]
  };

  const categoryProducts = productsByCategory[mainProductCategory] || productsByCategory.Electronics;
  
  for (let i = 1; i <= 8; i++) {
    products.push({
      id: `REL-${Date.now()}-${i}`,
      name: `${categoryProducts[i % categoryProducts.length]} ${i}`,
      startPrice: Math.floor(Math.random() * 5000) + 500,
      currentBid: Math.floor(Math.random() * 8000) + 1000,
      image: `https://picsum.photos/300/200?random=${Date.now() + i + 500}`,
      status: 'active',
      views: Math.floor(Math.random() * 500) + 50,
      likes: Math.floor(Math.random() * 100) + 10,
      category: mainProductCategory,
      condition: ['New', 'Like New', 'Good', 'Fair'][Math.floor(Math.random() * 4)],
      seller: `Seller${i}`,
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      endTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Random within 7 days
    });
  }
  return products;
};

export default function RelatedItems({ category = 'Electronics', currentProductId = null }) {
  const [products, setProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerRow, setItemsPerRow] = useState(4);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  // สร้างข้อมูลสินค้าที่เกี่ยวข้อง
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const relatedProducts = generateRelatedProducts(category);
      // กรองออกสินค้าปัจจุบัน (ถ้ามี)
      const filteredProducts = currentProductId 
        ? relatedProducts.filter(product => product.id !== currentProductId)
        : relatedProducts;
      
      setProducts(filteredProducts);
      setLoading(false);
    }, 500);
  }, [category, currentProductId]);

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

  // กำหนดจำนวนสินค้าที่จะแสดง - แสดงแค่แถวเดียว
  const visibleProducts = products.slice(currentSlide, currentSlide + itemsPerRow);
  const maxSlide = Math.max(0, products.length - itemsPerRow);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => Math.min(maxSlide, prev + 1));
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedProduct(null);
  };



  if (loading) {
    return (
      <div className="related-items-container loading">
        <div className="loading-text">Loading related items...</div>
      </div>
    );
  }

  return (
    <div className="related-items-container">
      {/* Header */}
      <div className="header-section">
        <div className="header-left">
          <div className="related-badge">🔴 Related</div>
          <h2 className="section-title">Related Items</h2>
          <span className="category-info">in {category}</span>
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
        <span>Similar items you might like | Showing {currentSlide + 1}-{Math.min(currentSlide + itemsPerRow, products.length)} of {products.length} items</span>
      </div>

      {/* Products Carousel - Single Row */}
      <div className="products-carousel">
        <div className="products-grid">
          {visibleProducts.map((product) => (
            <div key={product.id} className="product-link" onClick={() => handleProductClick(product)}>
              <div className="product-card related">
                <div className="product-image-container">
                  <img src={product.image} alt={product.name} className="product-image" />
                  
                  {/* Status badge */}
                  <div className="status-badge active">
                    ACTIVE
                  </div>

                  {/* Action buttons */}
                  <div className="product-actions">
                    <button className="action-btn" onClick={(e) => e.preventDefault()}>
                      <FiHeart />
                    </button>
                    <button className="action-btn" onClick={(e) => e.preventDefault()}>
                      <FiEye />
                    </button>
                  </div>

                  {/* Condition badge */}
                  <div className="condition-badge">
                    {product.condition}
                  </div>
                </div>

                <div className="product-info">
                  <h3 className="product-id">{product.id}</h3>
                  <p className="product-name">{product.name}</p>
                  <div className="price-info">
                    <p className="current-bid">Current Bid: ${product.currentBid.toLocaleString()}</p>
                    <p className="start-price">Started at: ${product.startPrice.toLocaleString()}</p>
                  </div>
                  
                  {/* Seller info */}
                  <div className="seller-info">
                    <span className="seller-name">{product.seller}</span>
                    <span className="seller-rating">⭐ {product.rating}</span>
                  </div>
                  
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
            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Popup */}
      {showPopup && selectedProduct && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Product Details</h2>
              <button className="close-btn" onClick={handleClosePopup}>
                <FiX size={24} />
              </button>
            </div>
            
            <div className="popup-body">
              <div className="popup-left">
                <div className="popup-image-container">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="popup-image" />
                  <div className="popup-status-badge">{selectedProduct.status.toUpperCase()}</div>
                  <div className="popup-condition-badge">{selectedProduct.condition}</div>
                </div>
              </div>
              
              <div className="popup-right">
                <div className="popup-product-info">
                  <span className="popup-product-id">{selectedProduct.id}</span>
                  <h3 className="popup-product-name">{selectedProduct.name}</h3>
                  
                  <div className="popup-price-section">
                    <div className="popup-current-bid">
                      <span className="popup-price-label">Current Bid</span>
                      <span className="popup-price-value">${selectedProduct.currentBid.toLocaleString()}</span>
                    </div>
                    <div className="popup-start-price">
                      <span className="popup-price-label">Starting Price</span>
                      <span className="popup-price-value">${selectedProduct.startPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="popup-seller-section">
                    <div className="popup-seller-info">
                      <FiUser className="popup-icon" />
                      <div>
                        <span className="popup-seller-name">{selectedProduct.seller}</span>
                        <span className="popup-seller-rating">⭐ {selectedProduct.rating}</span>
                      </div>
                    </div>
                    
                    <div className="popup-location-info">
                      <FiMapPin className="popup-icon" />
                      <span>Bangkok, Thailand</span>
                    </div>
                  </div>
                  
                  <div className="popup-stats">
                    <div className="popup-stat">
                      <FiEye className="popup-icon" />
                      <span>{selectedProduct.views} views</span>
                    </div>
                    <div className="popup-stat">
                      <FiHeart className="popup-icon" />
                      <span>{selectedProduct.likes} likes</span>
                    </div>
                    <div className="popup-stat">
                      <FiClock className="popup-icon" />
                      <span>Ends in 2d 5h</span>
                    </div>
                  </div>
                  
                  <div className="popup-description">
                    <h4>Description</h4>
                    <p>High-quality {selectedProduct.name} in {selectedProduct.condition.toLowerCase()} condition. Perfect for collectors and enthusiasts. Authentic and well-maintained item with original packaging.</p>
                  </div>
                  
                  <div className="popup-actions">
                    <button className="popup-bid-btn">
                      Place Bid
                    </button>
                    <button className="popup-watch-btn">
                      <FiHeart /> Watch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .related-items-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem;
        }

        .loading-text {
          color: #6b7280;
          font-size: 1.1rem;
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

        .related-badge {
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

        .category-info {
          font-size: 1rem;
          color: #6b7280;
          font-style: italic;
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
          background: #e5e7eb;
          color: #374151;
          transform: scale(1.05);
        }

        .nav-button.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #f9fafb;
          color: #d1d5db;
        }

        .product-info {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .products-carousel {
          overflow: hidden;
          margin-bottom: 3rem;
        }

        .products-grid {
          display: flex;
          gap: 1.5rem;
          transition: transform 0.3s ease;
        }

        .product-link {
          text-decoration: none;
          color: inherit;
          display: block;
          cursor: pointer;
        }

        .product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
          position: relative;
          flex: 0 0 300px;
          min-width: 300px;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
        }

        .product-card.related {
          border: 2px solid #10b981;
          background: rgba(16, 185, 129, 0.02);
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
        }

        .status-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.75rem;
          color: white;
          z-index: 10;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .status-badge.active {
          background: rgba(16, 185, 129, 0.9);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .product-actions {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
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
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: white;
          transform: scale(1.1);
        }

        .condition-badge {
          position: absolute;
          bottom: 0.5rem;
          left: 0.5rem;
          background: rgba(59, 130, 246, 0.9);
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

        .product-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .price-info {
          margin: 0.5rem 0;
        }

        .current-bid {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ef4444;
          margin: 0;
        }

        .start-price {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }

        .seller-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0.5rem 0;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 6px;
        }

        .seller-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
        }

        .seller-rating {
          font-size: 0.8rem;
          color: #f59e0b;
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

        /* Popup Styles */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .popup-content {
          background: white;
          border-radius: 16px;
          max-width: 900px;
          max-height: 90vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .popup-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .close-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: #f3f4f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .popup-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow-y: auto;
          max-height: 70vh;
        }

        .popup-left {
          position: relative;
          background: #f8f9fa;
        }

        .popup-image-container {
          position: relative;
          width: 100%;
          height: 400px;
          overflow: hidden;
        }

        .popup-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .popup-status-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(16, 185, 129, 0.9);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .popup-condition-badge {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          background: rgba(59, 130, 246, 0.9);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .popup-right {
          padding: 2rem;
        }

        .popup-product-info {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .popup-product-id {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }

        .popup-product-name {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          line-height: 1.2;
        }

        .popup-price-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .popup-current-bid,
        .popup-start-price {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .popup-price-label {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }

        .popup-price-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ef4444;
        }

        .popup-start-price .popup-price-value {
          color: #374151;
          font-size: 1.25rem;
        }

        .popup-seller-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .popup-seller-info,
        .popup-location-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .popup-icon {
          color: #6b7280;
          flex-shrink: 0;
        }

        .popup-seller-name {
          font-weight: 600;
          color: #1f2937;
          margin-right: 0.5rem;
        }

        .popup-seller-rating {
          color: #f59e0b;
          font-size: 0.9rem;
        }

        .popup-stats {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .popup-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .popup-description {
          flex: 1;
        }

        .popup-description h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.75rem 0;
        }

        .popup-description p {
          font-size: 0.95rem;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        .popup-actions {
          display: flex;
          gap: 1rem;
          margin-top: auto;
        }

        .popup-bid-btn {
          flex: 1;
          background: #ef4444;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .popup-bid-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .popup-watch-btn {
          background: #ffffff;
          color: #6b7280;
          border: 2px solid #e5e7eb;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .popup-watch-btn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .popup-overlay {
            padding: 1rem;
          }

          .popup-content {
            max-height: 95vh;
          }

          .popup-body {
            grid-template-columns: 1fr;
          }

          .popup-image-container {
            height: 250px;
          }

          .popup-right {
            padding: 1.5rem;
          }

          .popup-price-section {
            grid-template-columns: 1fr;
            padding: 1rem;
          }

          .popup-stats {
            flex-direction: column;
            gap: 0.75rem;
          }

          .popup-actions {
            flex-direction: column;
          }

          .popup-product-name {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 1200px) {
          .product-card {
            flex: 0 0 280px;
            min-width: 280px;
          }
        }

        @media (max-width: 900px) {
          .product-card {
            flex: 0 0 250px;
            min-width: 250px;
          }
        }

        @media (max-width: 768px) {
          .related-items-container {
            padding: 1rem;
          }

          .header-section {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .product-card {
            flex: 0 0 220px;
            min-width: 220px;
          }

          .dropdown-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 0.75rem;
            padding: 1rem;
          }

          .section-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .product-card {
            flex: 0 0 200px;
            min-width: 200px;
          }

          .dropdown-overlay {
            padding: 1rem;
          }

          .dropdown-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}