export interface BotanicalItem {
  id: string;
  name: string;
  scientificName: string;
  category: 'Indoor' | 'Outdoor' | 'Garden' | 'Office' | 'Rare';
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  image: string;
  thumbnails: { id: string; label: string; image: string }[];
  isSpecialOffer?: boolean;
  offerBadge?: string;
  seller: {
    name: string;
    role: string;
    avatar: string;
    phone: string;
    email: string;
    rating: number;
    online: boolean;
  };
  description: string;
  careDetails: {
    sunlight: string;
    water: string;
    temperature: string;
    humidity: string;
    difficulty: 'Beginner' | 'Moderate' | 'Connoisseur';
    petFriendly: boolean;
    airPurifying: boolean;
  };
  dimensions: {
    height: string;
    potDiameter: string;
  };
  potOptions: {
    id: string;
    name: string;
    hex: string;
  }[];
}

export const BOTANICAL_PLANTS: BotanicalItem[] = [
  {
    id: 'plant-monstera',
    name: 'Monstera Deliciosa Plant',
    scientificName: 'Monstera deliciosa Liebm.',
    category: 'Indoor',
    price: 25.00,
    originalPrice: 38.00,
    rating: 4.9,
    reviewsCount: 128,
    image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg',
    thumbnails: [
      { id: 't1', label: 'Front Perspective', image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg' },
      { id: 't2', label: 'White Ceramic Pot', image: '/src/assets/images/calathea_plant_pot_1788596670726.jpg' },
      { id: 't3', label: 'Leaf Fenestration', image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg' },
      { id: 't4', label: 'Room Context', image: '/src/assets/images/plant_banner_offer_1788596684743.jpg' },
      { id: 't5', label: 'Aerial View', image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg' }
    ],
    isSpecialOffer: true,
    offerBadge: 'Best Seller',
    seller: {
      name: 'Jacob Doe',
      role: 'Head Botanist & Store Manager',
      avatar: '/src/assets/images/seller_jacob_avatar_1788596698402.jpg',
      phone: '+1 (555) 428-9102',
      email: 'jacob.botany@realstan.studio',
      rating: 4.95,
      online: true,
    },
    description: 'The iconic Swiss Cheese plant characterized by its natural perforated, glossy split foliage. Native to tropical rainforests, this low-maintenance statement botanical purifies indoor air and thrives in modern living rooms and architectural offices.',
    careDetails: {
      sunlight: 'Bright Indirect',
      water: 'Every 1-2 weeks',
      temperature: '18°C – 28°C',
      humidity: 'Medium (55%)',
      difficulty: 'Beginner',
      petFriendly: false,
      airPurifying: true,
    },
    dimensions: {
      height: '55 - 65 cm',
      potDiameter: '18 cm matte ceramic'
    },
    potOptions: [
      { id: 'pot-matte-white', name: 'Matte Porcelain', hex: '#FFFFFF' },
      { id: 'pot-sage-clay', name: 'Nordic Sage', hex: '#658B75' },
      { id: 'pot-terracotta', name: 'Raw Terracotta', hex: '#C26D53' },
      { id: 'pot-obsidian', name: 'Basalt Black', hex: '#262927' }
    ]
  },
  {
    id: 'plant-calathea',
    name: 'Calathea Medallion Plant',
    scientificName: 'Goeppertia veitchiana',
    category: 'Indoor',
    price: 32.00,
    originalPrice: 42.00,
    rating: 4.9,
    reviewsCount: 94,
    image: '/src/assets/images/calathea_plant_pot_1788596670726.jpg',
    thumbnails: [
      { id: 'c1', label: 'Primary Angle', image: '/src/assets/images/calathea_plant_pot_1788596670726.jpg' },
      { id: 'c2', label: 'Leaf Pattern', image: '/src/assets/images/calathea_plant_pot_1788596670726.jpg' },
      { id: 'c3', label: 'Monstera Comparison', image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg' },
      { id: 'c4', label: 'Living Room Setting', image: '/src/assets/images/plant_banner_offer_1788596684743.jpg' }
    ],
    isSpecialOffer: true,
    offerBadge: 'Air Purifying',
    seller: {
      name: 'Jacob Doe',
      role: 'Head Botanist & Store Manager',
      avatar: '/src/assets/images/seller_jacob_avatar_1788596698402.jpg',
      phone: '+1 (555) 428-9102',
      email: 'jacob.botany@realstan.studio',
      rating: 4.95,
      online: true,
    },
    description: 'Renowned for its dramatic feathered emerald, silver, and burgundy geometric leaf patterns. Also known as the Prayer Plant, its foliage gently folds upward at dusk in a circadian diurnal dance.',
    careDetails: {
      sunlight: 'Medium Filtered',
      water: 'Twice Weekly',
      temperature: '19°C – 26°C',
      humidity: 'High (65%)',
      difficulty: 'Moderate',
      petFriendly: true,
      airPurifying: true,
    },
    dimensions: {
      height: '40 - 50 cm',
      potDiameter: '16 cm ceramic'
    },
    potOptions: [
      { id: 'pot-matte-white', name: 'Matte Porcelain', hex: '#FFFFFF' },
      { id: 'pot-sage-clay', name: 'Nordic Sage', hex: '#658B75' },
      { id: 'pot-terracotta', name: 'Raw Terracotta', hex: '#C26D53' }
    ]
  },
  {
    id: 'plant-ficus',
    name: 'Ficus Lyrata (Fiddle Leaf)',
    scientificName: 'Ficus lyrata Warb.',
    category: 'Office',
    price: 48.00,
    originalPrice: 65.00,
    rating: 4.8,
    reviewsCount: 162,
    image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg',
    thumbnails: [
      { id: 'f1', label: 'Canopy View', image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg' },
      { id: 'f2', label: 'Stem Architecture', image: '/src/assets/images/calathea_plant_pot_1788596670726.jpg' },
      { id: 'f3', label: 'Office Corner', image: '/src/assets/images/plant_banner_offer_1788596684743.jpg' }
    ],
    offerBadge: 'Architectural',
    seller: {
      name: 'Jacob Doe',
      role: 'Head Botanist & Store Manager',
      avatar: '/src/assets/images/seller_jacob_avatar_1788596698402.jpg',
      phone: '+1 (555) 428-9102',
      email: 'jacob.botany@realstan.studio',
      rating: 4.95,
      online: true,
    },
    description: 'Sculptural violin-shaped foliage with prominent veins and substantial upright posture. A prized focal piece for modern open-concept architectural interiors.',
    careDetails: {
      sunlight: 'High Indirect',
      water: 'Every 10-14 days',
      temperature: '18°C – 27°C',
      humidity: 'Medium (50%)',
      difficulty: 'Moderate',
      petFriendly: false,
      airPurifying: true,
    },
    dimensions: {
      height: '80 - 95 cm',
      potDiameter: '24 cm cylinder'
    },
    potOptions: [
      { id: 'pot-matte-white', name: 'Matte Porcelain', hex: '#FFFFFF' },
      { id: 'pot-obsidian', name: 'Basalt Black', hex: '#262927' }
    ]
  },
  {
    id: 'plant-sansevieria',
    name: 'Sansevieria Trifasciata',
    scientificName: 'Dracaena trifasciata',
    category: 'Outdoor',
    price: 22.00,
    originalPrice: 30.00,
    rating: 4.95,
    reviewsCount: 210,
    image: '/src/assets/images/calathea_plant_pot_1788596670726.jpg',
    thumbnails: [
      { id: 's1', label: 'Vertical Form', image: '/src/assets/images/calathea_plant_pot_1788596670726.jpg' },
      { id: 's2', label: 'Variegation', image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg' }
    ],
    offerBadge: 'Indestructible',
    seller: {
      name: 'Jacob Doe',
      role: 'Head Botanist & Store Manager',
      avatar: '/src/assets/images/seller_jacob_avatar_1788596698402.jpg',
      phone: '+1 (555) 428-9102',
      email: 'jacob.botany@realstan.studio',
      rating: 4.95,
      online: true,
    },
    description: 'Architectural upright swords with golden-edged marbling. Renowned for converting CO2 into oxygen during nighttime hours and requiring minimal watering.',
    careDetails: {
      sunlight: 'Low to High Light',
      water: 'Once a Month',
      temperature: '15°C – 32°C',
      humidity: 'Low-Medium (30-50%)',
      difficulty: 'Beginner',
      petFriendly: false,
      airPurifying: true,
    },
    dimensions: {
      height: '45 - 55 cm',
      potDiameter: '15 cm ceramic'
    },
    potOptions: [
      { id: 'pot-matte-white', name: 'Matte Porcelain', hex: '#FFFFFF' },
      { id: 'pot-terracotta', name: 'Raw Terracotta', hex: '#C26D53' }
    ]
  },
  {
    id: 'plant-bonsai',
    name: 'Japanese Juniper Bonsai',
    scientificName: 'Juniperus procumbens',
    category: 'Garden',
    price: 65.00,
    originalPrice: 85.00,
    rating: 4.9,
    reviewsCount: 78,
    image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg',
    thumbnails: [
      { id: 'b1', label: 'Bonsai Sculpt', image: '/src/assets/images/monstera_plant_pot_1788596658133.jpg' }
    ],
    offerBadge: 'Artisanal',
    seller: {
      name: 'Jacob Doe',
      role: 'Head Botanist & Store Manager',
      avatar: '/src/assets/images/seller_jacob_avatar_1788596698402.jpg',
      phone: '+1 (555) 428-9102',
      email: 'jacob.botany@realstan.studio',
      rating: 4.95,
      online: true,
    },
    description: 'Cultivated living sculpture trained in classical wind-swept Japanese aesthetic. Features cascading evergreen needles in a traditional glazed ceramic dish.',
    careDetails: {
      sunlight: 'Direct Outdoor Light',
      water: 'When soil surface dries',
      temperature: '10°C – 28°C',
      humidity: 'Medium (50%)',
      difficulty: 'Connoisseur',
      petFriendly: true,
      airPurifying: false,
    },
    dimensions: {
      height: '30 - 35 cm',
      potDiameter: '20 cm shallow tray'
    },
    potOptions: [
      { id: 'pot-matte-white', name: 'Porcelain White', hex: '#FFFFFF' },
      { id: 'pot-obsidian', name: 'Basalt Black', hex: '#262927' }
    ]
  }
];
