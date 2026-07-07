const AdminAuth = {
  init() {
    if (!initFirebase()) {
      console.warn("Firebase not configured — admin login disabled in demo mode");
      return;
    }
    auth.onAuthStateChanged((user) => {
      const isLoginPage = window.location.pathname.includes("login.html");
      if (user && isLoginPage) {
        window.location.replace("dashboard.html");
      } else if (!user && !isLoginPage) {
        window.location.replace("login.html");
      }
    });
  },

  async login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  },

  async logout() {
    await auth.signOut();
    window.location.href = "login.html";
  },

  getUser() {
    return auth?.currentUser;
  }
};
