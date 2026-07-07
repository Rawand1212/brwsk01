const FirebaseService = {
  async getCategories() {
    if (STORE_CONFIG.demoMode || !initFirebase()) {
      return DEMO_CATEGORIES;
    }
    const snap = await db.collection("categories").orderBy("name").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async getProducts(filters = {}) {
    if (STORE_CONFIG.demoMode || !initFirebase()) {
      let products = [...DEMO_PRODUCTS];
      if (filters.categoryId) {
        products = products.filter((p) => p.categoryId === filters.categoryId);
      }
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

    let query = db.collection("products");
    if (filters.categoryId) query = query.where("categoryId", "==", filters.categoryId);
    if (filters.featured) query = query.where("featured", "==", true);
    if (filters.isNew) query = query.where("isNew", "==", true);

    const snap = await query.orderBy("createdAt", "desc").get();
    let products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return products;
  },

  async getProduct(id) {
    if (STORE_CONFIG.demoMode || !initFirebase()) {
      return DEMO_PRODUCTS.find((p) => p.id === id) || null;
    }
    const doc = await db.collection("products").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async getRelatedProducts(product, limit = 4) {
    const all = await this.getProducts({ categoryId: product.categoryId });
    return all.filter((p) => p.id !== product.id).slice(0, limit);
  },

  // Admin operations
  async addProduct(data) {
    const doc = await db.collection("products").add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return doc.id;
  },

  async updateProduct(id, data) {
    await db.collection("products").doc(id).update(data);
  },

  async deleteProduct(id) {
    await db.collection("products").doc(id).delete();
  },

  async addCategory(data) {
    const doc = await db.collection("categories").add(data);
    return doc.id;
  },

  async updateCategory(id, data) {
    await db.collection("categories").doc(id).update(data);
  },

  async deleteCategory(id) {
    await db.collection("categories").doc(id).delete();
  },

  async uploadImage(file, path) {
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
