import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";
import axios from "axios";

export const initNotifications = async (userId) => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const token = await getToken(messaging, {
    vapidKey: "YOUR_VAPID_KEY",
  });

  await axios.post("/api/save-token", { userId, token });

  onMessage(messaging, payload => {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
    });
  });
};
