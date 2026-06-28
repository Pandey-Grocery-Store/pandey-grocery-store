export const categories = [
  {
    id: 'groceries',
    name: 'Groceries & Staples',
    nameHi: 'किराना एवं दैनिक सामग्री',
    icon: '🛒',
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
    id: 'printing-binding',
    name: 'Printing & Binding',
    nameHi: 'प्रिंटिंग एवं बाइंडिंग',
    icon: '🖨️',
    image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=400',
    subcategories: [
      { id: 'whatsapp-printing', name: 'WhatsApp Document Printing', nameHi: 'व्हाट्सएप डॉक्यूमेंट प्रिंटिंग' },
      { id: 'project-binding', name: 'Spiral & Project Binding', nameHi: 'स्पाइरल और प्रोजेक्ट बाइंडिंग' },
      { id: 'photocopy-scan', name: 'Black & White / Colour Photocopy & Scanning', nameHi: 'फोटोकॉपी एवं स्कैनिंग' },
      { id: 'academic-printing', name: 'Resume, Assignment & Report Printing', nameHi: 'रिज्यूम एवं असाइनमेंट प्रिंट' },
      { id: 'custom-printing', name: 'Poster, Canvas & Photo Printing', nameHi: 'पोस्टर एवं फोटो प्रिंटिंग' },
    ],
  },
  {
    id: 'stationery',
    name: 'Stationery & Office',
    nameHi: 'स्टेशनरी एवं ऑफिस सामग्री',
    icon: '📚',
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
    name: 'Household & Care',
    nameHi: 'घरेलू एवं पर्सनल केयर',
    icon: '🧼',
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400',
    subcategories: [
      { id: 'household-products', name: 'Household Products', nameHi: 'घरेलू सामान' },
      { id: 'cleaning-supplies', name: 'Cleaning Supplies', nameHi: 'सफाई का सामान' },
      { id: 'personal-care', name: 'Personal Care Products', nameHi: 'पर्सनल केयर' },
    ],
  },
];

export const getCategoryById = (id) => categories.find((c) => c.id === id);

export const getSubcategoryById = (catId, subId) => {
  const cat = getCategoryById(catId);
  return cat?.subcategories.find((s) => s.id === subId);
};
