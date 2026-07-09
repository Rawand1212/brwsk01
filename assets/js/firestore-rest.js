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
