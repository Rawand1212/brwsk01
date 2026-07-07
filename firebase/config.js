// Firebase configuration for Rawand Artist
const firebaseConfig = {
  apiKey: "AIzaSyCQE63GJfN-8SKZCsD29v4g_lqHpSgUk2g",
  authDomain: "rawand-artist.firebaseapp.com",
  projectId: "rawand-artist",
  storageBucket: "rawand-artist.firebasestorage.app",
  messagingSenderId: "616694982219",
  appId: "1:616694982219:web:af9367d0a264fa8279cfce"
};

let app, auth, db, storage;

function initFirebase() {
  if (typeof firebase === "undefined") {
    console.warn("Firebase SDK not loaded");
    return false;
  }
  if (!app) {
    app = firebase.initializeApp(firebaseConfig);
    if (firebase.auth) auth = firebase.auth();
    if (firebase.firestore) db = firebase.firestore();
    if (firebase.storage) storage = firebase.storage();
  }
  return !!auth;
}
