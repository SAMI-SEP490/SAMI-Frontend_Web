// src/hooks/useClosingAlert.js
import { useState, useEffect } from "react";
import { getBuildingsNeedClosing } from "../services/api/building";

export function useClosingAlert(user) {
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      try {
        const role = user.role || user.user_type; // Tùy field trong user object
        const userId = user.user_id || user.id;
        
        // Chỉ Manager và Owner mới cần check
        if (role !== "MANAGER" && role !== "OWNER") {
            setAlertCount(0);
            return;
        }

        const buildings = await getBuildingsNeedClosing(role, userId);
        setAlertCount(buildings.length);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user]);

  return { alertCount, loading };
}
