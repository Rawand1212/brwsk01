const FirebaseService = {
  _ensureDb() {
    if (!initFirebase() || !db) {
      throw new Error("Database not connected. Create Firestore in Firebase Console.");
    }
  },

  _ensureAuth() {
    if (!auth?.currentUser) {
      throw { code: "unauthenticated", message: "You are not logged in. Please log in again." };
    }
  },

  async getCategories(options = {}) {
    if (STORE_CONFIG.demoMode) {
      return DEMO_CATEGORIES;
    }
    if (!initFirebase()) {
      if (options.strict) {
        throw new Error("Firebase not connected. Check firebase/config.js and refresh the page.");
      }
      return DEMO_CATEGORIES;
    }
    this._ensureDb();
    const snap = await db.collection("categories").get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
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

    this._ensureDb();
    let query = db.collection("products");
    if (filters.categoryId) query = query.where("categoryId", "==", filters.categoryId);
    if (filters.featured) query = query.where("featured", "==", true);
    if (filters.isNew) query = query.where("isNew", "==", true);

    const snap = await query.get();
    let products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    products.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || a.createdAt || 0;
      const tb = b.createdAt?.toMillis?.() || b.createdAt || 0;
      return tb - ta;
    });

    return products;
  },

  async getProduct(id) {
    if (STORE_CONFIG.demoMode || !initFirebase()) {
      return DEMO_PRODUCTS.find((p) => p.id === id) || null;
    }
    this._ensureDb();
    const doc = await db.collection("products").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async getRelatedProducts(product, limit = 4) {
    const all = await this.getProducts({ categoryId: product.categoryId });
    return all.filter((p) => p.id !== product.id).slice(0, limit);
  },

  async addProduct(data) {
    this._ensureDb();
    const doc = await db.collection("products").add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return doc.id;
  },

  async updateProduct(id, data) {
    this._ensureDb();
    await db.collection("products").doc(id).update(data);
  },

  async deleteProduct(id) {
    this._ensureDb();
    await db.collection("products").doc(id).delete();
  },

  async addCategory(data) {
    this._ensureDb();
    this._ensureAuth();
    const doc = await db.collection("categories").add(data);
    return doc.id;
  },

  async updateCategory(id, data) {
    this._ensureDb();
    this._ensureAuth();
    await db.collection("categories").doc(id).update(data);
  },

  async deleteCategory(id) {
    this._ensureDb();
    this._ensureAuth();
    await db.collection("categories").doc(id).delete();
  },

  async seedSampleData() {
    this._ensureDb();
    this._ensureAuth();

    const [catSnap, prodSnap] = await Promise.all([
      db.collection("categories").limit(1).get(),
      db.collection("products").limit(1).get()
    ]);

    if (!catSnap.empty || !prodSnap.empty) {
      throw new Error("Database already has data. Import only works on an empty store.");
    }

    const idMap = {};
    for (const cat of DEMO_CATEGORIES) {
      const { id, ...data } = cat;
      const doc = await db.collection("categories").add(data);
      idMap[id] = doc.id;
    }

    for (const prod of DEMO_PRODUCTS) {
      const { id, createdAt, ...data } = prod;
      await db.collection("products").add({
        ...data,
        categoryId: idMap[data.categoryId],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
    this._ensureDb();
    const [products, categories] = await Promise.all([
      db.collection("products").get(),
      db.collection("categories").get()
    ]);
    const prods = products.docs.map((d) => d.data());
    return {
      totalProducts: products.size,
      totalCategories: categories.size,
      featured: prods.filter((p) => p.featured).length,
      lowStock: prods.filter((p) => p.stock <= 3).length
    };
  }
};
