const FirebaseService = {
  _ensureAuth() {
    if (!auth?.currentUser) {
      throw { code: "unauthenticated", message: "You are not logged in. Please log in again." };
    }
  },

  _ensureFirebase() {
    if (!initFirebase()) {
      throw { code: "firebase-init", message: "Firebase failed to start. Refresh the page." };
    }
  },

  async getCategories(options = {}) {
    if (STORE_CONFIG.demoMode) return DEMO_CATEGORIES;
    if (!initFirebase()) {
      if (options.strict) throw new Error("Firebase not connected. Check firebase/config.js and refresh the page.");
      return DEMO_CATEGORIES;
    }
    this._ensureFirebase();
    const categories = await FirestoreRest.listCollection("categories");
    return categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  },

  async getProducts(filters = {}) {
    if (STORE_CONFIG.demoMode || !initFirebase()) {
      let products = [...DEMO_PRODUCTS];
      if (filters.categoryId) products = products.filter((p) => p.categoryId === filters.categoryId);
      if (filters.featured) products = products.filter((p) => p.featured);
      if (filters.isNew) products = products.filter((p) => p.isNew);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            (p.categoryName && p.categoryName.toLowerCase().includes(q))
        );
      }
      return products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    this._ensureFirebase();
    let products = await FirestoreRest.listCollection("products");

    if (filters.categoryId) products = products.filter((p) => p.categoryId === filters.categoryId);
    if (filters.featured) products = products.filter((p) => p.featured);
    if (filters.isNew) products = products.filter((p) => p.isNew);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return products;
  },

  async getProduct(id) {
    if (STORE_CONFIG.demoMode || !initFirebase()) {
      return DEMO_PRODUCTS.find((p) => p.id === id) || null;
    }
    this._ensureFirebase();
    return FirestoreRest.getDocument("products", id);
  },

  async getRelatedProducts(product, limit = 4) {
    const all = await this.getProducts({ categoryId: product.categoryId });
    return all.filter((p) => p.id !== product.id).slice(0, limit);
  },

  async addProduct(data) {
    this._ensureFirebase();
    this._ensureAuth();
    return FirestoreRest.addDocument("products", {
      ...data,
      createdAt: Date.now()
    });
  },

  async updateProduct(id, data) {
    this._ensureFirebase();
    this._ensureAuth();
    await FirestoreRest.updateDocument("products", id, data);
  },

  async deleteProduct(id) {
    this._ensureFirebase();
    this._ensureAuth();
    await FirestoreRest.deleteDocument("products", id);
  },

  async addCategory(data) {
    this._ensureFirebase();
    this._ensureAuth();
    return FirestoreRest.addDocument("categories", data);
  },

  async updateCategory(id, data) {
    this._ensureFirebase();
    this._ensureAuth();
    await FirestoreRest.updateDocument("categories", id, data);
  },

  async deleteCategory(id) {
    this._ensureFirebase();
    this._ensureAuth();
    await FirestoreRest.deleteDocument("categories", id);
  },

  async testWriteAccess() {
    this._ensureFirebase();
    this._ensureAuth();
    return FirestoreRest.testWriteAccess();
  },

  getDiagnostics() {
    initFirebase();
    return {
      projectId: firebaseConfig?.projectId || "unknown",
      firebaseLoaded: typeof firebase !== "undefined",
      firestoreMode: "REST API (bypasses SDK block)",
      loggedIn: !!auth?.currentUser,
      email: auth?.currentUser?.email || null
    };
  },

  async seedSampleData() {
    this._ensureFirebase();
    this._ensureAuth();

    const [categories, products] = await Promise.all([
      FirestoreRest.listCollection("categories"),
      FirestoreRest.listCollection("products")
    ]);

    if (categories.length || products.length) {
      throw new Error("Database already has data. Import only works on an empty store.");
    }

    const idMap = {};
    for (const cat of DEMO_CATEGORIES) {
      const { id, ...data } = cat;
      idMap[id] = await FirestoreRest.addDocument("categories", data);
    }

    for (const prod of DEMO_PRODUCTS) {
      const { id, createdAt, ...data } = prod;
      await FirestoreRest.addDocument("products", {
        ...data,
        categoryId: idMap[data.categoryId],
        createdAt: Date.now()
      });
    }

    return { categories: DEMO_CATEGORIES.length, products: DEMO_PRODUCTS.length };
  },

  async uploadImage(file, path) {
    if (!storage) throw new Error("Storage not connected. Enable Firebase Storage in Console.");
    const compressed = await ImageUtils.compress(file);
    const ref = storage.ref(path);
    await ref.put(compressed);
    return await ref.getDownloadURL();
  },

  async getStats() {
    if (STORE_CONFIG.demoMode || !initFirebase()) {
      return {
        totalProducts: DEMO_PRODUCTS.length,
        totalCategories: DEMO_CATEGORIES.length,
        featured: DEMO_PRODUCTS.filter((p) => p.featured).length,
        lowStock: DEMO_PRODUCTS.filter((p) => p.stock <= 3).length
      };
    }
    this._ensureFirebase();
    const [products, categories] = await Promise.all([
      FirestoreRest.listCollection("products"),
      FirestoreRest.listCollection("categories")
    ]);
    return {
      totalProducts: products.length,
      totalCategories: categories.length,
      featured: products.filter((p) => p.featured).length,
      lowStock: products.filter((p) => p.stock <= 3).length
    };
  }
};
