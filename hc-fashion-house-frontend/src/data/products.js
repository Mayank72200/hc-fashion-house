// Segment-specific product data
// Tags: new, trending, featured, bestseller, sale, hot, limited, exclusive, popular, seasonal, clearance

export const menProducts = [
  { 
    id: 'm1', 
    name: 'Air Max 90', 
    brand: 'Nike', 
    price: 12995, 
    originalPrice: 14999, 
    image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400&q=80', 
    sizes: [7, 8, 9, 10, 11], 
    colors: ['Black', 'White'], 
    rating: 4.5, 
    reviews: 128,
    tags: ['trending', 'featured'],
    isNew: false,
    isTrending: true,
    isHot: false
  },
  { 
    id: 'm2', 
    name: 'Ultraboost 22', 
    brand: 'Adidas', 
    price: 15999, 
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80', 
    sizes: [7, 8, 9, 10, 11], 
    colors: ['White', 'Grey'], 
    rating: 4.8, 
    reviews: 256,
    tags: ['new', 'featured'],
    isNew: true,
    isTrending: false,
    isHot: false
  },
  { 
    id: 'm3', 
    name: 'Air Jordan 1 Retro', 
    brand: 'Nike', 
    price: 16999, 
    image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&q=80', 
    sizes: [8, 9, 10, 11], 
    colors: ['Red/Black'], 
    rating: 4.9, 
    reviews: 512,
    tags: ['trending', 'hot', 'bestseller'],
    isNew: false,
    isTrending: true,
    isHot: true
  },
  { 
    id: 'm4', 
    name: 'Oxford Leather', 
    brand: 'Clarks', 
    price: 8999, 
    originalPrice: 10999, 
    image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80', 
    sizes: [7, 8, 9, 10], 
    colors: ['Brown', 'Black'], 
    rating: 4.6, 
    reviews: 189,
    tags: ['sale'],
    isNew: false,
    isTrending: false,
    isHot: false
  },
  { 
    id: 'm5', 
    name: 'RS-X Reinvention', 
    brand: 'Puma', 
    price: 8999, 
    originalPrice: 10999, 
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80', 
    sizes: [6, 7, 8, 9], 
    colors: ['Multi'], 
    rating: 4.3, 
    reviews: 89,
    tags: ['sale', 'popular'],
    isNew: false,
    isTrending: false,
    isHot: false
  },
  { 
    id: 'm6', 
    name: 'Classic Leather', 
    brand: 'Reebok', 
    price: 7499, 
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80', 
    sizes: [7, 8, 9, 10], 
    colors: ['White'], 
    rating: 4.6, 
    reviews: 167,
    tags: ['bestseller'],
    isNew: false,
    isTrending: false,
    isHot: false
  },
  { 
    id: 'm7', 
    name: 'Stan Smith', 
    brand: 'Adidas', 
    price: 6999, 
    image: 'https://images.unsplash.com/photo-1603787081207-362bcef7c144?w=400&q=80', 
    sizes: [6, 7, 8, 9, 10], 
    colors: ['White/Green'], 
    rating: 4.7, 
    reviews: 423,
    isNew: false,
    isTrending: true
  },
  { 
    id: 'm8', 
    name: 'Suede Classic', 
    brand: 'Puma', 
    price: 5999, 
    originalPrice: 7999, 
    image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=400&q=80', 
    sizes: [7, 8, 9, 10], 
    colors: ['Blue', 'Black'], 
    rating: 4.4, 
    reviews: 198,
    isNew: true,
    isTrending: false
  },
];

export const womenProducts = [
  { 
    id: 'w1', 
    name: 'Stiletto Heels', 
    brand: 'Metro', 
    price: 4999, 
    originalPrice: 6999, 
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80', 
    sizes: [4, 5, 6, 7, 8], 
    colors: ['Black', 'Nude'], 
    rating: 4.7, 
    reviews: 234,
    isNew: true,
    isTrending: true
  },
  { 
    id: 'w2', 
    name: 'Ballet Flats', 
    brand: 'Bata', 
    price: 2499, 
    image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80', 
    sizes: [4, 5, 6, 7], 
    colors: ['Pink', 'Beige'], 
    rating: 4.5, 
    reviews: 312,
    isNew: false,
    isTrending: false
  },
  { 
    id: 'w3', 
    name: 'Strappy Sandals', 
    brand: 'Catwalk', 
    price: 3499, 
    originalPrice: 4499, 
    image: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400&q=80', 
    sizes: [5, 6, 7, 8], 
    colors: ['Gold', 'Silver'], 
    rating: 4.6, 
    reviews: 178,
    isNew: false,
    isTrending: true
  },
  { 
    id: 'w4', 
    name: 'Running Shoes', 
    brand: 'Nike', 
    price: 8999, 
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&q=80', 
    sizes: [5, 6, 7, 8, 9], 
    colors: ['Pink', 'White'], 
    rating: 4.8, 
    reviews: 445,
    isNew: true,
    isTrending: false
  },
  { 
    id: 'w5', 
    name: 'Block Heel Pumps', 
    brand: 'Inc.5', 
    price: 5999, 
    originalPrice: 7499, 
    image: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=400&q=80', 
    sizes: [4, 5, 6, 7], 
    colors: ['Red', 'Black'], 
    rating: 4.4, 
    reviews: 156,
    isNew: false,
    isTrending: false
  },
  { 
    id: 'w6', 
    name: 'Wedge Sandals', 
    brand: 'Catwalk', 
    price: 3999, 
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80', 
    sizes: [5, 6, 7, 8], 
    colors: ['Tan', 'White'], 
    rating: 4.3, 
    reviews: 98,
    isNew: false,
    isTrending: false
  },
  { 
    id: 'w7', 
    name: 'Slip-On Sneakers', 
    brand: 'Skechers', 
    price: 4499, 
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&q=80', 
    sizes: [5, 6, 7, 8], 
    colors: ['White', 'Grey'], 
    rating: 4.6, 
    reviews: 287,
    isNew: true,
    isTrending: true
  },
  { 
    id: 'w8', 
    name: 'Ankle Boots', 
    brand: 'Metro', 
    price: 6499, 
    originalPrice: 8499, 
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80', 
    sizes: [5, 6, 7, 8], 
    colors: ['Black', 'Brown'], 
    rating: 4.5, 
    reviews: 167,
    isNew: false,
    isTrending: false
  },
];

export const kidsProducts = [
  { 
    id: 'k1', 
    name: 'Light-Up Sneakers', 
    brand: 'Skechers', 
    price: 2999, 
    originalPrice: 3999, 
    image: 'https://images.unsplash.com/photo-1555274175-75f79b09d5b8?w=400&q=80', 
    sizes: [10, 11, 12, 13, 1, 2], 
    colors: ['Blue', 'Pink'], 
    rating: 4.9, 
    reviews: 534,
    isNew: true,
    isTrending: true
  },
  { 
    id: 'k2', 
    name: 'Velcro Runners', 
    brand: 'Nike', 
    price: 3499, 
    image: 'https://images.unsplash.com/photo-1571210862729-78a52d3779a2?w=400&q=80', 
    sizes: [10, 11, 12, 13], 
    colors: ['Red', 'Blue'], 
    rating: 4.7, 
    reviews: 312,
    isNew: false,
    isTrending: true
  },
  { 
    id: 'k3', 
    name: 'School Shoes', 
    brand: 'Bata', 
    price: 1499, 
    image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&q=80', 
    sizes: [11, 12, 13, 1, 2, 3], 
    colors: ['Black'], 
    rating: 4.4, 
    reviews: 456,
    isNew: false,
    isTrending: false
  },
  { 
    id: 'k4', 
    name: 'Cartoon Sandals', 
    brand: 'Crocs', 
    price: 1999, 
    originalPrice: 2499, 
    image: 'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=400&q=80', 
    sizes: [8, 9, 10, 11, 12], 
    colors: ['Multi'], 
    rating: 4.8, 
    reviews: 289,
    isNew: true,
    isTrending: false
  },
  { 
    id: 'k5', 
    name: 'Canvas Sneakers', 
    brand: 'Converse', 
    price: 2499, 
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80', 
    sizes: [10, 11, 12, 13, 1], 
    colors: ['White', 'Red'], 
    rating: 4.6, 
    reviews: 198,
    isNew: false,
    isTrending: true
  },
  { 
    id: 'k6', 
    name: 'Sport Sandals', 
    brand: 'Adidas', 
    price: 1799, 
    originalPrice: 2299, 
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80', 
    sizes: [9, 10, 11, 12], 
    colors: ['Blue', 'Green'], 
    rating: 4.5, 
    reviews: 145,
    isNew: false,
    isTrending: false
  },
  { 
    id: 'k7', 
    name: 'Rain Boots', 
    brand: 'Crocs', 
    price: 1299, 
    image: 'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=400&q=80', 
    sizes: [8, 9, 10, 11, 12], 
    colors: ['Yellow', 'Pink'], 
    rating: 4.7, 
    reviews: 234,
    isNew: true,
    isTrending: false
  },
  { 
    id: 'k8', 
    name: 'High-Top Sneakers', 
    brand: 'Puma', 
    price: 2799, 
    originalPrice: 3499, 
    image: 'https://images.unsplash.com/photo-1571210862729-78a52d3779a2?w=400&q=80', 
    sizes: [11, 12, 13, 1, 2], 
    colors: ['Black', 'White'], 
    rating: 4.4, 
    reviews: 167,
    isNew: false,
    isTrending: false
  },
];

export const segmentBrands = {
  men: ['Nike', 'Adidas', 'Puma', 'Reebok', 'Clarks'],
  women: ['Nike', 'Bata', 'Metro', 'Catwalk', 'Inc.5', 'Skechers'],
  kids: ['Nike', 'Adidas', 'Skechers', 'Bata', 'Crocs', 'Converse', 'Puma'],
};

export const segmentInfo = {
  men: {
    title: "Men's Collection",
    subtitle: "Premium footwear for the modern gentleman",
    heroImage: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=1920&q=80",
    heroGradient: "from-[#5F9EC4]/95 via-[#5F9EC4]/70 to-[#CFE6F5]/50",
    heroGradientDark: "from-[#0B1F33]/95 via-[#0B1F33]/80 to-[#143A52]/60",
  },
  women: {
    title: "Women's Collection",
    subtitle: "Elegance meets comfort in every step",
    heroImage: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1920&q=80",
    heroGradient: "from-[#F3D6DC]/95 via-[#E6B5BF]/85 to-[#F5E0E5]/70",
    heroGradientDark: "from-[#2A1A20]/95 via-[#3B202A]/85 to-[#1F1418]/70",
  },
  kids: {
    title: "Kids' Collection",
    subtitle: "Fun, durable styles for active little ones",
    heroImage: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1920&q=80",
    heroGradient: "from-[#F4D6CF]/95 via-[#E6B3A8]/85 to-[#F8E3DC]/70",
    heroGradientDark: "from-[#3A2318]/95 via-[#4A2F1F]/85 to-[#2A1911]/70",
  },
};

export const getProductsBySegment = (segment) => {
  switch (segment) {
    case 'men': return menProducts;
    case 'women': return womenProducts;
    case 'kids': return kidsProducts;
    default: return menProducts;
  }
};
