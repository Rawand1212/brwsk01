const Products = {
  isAvailable(product) {
    if (typeof product?.available === "boolean") return product.available;
    return (product?.stock ?? 0) > 0;
  },

  downloadIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  },

  renderCard(product) {
    const img = product.images?.[0] || "assets/images/placeholder.svg";
    const badges = [];
    if (product.featured) badges.push(`<span class="badge badge-featured">${I18N.t("badgeFeatured")}</span>`);
    if (product.isNew) badges.push(`<span class="badge badge-new">${I18N.t("badgeNew")}</span>`);
    if (!this.isAvailable(product)) badges.push(`<span class="badge badge-sold">${I18N.t("soldOut")}</span>`);
    const safeName = String(product.name || "product").replace(/"/g, "&quot;");

    return `
      <article class="product-card animate-in" data-id="${product.id}">
        <a href="product.html?id=${product.id}" class="product-card-link">
          <div class="product-card-image">
            <img data-src="${img}" alt="${safeName}" class="product-img">
            <div class="product-badges">${badges.join("")}</div>
          </div>
          <div class="product-card-body">
            <span class="product-category">${product.categoryName || ""}</span>
            <h3 class="product-name">${product.name}</h3>
          </div>
        </a>
        <button type="button" class="btn-download" data-download-name="${safeName}.jpg" title="${I18N.t("download")}" aria-label="${I18N.t("download")}">
          ${this.downloadIcon()}
          <span>${I18N.t("download")}</span>
        </button>
      </article>`;
  },

  bindDownloadButtons(container) {
    if (!container) return;
    container.querySelectorAll(".btn-download").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest(".product-card");
        const imgEl = card?.querySelector(".product-img");
        const url = imgEl?.src || imgEl?.dataset.src || "";
        UI.downloadImage(url, btn.dataset.downloadName || "product.jpg");
      });
    });
  },

  renderGrid(products, container) {
    if (!container) return;
    if (!products.length) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>${I18N.t("noProducts")}</p></div>`;
      return;
    }
    container.innerHTML = products.map((p) => this.renderCard(p)).join("");
    ImageUtils.lazyLoad();
    UI.animateOnScroll();
    this.bindDownloadButtons(container);
  },

  renderCategoryPills(categories, container, activeId = null) {
    if (!container) return;
    const pills = categories
      .map(
        (c) =>
          `<a href="products.html?category=${c.id}" class="category-pill ${activeId === c.id ? "active" : ""}">${c.icon || ""} ${c.name}</a>`
      )
      .join("");
    container.innerHTML = pills;
  },

  renderCategoryGrid(categories, container) {
    if (!container) return;
    if (!categories.length) {
      container.innerHTML = `<div class="empty-state"><p>${I18N.t("noProducts")}</p></div>`;
      return;
    }
    container.innerHTML = categories
      .map(
        (c) => `
      <a href="products.html?category=${c.id}" class="category-card animate-in">
        <span class="category-card-icon">${c.icon || "📁"}</span>
        <span class="category-card-name">${c.name}</span>
      </a>`
      )
      .join("");
    UI.animateOnScroll();
  }
};

const Search = {
  debounceTimer: null,

  init(inputEl, suggestionsEl) {
    if (!inputEl) return;

    inputEl.addEventListener("input", () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.search(inputEl.value, suggestionsEl), 250);
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && inputEl.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(inputEl.value.trim())}`;
      }
    });

    document.addEventListener("click", (e) => {
      if (suggestionsEl && !e.target.closest(".search-wrapper")) {
        suggestionsEl.classList.remove("show");
      }
    });
  },

  async search(query, suggestionsEl) {
    if (!query || query.length < 2) {
      suggestionsEl?.classList.remove("show");
      return;
    }
    const products = await FirebaseService.getProducts({ search: query });
    const categories = (await FirebaseService.getCategories()).filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );

    if (!suggestionsEl) return;
    if (!products.length && !categories.length) {
      suggestionsEl.classList.remove("show");
      return;
    }

    suggestionsEl.innerHTML = [
      ...categories.slice(0, 3).map((c) => `<a href="products.html?category=${c.id}" class="suggestion-item">${c.icon || ""} ${c.name}</a>`),
      ...products.slice(0, 5).map((p) => `<a href="product.html?id=${p.id}" class="suggestion-item"><img src="${p.images?.[0] || "assets/images/placeholder.svg"}" alt=""><span>${p.name}</span></a>`)
    ].join("");
    suggestionsEl.classList.add("show");
  }
};
