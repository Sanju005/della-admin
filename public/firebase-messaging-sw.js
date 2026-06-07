importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCNnSdYrL-iKY0fCglW00YiiLeWso6DVAs",
  authDomain: "dellaapp.firebaseapp.com",
  projectId: "dellaapp",
  storageBucket: "dellaapp.firebasestorage.app",
  messagingSenderId: "609758824758",
  appId: "1:609758824758:web:4999a6268be583d32c4b97",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "DELLA";
  const body = payload?.notification?.body || "You have a new update.";
  const path = payload?.data?.path || "/profile/notifications";

  self.registration.showNotification(title, {
    body,
    icon: "/icon.png",
    data: {
      path,
      bookingId: payload?.data?.bookingId || "",
    },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = event.notification?.data?.path || "/profile/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetPath);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }

      return undefined;
    })
  );
});
