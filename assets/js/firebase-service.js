const FirestoreRest = {
  _base() {
    return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
  },

  _toField(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number") {
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    }
    if (Array.isArray(value)) {
      return { arrayValue: { values: value.map((v) => this._toField(v)) } };
    }
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (typeof value === "object" && value.seconds !== undefined) {
      return { timestampValue: new Date(value.seconds * 1000).toISOString() };
    }
    return { stringValue: String(value) };
  },

  _fromField(field) {
    if ("stringValue" in field) return field.stringValue;
    if ("integerValue" in field) return parseInt(field.integerValue, 10);
    if ("doubleValue" in field) return field.doubleValue;
    if ("booleanValue" in field) return field.booleanValue;
    if ("nullValue" in field) return null;
    if ("timestampValue" in field) return new Date(field.timestampValue).getTime();
    if ("arrayValue" in field) {
      return (field.arrayValue.values || []).map((v) => this._fromField(v));
    }
    return null;
  },

  _toFields(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) fields[key] = this._toField(value);
    }
    return fields;
  },

  _fromDoc(doc) {
    const id = doc.name.split("/").pop();
    const data = {};
    for (const [key, field] of Object.entries(doc.fields || {})) {
      data[key] = this._fromField(field);
    }
    return { id, ...data };
  },

  _mapError(err, fallback) {
    const status = err?.error?.status || "";
    const codeMap = {
      PERMISSION_DENIED: "permission-denied",
      UNAUTHENTICATED: "unauthenticated",
      NOT_FOUND: "not-found"
    };
    throw {
      code: codeMap[status] || status.toLowerCase().replace(/_/g, "-") || "unknown",
      message: err?.error?.message || fallback
    };
  },

  async _headers(authRequired = false) {
    const headers = { "Content-Type": "application/json" };
    if (authRequired) {
      if (!auth?.currentUser) {
        throw { code: "unauthenticated", message: "You are not logged in. Please log in again." };
      }
      headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
    }
    return headers;
  },

  async listCollection(collection) {
    const url = `${this._base()}/${collection}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, { headers: await this._headers(false) });
    const json = await res.json();
    if (!res.ok) this._mapError(json, "Failed to load data");
    return (json.documents || []).map((doc) => this._fromDoc(doc));
  },

  async getDocument(collection, id) {
    const url = `${this._base()}/${collection}/${id}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, { headers: await this._headers(false) });
    if (res.status === 404) return null;
    const json = await res.json();
    if (!res.ok) this._mapError(json, "Failed to load document");
    return this._fromDoc(json);
  },

  async addDocument(collection, data) {
    const url = `${this._base()}/${collection}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: await this._headers(true),
      body: JSON.stringify({ fields: this._toFields(data) })
    });
    const json = await res.json();
    if (!res.ok) this._mapError(json, "Failed to save data");
    return json.name.split("/").pop();
  },

  async updateDocument(collection, id, data) {
    const keys = Object.keys(data).filter((k) => data[k] !== undefined);
    const mask = keys.map((k) => `updateMask.fieldPaths=${k}`).join("&");
    const url = `${this._base()}/${collection}/${id}?key=${firebaseConfig.apiKey}&${mask}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: await this._headers(true),
      body: JSON.stringify({ fields: this._toFields(data) })
    });
    const json = await res.json();
    if (!res.ok) this._mapError(json, "Failed to update data");
    return json;
  },

  async deleteDocument(collection, id) {
    const url = `${this._base()}/${collection}/${id}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: await this._headers(true)
    });
    if (res.status === 404) return;
    if (!res.ok) {
      const json = await res.json();
      this._mapError(json, "Failed to delete data");
    }
  },

  async testWriteAccess() {
    const id = await this.addDocument("categories", {
      name: "_test",
      icon: "✅",
      slug: "test"
    });
    await this.deleteDocument("categories", id);
    return true;
  }
};

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
      firestoreMode: "REST API (built-in)",
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
