const FirestoreRest = {
  _base() {
    return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
  },

  async _authToken(ms = 15000) {
    if (!auth?.currentUser) {
      throw { code: "unauthenticated", message: "You are not logged in. Please log in again." };
    }
    return Promise.race([
      auth.currentUser.getIdToken(),
      new Promise((_, reject) =>
        setTimeout(() => reject({ code: "auth/timeout", message: "Login timed out. Refresh and sign in again." }), ms)
      )
    ]);
  },

  _toField(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number") {
      if (Number.isNaN(value)) return { nullValue: null };
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    }
    if (Array.isArray(value)) {
      return { arrayValue: { values: value.map((v) => this._toField(v)) } };
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

  async _parseResponse(res, fallback) {
    const text = await res.text();
    let json = {};
    if (text) {
      try { json = JSON.parse(text); } catch { json = { error: { message: text } }; }
    }
    if (!res.ok) this._mapError(json, fallback);
    return json;
  },

  async _headers(authRequired = false) {
    const headers = { "Content-Type": "application/json" };
    if (authRequired) {
      headers.Authorization = `Bearer ${await this._authToken()}`;
    }
    return headers;
  },

  async listCollection(collection) {
    const url = `${this._base()}/${collection}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url);
    const json = await this._parseResponse(res, "Failed to load data");
    return (json.documents || []).map((doc) => this._fromDoc(doc));
  },

  async getDocument(collection, id) {
    const url = `${this._base()}/${collection}/${id}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    const json = await this._parseResponse(res, "Failed to load document");
    return this._fromDoc(json);
  },

  async addDocument(collection, data) {
    const url = `${this._base()}/${collection}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: await this._headers(true),
      body: JSON.stringify({ fields: this._toFields(data) })
    });
    const json = await this._parseResponse(res, "Failed to save data");
    return json.name.split("/").pop();
  },

  async updateDocument(collection, id, data) {
    const keys = Object.keys(data).filter((k) => data[k] !== undefined);
    if (!keys.length) return;
    const mask = keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
    const url = `${this._base()}/${collection}/${id}?key=${firebaseConfig.apiKey}&${mask}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: await this._headers(true),
      body: JSON.stringify({ fields: this._toFields(data) })
    });
    await this._parseResponse(res, "Failed to update data");
  },

  async deleteDocument(collection, id) {
    const url = `${this._base()}/${collection}/${id}?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: await this._headers(true)
    });
    if (res.status === 404) return;
    await this._parseResponse(res, "Failed to delete data");
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

const StorageRest = {
  async upload(file, path, timeoutMs = 45000) {
    initFirebase();
    if (!auth?.currentUser) {
      throw { code: "unauthenticated", message: "You are not logged in. Please log in again." };
    }

    const bucket = firebaseConfig.storageBucket;
    const token = await FirestoreRest._authToken();
    const url =
      `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o` +
      `?uploadType=media&name=${encodeURIComponent(path)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "image/jpeg"
        },
        body: file,
        signal: controller.signal
      });

      const text = await res.text();
      let json = {};
      if (text) {
        try { json = JSON.parse(text); } catch { json = { error: { message: text } }; }
      }

      if (!res.ok) {
        throw {
          code: res.status === 403 ? "storage/unauthorized" : "storage/upload-failed",
          message: json.error?.message || "Image upload failed. Enable Storage in Firebase Console."
        };
      }

      const encoded = encodeURIComponent(json.name);
      const downloadToken = json.downloadTokens?.split(",")[0] || "";
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media&token=${downloadToken}`;
    } catch (err) {
      if (err.name === "AbortError") {
        throw { code: "storage/timeout", message: "Image upload timed out. Try a smaller image or paste an image URL instead." };
      }
      throw err.code ? err : { code: "storage/upload-failed", message: err.message || "Image upload failed." };
    } finally {
      clearTimeout(timer);
    }
  }
};

const FirebaseService = {
  _ensureAuth() {
    initFirebase();
    if (!auth?.currentUser) {
      throw { code: "unauthenticated", message: "You are not logged in. Please log in again." };
    }
  },

  _useDemo() {
    return STORE_CONFIG.demoMode === true;
  },

  async getCategories(options = {}) {
    if (this._useDemo()) return DEMO_CATEGORIES;
    let categories = await FirestoreRest.listCollection("categories");
    if (!options.includeBroken) {
      categories = categories.filter((c) => c.id && c.id !== "undefined");
    }
    return categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  },

  async getProducts(filters = {}) {
    if (this._useDemo()) {
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
      return this.sortProducts(products, filters.sort);
    }

    let products = await FirestoreRest.listCollection("products");

    if (filters.categoryId) products = products.filter((p) => p.categoryId === filters.categoryId);
    if (filters.featured) products = products.filter((p) => p.featured);
    if (filters.isNew) products = products.filter((p) => p.isNew);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return this.sortProducts(products, filters.sort);
  },

  sortProducts(products, sort = "newest") {
    const list = [...products];
    if (sort === "alpha") {
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
    }
    if (sort === "alpha-desc") {
      return list.sort((a, b) => (b.name || "").localeCompare(a.name || "", undefined, { sensitivity: "base" }));
    }
    // newest first (default)
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async getProduct(id) {
    if (this._useDemo()) return DEMO_PRODUCTS.find((p) => p.id === id) || null;
    return FirestoreRest.getDocument("products", id);
  },

  async getRelatedProducts(product, limit = 4) {
    const all = await this.getProducts({ categoryId: product.categoryId });
    return all.filter((p) => p.id !== product.id).slice(0, limit);
  },

  async addProduct(data) {
    this._ensureAuth();
    const available = data.available !== false;
    return FirestoreRest.addDocument("products", {
      ...data,
      available,
      stock: available ? (data.stock > 0 ? data.stock : 1) : 0,
      images: data.images || [],
      createdAt: Date.now()
    });
  },

  async updateProduct(id, data) {
    if (!id) {
      throw { code: "invalid-argument", message: "Invalid product ID." };
    }
    this._ensureAuth();
    await FirestoreRest.updateDocument("products", id, data);
  },

  async deleteProduct(id) {
    if (!id) {
      throw { code: "invalid-argument", message: "Invalid product ID." };
    }
    this._ensureAuth();
    await FirestoreRest.deleteDocument("products", id);
  },

  async addCategory(data) {
    this._ensureAuth();
    return FirestoreRest.addDocument("categories", data);
  },

  async updateCategory(id, data) {
    if (!id) {
      throw { code: "invalid-argument", message: "Invalid category ID." };
    }
    this._ensureAuth();
    await FirestoreRest.updateDocument("categories", id, data);
  },

  async deleteCategory(id) {
    if (!id) {
      throw { code: "invalid-argument", message: "Invalid category ID." };
    }
    this._ensureAuth();
    await FirestoreRest.deleteDocument("categories", id);
  },

  async testWriteAccess() {
    this._ensureAuth();
    return FirestoreRest.testWriteAccess();
  },

  getDiagnostics() {
    initFirebase();
    return {
      projectId: firebaseConfig?.projectId || "unknown",
      demoMode: STORE_CONFIG.demoMode,
      firebaseLoaded: typeof firebase !== "undefined",
      firestoreMode: "REST API",
      loggedIn: !!auth?.currentUser,
      email: auth?.currentUser?.email || null
    };
  },

  async seedSampleData() {
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
    initFirebase();
    const compressed = await ImageUtils.compress(file);

    try {
      return await StorageRest.upload(compressed, path);
    } catch (restErr) {
      if (!storage) throw restErr;

      const uploadTask = storage.ref(path).put(compressed);
      const result = await Promise.race([
        uploadTask.then((snap) => snap.ref.getDownloadURL()),
        new Promise((_, reject) =>
          setTimeout(
            () => reject({ code: "storage/timeout", message: "Image upload timed out. Paste an image URL instead." }),
            30000
          )
        )
      ]);
      return result;
    }
  },

  async getStats() {
    if (this._useDemo()) {
      return {
        totalProducts: DEMO_PRODUCTS.length,
        totalCategories: DEMO_CATEGORIES.length,
        featured: DEMO_PRODUCTS.filter((p) => p.featured).length,
        lowStock: DEMO_PRODUCTS.filter((p) => p.stock <= 3).length
      };
    }
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
