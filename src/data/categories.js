export const categories = [
  {
    id: 'groceries',
    slug: 'groceries',
    name: 'Groceries & Staples',
    nameHi: 'किराना एवं दैनिक सामग्री',
    icon: 'ShoppingBasket',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    subcategories: [
      { id: 'rice-grains', name: 'Rice & Grains', nameHi: 'चावल और अनाज' },
      { id: 'spices-masala', name: 'Spices & Masalas', nameHi: 'मसाले और गरम मसाले' },
      { id: 'cooking-oil', name: 'Cooking Oil', nameHi: 'खाना पकाने का तेल' },
      { id: 'packaged-foods', name: 'Packaged Foods', nameHi: 'पैक्ड खाद्य पदार्थ' },
      { id: 'dairy-products', name: 'Dairy Products', nameHi: 'डेयरी उत्पाद' },
      { id: 'beverages', name: 'Beverages', nameHi: 'पेय पदार्थ' },
      { id: 'snacks', name: 'Snacks & Namkeen', nameHi: 'स्नैक्स और नमकीन' },
      { id: 'fresh-produce', name: 'Fresh Fruits & Vegetables', nameHi: 'ताज़ी फल और सब्ज़ियाँ' },
    ],
  },
  {
    id: 'stationery',
    slug: 'stationery',
    name: 'Stationery & Office',
    nameHi: 'स्टेशनरी एवं ऑफिस सामग्री',
    icon: 'BookOpen',
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400',
    subcategories: [
      { id: 'notebooks-registers', name: 'Notebooks & Registers', nameHi: 'कॉपी एवं रजिस्टर' },
      { id: 'pens-pencils', name: 'Pens, Pencils & School Supplies', nameHi: 'पेन, पेंसिल एवं स्कूल सामग्री' },
      { id: 'files-folders', name: 'Files & Folders', nameHi: 'फ़ाइलें और फ़ोल्डर' },
      { id: 'art-craft', name: 'Art, Craft & Chart Paper', nameHi: 'आर्ट, क्राफ्ट एवं चार्ट पेपर' },
      { id: 'office-supplies', name: 'Sticky Notes & Office Supplies', nameHi: 'कार्यालय सामग्री' },
    ],
  },
  {
    id: 'household-personal',
    slug: 'household-personal',
    name: 'Household & Care',
    nameHi: 'घरेलू एवं पर्सनल केयर',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400',
    subcategories: [
      { id: 'household-products', name: 'Household Products', nameHi: 'घरेलू सामान' },
      { id: 'cleaning-supplies', name: 'Cleaning Supplies', nameHi: 'सफाई का सामान' },
      { id: 'personal-care', name: 'Personal Care Products', nameHi: 'पर्सनल केयर' },
    ],
  },
];

export const getCategoryById = (id) => categories.find((c) => c.id === id || c.slug === id);

export const getSubcategoryById = (catId, subId) => {
  const cat = getCategoryById(catId);
  return cat?.subcategories.find((s) => s.id === subId);
};
