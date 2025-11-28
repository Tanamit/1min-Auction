import { useState, useEffect } from 'react';
import { FiMonitor, FiWatch, FiCamera, FiMusic, FiCalendar } from 'react-icons/fi';
import { API_BASE_URL } from "../../config/api";


const iconMap = {
  electronics: FiMonitor,
  accessories: FiWatch,
  collectibles: FiCamera,
  events: FiCalendar,
  memorabilia: FiMusic,
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE_URL}/products/categories`);
      const json = await res.json();
      setCategories(json.categories || []);
    })();
  }, []);

  function select(catId) {
    const next = catId === active ? null : catId;
    setActive(next);
    window.dispatchEvent(
      new CustomEvent("categoryFilterChange", { detail: { productCatId: next } })
    );
  }

  return (
    <div className="px-8 pt-12 max-w-[1400px] mx-auto">
      <h2 className="text-4xl font-bold mb-8">Browse By Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {categories.map(c => {
          const Icon = iconMap[c.category_name] || iconMap.electronics;
          const activeState = active === c.category_id;
          return (
            <button
              key={c.category_id}
              onClick={() => select(c.category_id)}
              className={`group bg-white rounded-xl border transition-all h-56 flex flex-col items-center justify-center
                ${activeState ? "border-red-500 shadow-lg" : "border-gray-200 hover:border-gray-300 hover:shadow"}`}
            >
              <Icon className={`text-5xl mb-6 ${activeState ? "text-red-500" : "text-black"}`} />
              <span className={`text-base font-medium capitalize ${activeState ? "text-red-600" : "text-black"}`}>
                {c.category_name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}