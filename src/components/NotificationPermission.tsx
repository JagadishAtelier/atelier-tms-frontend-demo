// components/NotificationPermission.tsx
import { useEffect } from "react";

const NotificationPermission = () => {
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  return null;
};

export default NotificationPermission;
