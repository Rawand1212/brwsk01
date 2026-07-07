const ImageUtils = {
  compress(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
            "image/jpeg",
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  lazyLoad() {
    const images = document.querySelectorAll("img[data-src]");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
              img.classList.add("loaded");
              observer.unobserve(img);
            }
          });
        },
        { rootMargin: "100px" }
      );
      images.forEach((img) => observer.observe(img));
    } else {
      images.forEach((img) => {
        img.src = img.dataset.src;
        img.classList.add("loaded");
      });
    }
  }
};

const ImageSlider = {
  init(container) {
    if (!container) return;
    const slides = container.querySelectorAll(".slider-slide");
    const thumbs = container.querySelectorAll(".slider-thumb");
    const prev = container.querySelector(".slider-prev");
    const next = container.querySelector(".slider-next");
    let current = 0;

    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("active", i === current));
      thumbs.forEach((t, i) => t.classList.toggle("active", i === current));
    };

    prev?.addEventListener("click", () => show(current - 1));
    next?.addEventListener("click", () => show(current + 1));
    thumbs.forEach((t, i) => t.addEventListener("click", () => show(i)));

    // Touch swipe
    let startX = 0;
    container.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX));
    container.addEventListener("touchend", (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) show(diff > 0 ? current + 1 : current - 1);
    });

    show(0);
  },

  initZoom(img) {
    if (!img) return;
    const overlay = document.createElement("div");
    overlay.className = "zoom-overlay";
    overlay.innerHTML = `<img src="${img.src}" alt="Zoomed">`;
    overlay.addEventListener("click", () => overlay.remove());
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => document.body.appendChild(overlay));
  }
};
