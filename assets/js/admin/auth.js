const AdminAuth = {
  _ready: false,

  init() {
    if (!initFirebase()) return false;

    auth.onAuthStateChanged((user) => {
      this._ready = true;
      const isLoginPage = window.location.pathname.includes("login.html");

      if (user && isLoginPage) {
        window.location.replace("dashboard.html");
      } else if (!user && !isLoginPage) {
        window.location.replace("login.html");
      }
    });

    return true;
  },

  whenReady() {
    if (!auth) return Promise.resolve(null);
    if (this._ready) return Promise.resolve(auth.currentUser);
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
