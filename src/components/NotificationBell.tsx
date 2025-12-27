// components/NotificationBell.tsx
import { useNotification } from "../context/NotificationContext";

const NotificationBell = () => {
  const { notifications, markAsRead } = useNotification();
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: "relative", width: 300 }}>
      🔔 {unread > 0 && <span>({unread})</span>}

      <div style={{ border: "1px solid #ccc", marginTop: 10 }}>
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => markAsRead(n.id)}
            style={{
              padding: 8,
              cursor: "pointer",
              background: n.isRead ? "#f5f5f5" : "#e3f2fd"
            }}
          >
            <strong>{n.title}</strong>
            <p>{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationBell;
