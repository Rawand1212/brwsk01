const I18N = {
  STORAGE_KEY: "rawand-lang",

  strings: {
    en: {
      home: "Home",
      products: "Products",
      search: "Search",
      searchPlaceholder: "Search products...",
      browse: "Browse Products",
      heroTitle: "brwsk01",
      heroSubtitle: "Games and digital items. Order on Telegram.",
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
      share: "Share",
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
      heroTitle: "brwsk01",
      heroSubtitle: "یاری و کاڵای دیجیتاڵ. داواکاری لە تێلێگرام.",
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
      share: "هاوبەشکردن",
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
