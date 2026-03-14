// ================== Firebase Configuration ==================
// Compat shim that exposes database.ref() style API
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push, remove, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCBv--XbRQYCE3YT7MheVkX3yrBfEh6ZoU",
  authDomain: "docbook-17a4e.firebaseapp.com",
  databaseURL: "https://docbook-17a4e-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "docbook-17a4e",
  storageBucket: "docbook-17a4e.firebasestorage.app",
  messagingSenderId: "742302268812",
  appId: "1:742302268812:web:4e1fc09db994a04600aaa9"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// Monitor connection
onValue(ref(db, '.info/connected'), (snap) => {
  console.log(snap.val() === true ? '✅ Firebase متصل' : '⚠️ Firebase غير متصل');
});

// Compat-style database object so main.js can use database.ref('path').on/set/push etc.
export const database = {
  ref: (path) => {
    const dbRef = ref(db, path);
    return {
      once: (_event) => get(dbRef),
      on:   (_event, cb, errCb) => onValue(dbRef, cb, errCb),
      set:  (data)  => set(dbRef, data),
      update: (data) => update(dbRef, data),
      remove: () => remove(dbRef),
      push: () => {
        const newRef = push(dbRef);
        return {
          key: newRef.key,
          set: (data) => set(newRef, data),
        };
      },
      transaction: (updateFn) =>
        get(dbRef).then(snap => {
          const newVal = updateFn(snap.val());
          if (newVal === undefined) return;
          return set(dbRef, newVal);
        }),
    };
  }
};

export default database;
