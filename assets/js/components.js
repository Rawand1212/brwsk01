const Components = {
  header(activePage = "") {
    return `
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="logo">
          <span class="logo-icon">🎮</span>
          <span class="logo-text">${STORE_CONFIG.name}</span>
        </a>
        <nav class="main-nav" id="mainNav">
          <a href="index.html" class="${activePage === "home" ? "active" : ""}">${I18N.t("home")}</a>
          <a href="products.html" class="${activePage === "products" ? "active" : ""}">${I18N.t("products")}</a>
          <a href="search.html" class="${activePage === "search" ? "active" : ""}">${I18N.t("search")}</a>
        </nav>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary btn-sm lang-toggle" id="langToggle">${I18N.t("langToggle")}</button>
          <button class="theme-toggle btn-icon" aria-label="Toggle theme">🌙</button>
          <button class="mobile-menu-btn btn-icon" id="mobileMenuBtn" aria-label="Menu">☰</button>
        </div>
      </div>
    </header>`;
  },

  footer() {
    return `
    <footer class="site-footer">
      <div class="container footer-inner footer-simple">
        <div class="footer-brand">
          <h3>${STORE_CONFIG.name}</h3>
          <p>${STORE_CONFIG.tagline}</p>
        </div>
        <div class="footer-links footer-contact">
          <a href="tel:${STORE_CONFIG.phone}">${I18N.t("phone")}: ${STORE_CONFIG.phone}</a>
          <a href="${STORE_CONFIG.telegram}" target="_blank" rel="noopener">${I18N.t("telegram")}</a>
          <a href="${STORE_CONFIG.tiktok}" target="_blank" rel="noopener">${I18N.t("tiktok")}</a>
          <a href="products.html">${I18N.t("products")}</a>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} ${STORE_CONFIG.name}. ${I18N.t("allRights")}</p>
        </div>
      </div>
    </footer>`;
  },

  telegramButton(product) {
    const text = encodeURIComponent(
      `Hi! I'm interested in: ${product.name} (${UI.formatPrice(product.price)})\n${UI.getProductUrl(product.id)}`
    );
    return `<a href="${STORE_CONFIG.telegram}?text=${text}" target="_blank" rel="noopener" class="btn btn-telegram">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
      ${I18N.t("buyTelegram")}
    </a>`;
  },

  injectLayout(activePage) {
    I18N.apply();

    const headerEl = document.getElementById("site-header");
    const footerEl = document.getElementById("site-footer");
    if (headerEl) headerEl.innerHTML = this.header(activePage);
    if (footerEl) footerEl.innerHTML = this.footer();

    Theme.init();

    document.getElementById("langToggle")?.addEventListener("click", () => I18N.toggle());

    document.getElementById("mobileMenuBtn")?.addEventListener("click", () => {
      document.getElementById("mainNav")?.classList.toggle("open");
    });
  }
};
