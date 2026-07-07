const AdminUI = {
  sidebar(activePage) {
    return `
    <aside class="admin-sidebar" id="adminSidebar">
      <div class="sidebar-brand">
        <h2>🎮 Rawand Artist</h2>
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
    setTimeout(() => toast.remove(), 3000);
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
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary modal-save">Save</button>
        </div>
      </div>`;

    const close = () => overlay.remove();
    overlay.querySelector(".modal-close").addEventListener("click", close);
    overlay.querySelector(".modal-cancel").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    overlay.querySelector(".modal-save").addEventListener("click", async () => {
      const btn = overlay.querySelector(".modal-save");
      btn.disabled = true;
      btn.textContent = "Saving...";
      try {
        await onSave(overlay);
        close();
      } catch (err) {
        AdminUI.showToast(err.message || "Save failed", true);
        btn.disabled = false;
        btn.textContent = "Save";
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
        <p>📷 Drag & drop images here or click to browse</p>
        <p style="font-size:0.8rem;margin-top:0.5rem">Images are automatically compressed</p>
        <input type="file" id="fileInput" accept="image/*" multiple hidden>
      </div>
      <div class="image-preview-grid" id="previewGrid"></div>`;

    const zone = container.querySelector("#uploadZone");
    const input = container.querySelector("#fileInput");
    const grid = container.querySelector("#previewGrid");

    this.pendingFiles = [];
    existingImages.forEach((url) => this.addPreview(grid, url, true));

    zone.addEventListener("click", () => input.click());
    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
      this.handleFiles(e.dataTransfer.files, grid);
    });
    input.addEventListener("change", () => this.handleFiles(input.files, grid));
  },

  async handleFiles(files, grid) {
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const compressed = await ImageUtils.compress(file);
      this.pendingFiles.push(compressed);
      const url = URL.createObjectURL(compressed);
      this.addPreview(grid, url, false);
    }
  },

  addPreview(grid, url, isExisting) {
    const div = document.createElement("div");
    div.className = "image-preview";
    div.dataset.url = url;
    div.dataset.existing = isExisting;
    div.innerHTML = `<img src="${url}" alt=""><button class="remove-img" type="button">&times;</button>`;
    div.querySelector(".remove-img").addEventListener("click", () => {
      if (!isExisting) {
        const idx = this.pendingFiles.findIndex((f) => URL.createObjectURL(f) === url);
        if (idx >= 0) this.pendingFiles.splice(idx, 1);
      }
      div.remove();
    });
    grid.appendChild(div);
  },

  getExistingUrls(grid) {
    return [...grid.querySelectorAll(".image-preview")]
      .filter((el) => el.dataset.existing === "true")
      .map((el) => el.dataset.url);
  },

  async uploadAll(productId) {
    const urls = [];
    for (let i = 0; i < this.pendingFiles.length; i++) {
      const url = await FirebaseService.uploadImage(
        this.pendingFiles[i],
        `products/${productId}/${Date.now()}_${i}.jpg`
      );
      urls.push(url);
    }
    return urls;
  }
};
