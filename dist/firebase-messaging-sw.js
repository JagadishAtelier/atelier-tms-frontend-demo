importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "API_KEY",
  authDomain: "PROJECT.firebaseapp.com",
  projectId: "PROJECT_ID",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    data: payload.data,
  });
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const taskId = event.notification.data.taskId;
  event.waitUntil(
    clients.openWindow(`/task/${taskId}`)
  );
});
