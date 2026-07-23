const I18N = {
  STORAGE_KEY: "rawand-lang",

  strings: {
    en: {
      home: "Home",
      products: "Products",
      search: "Search",
      searchPlaceholder: "Search products...",
      browse: "Browse Products",
      heroTitle: "BRWSK01",
      heroSubtitle: "Games and digital items. Order on Telegram.",
      chooseCategory: "Choose a category",
      categories: "Categories",
      allProducts: "All Products",
      allProductsSub: "Browse the store",
      featured: "Featured",
      newArrivals: "New",
      noProducts: "No products yet",
      productNotFound: "Product not found",
      related: "Related Products",
      inStock: "In Stock",
      lowStock: "Only {n} left",
      outOfStock: "Out of Stock",
      soldOut: "Sold Out",
      buyTelegram: "Buy on Telegram",
      watchVideo: "Watch Video",
      download: "Download",
      noImage: "No image to download",
      share: "Share",
      sortBy: "Sort",
      sortNewest: "Newest",
      sortAlpha: "A–Z",
      sortAlphaDesc: "Z–A",
      loading: "Loading...",
      shop: "Shop",
      contact: "Contact",
      telegram: "Telegram",
      tiktok: "TikTok",
      phone: "Phone",
      allRights: "All rights reserved.",
      langToggle: "کوردی",
      badgeFeatured: "Featured",
      badgeNew: "New"
    },
    ku: {
      home: "سەرەکی",
      products: "بەرهەمەکان",
      search: "گەڕان",
      searchPlaceholder: "گەڕان بۆ بەرهەم...",
      browse: "بینینی بەرهەمەکان",
      heroTitle: "BRWSK01",
      heroSubtitle: "یاری و کاڵای دیجیتاڵ. داواکاری لە تێلێگرام.",
      chooseCategory: "پۆلێک هەڵبژێرە",
      categories: "پۆلەکان",
      allProducts: "هەموو بەرهەمەکان",
      allProductsSub: "سەیری فرۆشگا بکە",
      featured: "تایبەت",
      newArrivals: "نوێ",
      noProducts: "هیچ بەرهەمێک نییە",
      productNotFound: "بەرهەم نەدۆزرایەوە",
      related: "بەرهەمی هاوشێوە",
      inStock: "بەردەستە",
      lowStock: "تەنها {n} ماوە",
      outOfStock: "نەماوە",
      soldOut: "فرۆشراوە",
      buyTelegram: "کڕین لە تێلێگرام",
      watchVideo: "بینینی ڤیدیۆ",
      download: "داگرتن",
      noImage: "وێنە نییە بۆ داگرتن",
      share: "هاوبەشکردن",
      sortBy: "ڕیزکردن",
      sortNewest: "نوێترین",
      sortAlpha: "أ–ی",
      sortAlphaDesc: "ی–أ",
      loading: "چاوەڕوان بە...",
      shop: "فرۆشگا",
      contact: "پەیوەندی",
      telegram: "تێلێگرام",
      tiktok: "تیک تۆک",
      phone: "مۆبایل",
      allRights: "هەموو مافەکان پارێزراون.",
      langToggle: "EN",
      badgeFeatured: "تایبەت",
      badgeNew: "نوێ"
    }
  },

  getLang() {
    return localStorage.getItem(this.STORAGE_KEY) || STORE_CONFIG.defaultLang || "ku";
  },

  setLang(lang) {
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.apply();
  },

  t(key, vars = {}) {
    const lang = this.getLang();
    let text = this.strings[lang]?.[key] || this.strings.en[key] || key;
    Object.keys(vars).forEach((k) => {
      text = text.replace(`{${k}}`, vars[k]);
    });
    return text;
  },

  apply() {
    const lang = this.getLang();
    const html = document.documentElement;
    html.lang = lang === "ku" ? "ckb" : "en";
    html.dir = lang === "ku" ? "rtl" : "ltr";
    html.dataset.lang = lang;
  },

  toggle() {
    this.setLang(this.getLang() === "ku" ? "en" : "ku");
    window.location.reload();
  }
};
