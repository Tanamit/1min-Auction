// // src/components/home/Hero.jsx
// import { useState } from 'react';
// import { FiChevronRight } from 'react-icons/fi';

// export default function Hero() {
//   const [currentSlide, setCurrentSlide] = useState(0);

//   const slides = [
//     {
//       brand: 'iPhone 14 Series',
//       title: 'Up to 10% off Voucher',
//       image: '/images/iphone.png',
//     },
//     // Add more slides
//   ];

//   return (
//     <section className="container mx-auto px-4 py-8">
//       <div className="grid grid-cols-12 gap-8">
//         {/* Sidebar Categories */}
//         <aside className="col-span-3 border-r pr-4">
//           <ul className="space-y-3">
//             <li className="flex items-center justify-between hover:text-primary cursor-pointer">
//               <span>Woman's Fashion</span>
//               <FiChevronRight />
//             </li>
//             <li className="flex items-center justify-between hover:text-primary cursor-pointer">
//               <span>Men's Fashion</span>
//               <FiChevronRight />
//             </li>
//             <li className="hover:text-primary cursor-pointer">Electronics</li>
//             <li className="hover:text-primary cursor-pointer">Home & Lifestyle</li>
//             <li className="hover:text-primary cursor-pointer">Medicine</li>
//             <li className="hover:text-primary cursor-pointer">Sports & Outdoor</li>
//             <li className="hover:text-primary cursor-pointer">Baby's & Toys</li>
//             <li className="hover:text-primary cursor-pointer">Groceries & Pets</li>
//             <li className="hover:text-primary cursor-pointer">Health & Beauty</li>
//           </ul>
//         </aside>

//         {/* Carousel */}
//         <div className="col-span-9 bg-black text-white rounded-lg overflow-hidden relative">
//           <div className="flex items-center justify-between p-12">
//             <div className="flex-1">
//               <div className="flex items-center gap-4 mb-4">
//                 <img src="/apple-logo.png" alt="Apple" className="w-10" />
//                 <span className="text-lg">{slides[currentSlide].brand}</span>
//               </div>
//               <h2 className="text-5xl font-bold mb-6 leading-tight">
//                 {slides[currentSlide].title}
//               </h2>
//               <button className="flex items-center gap-2 text-white border-b-2 border-white pb-1 hover:border-gray-300 transition-colors">
//                 Shop Now <FiChevronRight />
//               </button>
//             </div>
//             <div className="flex-1">
//               <img 
//                 src={slides[currentSlide].image} 
//                 alt="Product" 
//                 className="w-full object-contain"
//               />
//             </div>
//           </div>

//           {/* Dots Navigation */}
//           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
//             {slides.map((_, index) => (
//               <button
//                 key={index}
//                 onClick={() => setCurrentSlide(index)}
//                 className={`w-3 h-3 rounded-full transition-colors ${
//                   index === currentSlide ? 'bg-primary' : 'bg-gray-400'
//                 }`}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }