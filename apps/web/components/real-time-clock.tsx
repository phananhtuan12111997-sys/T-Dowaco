"use client";

import { useEffect, useState } from "react";

export function RealTimeClock() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      
      setTimeStr(`${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`);
    };

    updateTime(); // Initial call
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (!mounted) {
    return (
      <div className="text-right border-l pl-6">
        <p className="text-xs text-slate-500 font-medium">ĐỒNG HỒ HỆ THỐNG</p>
        <p className="text-lg font-bold text-slate-800">
          --:--:-- - --/--/----
        </p>
      </div>
    );
  }

  return (
    <div className="text-right border-l pl-6">
      <p className="text-xs text-slate-500 font-medium">ĐỒNG HỒ HỆ THỐNG</p>
      <p className="text-lg font-bold text-slate-800">
        {timeStr}
      </p>
    </div>
  );
}
