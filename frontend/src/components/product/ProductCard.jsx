// src/components/product/ProductCard.jsx
import { FiHeart, FiEye } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

export default function ProductCard({ product }) {
  const { name, price, originalPrice, discount, rating, reviews, image } = product;

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden">
      {/* Image Container */}
      <div className="relative bg-gray-100 h-64 flex items-center justify-center p-4">
        {/* Discount Badge */}
        {discount && (
          <span className="absolute top-3 left-3 bg-primary text-white text-xs px-3 py-1 rounded">
            -{discount}%
          </span>
        )}

        {/* Action Icons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
            <FiHeart size={18} />
          </button>
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
            <FiEye size={18} />
          </button>
        </div>

        {/* Product Image */}
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
        />

        {/* Add to Cart Button */}
        <button className="absolute bottom-0 left-0 right-0 bg-black text-white py-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Add To Cart
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold mb-2 truncate">{name}</h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-primary font-bold">${price}</span>
          {originalPrice && (
            <span className="text-gray-400 line-through">${originalPrice}</span>
          )}
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, index) => (
              <FaStar
                key={index}
                size={14}
                className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">({reviews})</span>
        </div>
      </div>
    </div>
  );
}