importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCNnSdYrL-iKY0fCglW00YiiLeWso6DVAs",
  authDomain: "dellaapp.firebaseapp.com",
  projectId: "dellaapp",
  storageBucket: "dellaapp.firebasestorage.app",
  messagingSenderId: "609758824758",
  appId: "1:609758824758:web:4999a6268be583d32c4b97"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon.png",
  });
});