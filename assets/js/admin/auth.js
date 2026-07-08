const AdminAuth = {
  _ready: false,

  init() {
    if (!initFirebase()) return false;

    let initial = true;
    auth.onAuthStateChanged((user) => {
      this._ready = true;
      const isLoginPage = window.location.pathname.includes("login.html");

      if (user && isLoginPage) {
        window.location.replace("dashboard.html");
        return;
      }

      if (!user && !isLoginPage) {
        if (window.__loginInProgress) return;
        if (initial) {
          setTimeout(() => {
            if (!auth.currentUser && !window.__loginInProgress) {
              window.location.replace("login.html");
            }
          }, 1000);
        } else {
          window.location.replace("login.html");
        }
      }

      initial = false;
    });

    return true;
  },

  whenReady() {
    if (!auth) return Promise.resolve(null);
    return new Promise((resolve) => {
      const unsub = auth.onAuthStateChanged((user) => {
        unsub();
        this._ready = true;
        resolve(user);
      });
    });
  },

  async login(email, password) {
    if (!auth) throw { code: "auth/not-initialized", message: "Firebase Auth failed to load. Please refresh the page." };
    return auth.signInWithEmailAndPassword(email.trim(), password);
  },

  async logout() {
    if (auth) await auth.signOut();
    window.location.href = "login.html";
  },

  getUser() {
    return auth?.currentUser;
  }
};
