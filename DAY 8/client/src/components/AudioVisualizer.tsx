import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
  color?: string;
}

export function AudioVisualizer({ isActive, color = "rgb(168, 85, 247)" }: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(new Array(20).fill(10));

  useEffect(() => {
    if (!isActive) {
      setBars(new Array(20).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 40 + 10));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="flex items-center justify-center gap-1 h-24">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          animate={{ height: isActive ? height : 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
