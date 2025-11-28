// src/components/home/FlashSales.jsx
// import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from '../product/ProductCard';
// import CountdownTimer from '../product/CountdownTimer';

export default function FlashSales() {
  const products = [
    {
      id: 1,
      name: 'HAVIT HV-G92 Gamepad',
      price: 120,
      originalPrice: 160,
      discount: 40,
      rating: 5,
      reviews: 88,
      image: '/images/gamepad.png',
    },
    {
      id: 2,
      name: 'AK-900 Wired Keyboard',
      price: 960,
      originalPrice: 1160,
      discount: 35,
      rating: 4,
      reviews: 75,
      image: '/images/keyboard.png',
    },
    // Add more products
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-5 h-10 bg-primary rounded"></div>
        <h3 className="text-primary font-semibold">Today's</h3>
      </div>

      <div className="flex items-end justify-between mb-8">
        <div className="flex items-center gap-8">
          <h2 className="text-4xl font-bold">Flash Sales นะจ๊ะจะบอกให้</h2>
          
        </div>

        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <FiChevronLeft size={20} />
          </button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center">
        <button className="btn-primary">
          View All Products
        </button>
      </div>
    </section>
  );
}