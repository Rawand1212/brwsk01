const AdminUI = {
  sidebar(activePage) {
    return `
    <aside class="admin-sidebar" id="adminSidebar">
      <div class="sidebar-brand">
        <h2>🎮 brwsk01</h2>
        <span>Admin Panel</span>
      </div>
      <nav class="sidebar-nav">
        <a href="dashboard.html" class="${activePage === "dashboard" ? "active" : ""}"><span class="nav-icon">📊</span> Dashboard</a>
        <a href="products.html" class="${activePage === "products" ? "active" : ""}"><span class="nav-icon">📦</span> Products</a>
        <a href="categories.html" class="${activePage === "categories" ? "active" : ""}"><span class="nav-icon">📁</span> Categories</a>
        <a href="settings.html" class="${activePage === "settings" ? "active" : ""}"><span class="nav-icon">⚙️</span> Settings</a>
      </nav>
      <div class="sidebar-footer">
        <button class="btn btn-secondary" id="logoutBtn">Logout</button>
      </div>
    </aside>`;
  },

  injectLayout(activePage) {
    const layout = document.querySelector(".admin-layout");
    if (layout) {
      layout.insertAdjacentHTML("afterbegin", this.sidebar(activePage));
    }
    document.getElementById("logoutBtn")?.addEventListener("click", () => AdminAuth.logout());
  },

  showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " toast-error" : ""}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  },

  formatError(err) {
    const code = err?.code || "";
    const messages = {
      "permission-denied": "Permission denied. Update Firestore rules in Firebase Console (see Settings page).",
      "unauthenticated": "You are not logged in. Please log in again.",
      "not-found": "Firestore API blocked. Fix: Google Cloud → Credentials → API key → allow Cloud Firestore API + add rawand1212.github.io/* as referrer. Or disable ad blocker.",
      "firebase-blocked": "Firebase SDK blocked. Disable ad blocker for this site.",
      "firestore-blocked": "Firestore SDK blocked. Disable ad blocker (uBlock, AdBlock, Privacy Badger).",
      "failed-precondition": "Firestore index required. Try again or check Firebase Console.",
      "storage/unauthorized": "Storage permission denied. Update Storage rules in Firebase Console.",
      "storage/not-configured": "Firebase Storage not enabled. Enable it in Firebase Console → Storage.",
      "storage/timeout": "Image upload timed out. Save without images, or paste an image URL.",
      "storage/upload-failed": "Image upload failed. Enable Firebase Storage or paste an image URL.",
      "auth/timeout": "Login timed out. Refresh the page and sign in again."
    };
    return messages[code] || err?.message || "Something went wrong. Try again.";
  },

  openModal(title, bodyHtml, onSave) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
          <button type="button" class="btn btn-primary modal-save">Save to Store</button>
        </div>
      </div>`;

    const close = () => overlay.remove();
    overlay.querySelector(".modal-close").addEventListener("click", close);
    overlay.querySelector(".modal-cancel").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    overlay.querySelector(".modal-save").addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const btn = overlay.querySelector(".modal-save");
      btn.disabled = true;
      btn.textContent = "Saving...";
      try {
        await onSave(overlay);
        close();
      } catch (err) {
        AdminUI.showToast(AdminUI.formatError(err), true);
      } finally {
        btn.disabled = false;
        btn.textContent = "Save to Store";
      }
    });

    document.body.appendChild(overlay);
    return overlay;
  }
};

const ImageUpload = {
  pendingFiles: [],

  renderZone(container, existingImages = []) {
    container.innerHTML = `
      <div class="image-upload-zone" id="uploadZone">
        <p>📷 Click or drop photos here</p>
        <p style="font-size:0.8rem;margin-top:0.5rem">Photos are saved with the product (max 3)</p>
        <input type="file" id="fileInput" accept="image/*" multiple hidden>
      </div>
      <div class="image-preview-grid" id="previewGrid"></div>
      <div style="display:flex;gap:0.5rem;margin-top:0.75rem;align-items:center">
        <input type="url" class="form-input" id="imageUrlInput" placeholder="Or paste image URL (https://...)">
        <button type="button" class="btn btn-secondary btn-sm" id="addUrlBtn">Add URL</button>
      </div>`;

    const zone = container.querySelector("#uploadZone");
    const input = container.querySelector("#fileInput");
    const grid = container.querySelector("#previewGrid");

    this.pendingFiles = [];
    (existingImages || []).forEach((url) => this.addPreview(grid, url, true));

    zone.addEventListener("click", () => input.click());
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
      this.handleFiles(e.dataTransfer.files, grid);
    });
    input.addEventListener("change", () => {
      this.handleFiles(input.files, grid);
      input.value = "";
    });

    container.querySelector("#addUrlBtn").addEventListener("click", () => {
      const urlInput = container.querySelector("#imageUrlInput");
      const url = urlInput.value.trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) {
        AdminUI.showToast("Image URL must start with http:// or https://", true);
        return;
      }
      this.addPreview(grid, url, true);
      urlInput.value = "";
    });
  },

  async handleFiles(files, grid) {
    const existingCount = grid.querySelectorAll(".image-preview").length;
    let added = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (existingCount + added >= 3) {
        AdminUI.showToast("Maximum 3 images per product", true);
        break;
      }
      try {
        const dataUrl = await ImageUtils.toDataUrl(file);
        this.addPreview(grid, dataUrl, true);
        added += 1;
      } catch (err) {
        AdminUI.showToast("Could not process image: " + (err.message || "unknown error"), true);
      }
    }
  },

  addPreview(grid, url, isExisting) {
    const div = document.createElement("div");
    div.className = "image-preview";
    div.dataset.url = url;
    div.dataset.existing = "true";
    div.innerHTML = `<img src="${url}" alt=""><button class="remove-img" type="button">&times;</button>`;
    div.querySelector(".remove-img").addEventListener("click", () => div.remove());
    grid.appendChild(div);
  },

  getExistingUrls(grid) {
    if (!grid) return [];
    return [...grid.querySelectorAll(".image-preview")].map((el) => el.dataset.url).filter(Boolean);
  },

  takePendingFiles() {
    return [];
  },

  async uploadFiles() {
    return [];
  }
};
