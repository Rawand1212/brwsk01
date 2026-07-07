// Sample products shown when Firebase is not yet configured
const DEMO_CATEGORIES = [
  { id: "cat-1", name: "Game Accounts", slug: "game-accounts", icon: "🎮" },
  { id: "cat-2", name: "Digital Art", slug: "digital-art", icon: "🎨" },
  { id: "cat-3", name: "In-Game Items", slug: "in-game-items", icon: "⚔️" },
  { id: "cat-4", name: "Gift Cards", slug: "gift-cards", icon: "🎁" }
];

const DEMO_PRODUCTS = [
  {
    id: "prod-1",
    name: "Fortnite OG Account",
    description: "Rare OG skins including Renegade Raider and Aerial Assault Trooper. Full email access included.",
    price: 149.99,
    categoryId: "cat-1",
    categoryName: "Game Accounts",
    images: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80"
    ],
    featured: true,
    isNew: true,
    stock: 3,
    createdAt: Date.now() - 86400000
  },
  {
    id: "prod-2",
    name: "Cyberpunk Character Art",
    description: "Custom cyberpunk character illustration. 4K resolution, commercial license included.",
    price: 89.99,
    categoryId: "cat-2",
    categoryName: "Digital Art",
    images: [
      "https://images.unsplash.com/photo-1614726365723-49cfae927827?w=800&q=80"
    ],
    featured: true,
    isNew: false,
    stock: 10,
    createdAt: Date.now() - 172800000
  },
  {
    id: "prod-3",
    name: "Valorant Radiant Account",
    description: "Radiant rank account with premium skins bundle. Instant delivery via Telegram.",
    price: 299.99,
    categoryId: "cat-1",
    categoryName: "Game Accounts",
    images: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"
    ],
    featured: false,
    isNew: true,
    stock: 1,
    createdAt: Date.now() - 43200000
  },
  {
    id: "prod-4",
    name: "Steam $50 Gift Card",
    description: "Digital Steam wallet code. Delivered instantly after purchase confirmation.",
    price: 47.99,
    categoryId: "cat-4",
    categoryName: "Gift Cards",
    images: [
      "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0b?w=800&q=80"
    ],
    featured: true,
    isNew: false,
    stock: 25,
    createdAt: Date.now() - 259200000
  },
  {
    id: "prod-5",
    name: "CS2 Knife Skin Bundle",
    description: "Premium knife skins collection. Trade-ready items with verified authenticity.",
    price: 199.99,
    categoryId: "cat-3",
    categoryName: "In-Game Items",
    images: [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80"
    ],
    featured: false,
    isNew: true,
    stock: 5,
    createdAt: Date.now() - 7200000
  },
  {
    id: "prod-6",
    name: "Fantasy Landscape Art",
    description: "Epic fantasy landscape digital painting. Perfect for stream overlays and wallpapers.",
    price: 59.99,
    categoryId: "cat-2",
    categoryName: "Digital Art",
    images: [
      "https://images.unsplash.com/photo-1614726365723-49cfae927827?w=800&q=80"
    ],
    featured: false,
    isNew: false,
    stock: 15,
    createdAt: Date.now() - 604800000
  }
];
