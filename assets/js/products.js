const Products = {
  renderCard(product) {
    const img = product.images?.[0] || "assets/images/placeholder.svg";
    const badges = [];
    if (product.featured) badges.push('<span class="badge badge-featured">Featured</span>');
    if (product.isNew) badges.push('<span class="badge badge-new">New</span>');
    if (product.stock <= 0) badges.push('<span class="badge badge-sold">Sold Out</span>');
    else if (product.stock <= 3) badges.push('<span class="badge badge-low">Low Stock</span>');

    return `
      <article class="product-card animate-in" data-id="${product.id}">
        <a href="product.html?id=${product.id}" class="product-card-link">
          <div class="product-card-image">
            <img data-src="${img}" alt="${product.name}" class="product-img">
            <div class="product-badges">${badges.join("")}</div>
          </div>
          <div class="product-card-body">
            <span class="product-category">${product.categoryName || ""}</span>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${UI.formatPrice(product.price)}</p>
          </div>
        </a>
      </article>`;
  },

  renderGrid(products, container) {
    if (!container) return;
    if (!products.length) {
      container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>No products found</p></div>`;
      return;
    }
    container.innerHTML = products.map((p) => this.renderCard(p)).join("");
    ImageUtils.lazyLoad();
    UI.animateOnScroll();
  },

  renderCategoryPills(categories, container, activeId = null) {
    if (!container) return;
    const allPill = `<a href="products.html" class="category-pill ${!activeId ? "active" : ""}">All</a>`;
    const pills = categories
      .map(
        (c) =>
          `<a href="products.html?category=${c.id}" class="category-pill ${activeId === c.id ? "active" : ""}">${c.icon || ""} ${c.name}</a>`
      )
      .join("");
    container.innerHTML = allPill + pills;
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

    let html = "";
    categories.slice(0, 3).forEach((c) => {
      html += `<a href="products.html?category=${c.id}" class="suggestion-item"><span class="suggestion-icon">${c.icon || "📁"}</span> ${c.name} <span class="suggestion-type">Category</span></a>`;
    });
    products.slice(0, 5).forEach((p) => {
      html += `<a href="product.html?id=${p.id}" class="suggestion-item"><img src="${p.images?.[0] || ""}" alt=""> ${p.name} <span class="suggestion-type">${UI.formatPrice(p.price)}</span></a>`;
    });

    if (!html) html = `<div class="suggestion-empty">No results for "${query}"</div>`;
    suggestionsEl.innerHTML = html;
    suggestionsEl.classList.add("show");
  }
};
