// components/MockNotificationButtons.tsx
import { useNotification } from "../context/NotificationContext";

const MockNotificationButtons = () => {
  const { pushNotification } = useNotification();

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={() =>
          pushNotification(
            "Task Assigned",
            "Manager assigned you a new task"
          )
        }
      >
        Assign Task
      </button>

      <button
        onClick={() =>
          pushNotification(
            "Task Completed",
            "Employee completed the task"
          )
        }
        style={{ marginLeft: 10 }}
      >
        Complete Task
      </button>
    </div>
  );
};

export default MockNotificationButtons;
