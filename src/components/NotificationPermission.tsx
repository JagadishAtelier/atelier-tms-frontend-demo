import React, { useEffect, useState } from "react";
import { useNotification } from "../context/NotificationContext";
import { Button } from "./ui/button"; // Assuming UI button availability
import { Bell } from "lucide-react";

const NotificationPermission = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const { subscribeToPush } = useNotification();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnable = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await subscribeToPush();
    }
  };

  if (permission === "granted" || permission === "denied") {
    return null; // Don't show if already decided
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex flex-col gap-3 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <div className="bg-blue-100 p-2 rounded-full">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Enable Notifications</h4>
          <p className="text-xs text-gray-500">Get updates on new tasks and mentions.</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPermission("denied")} // Just hide it locally for session basically, ideally store preference
        >
          Later
        </Button>
        <Button size="sm" onClick={handleEnable}>
          Enable
        </Button>
      </div>
    </div>
  );
};

export default NotificationPermission;
