import { useEffect, useRef } from "react";

interface ProgressRingProps {
  progress: number;
  radius?: number;
  stroke?: number;
  color?: string;
}

export default function ProgressRing({ 
  progress, 
  radius = 52, 
  stroke = 6, 
  color = "hsl(var(--primary))" 
}: ProgressRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  
  // Calculate circumference
  const circumference = radius * 2 * Math.PI;
  
  useEffect(() => {
    if (circleRef.current) {
      const offset = circumference - (progress / 100) * circumference;
      circleRef.current.style.strokeDashoffset = offset.toString();
    }
  }, [progress, circumference]);
  
  return (
    <svg className="progress-ring" width="120" height="120">
      <circle
        ref={circleRef}
        className="progress-ring__circle"
        stroke={color}
        strokeWidth={stroke}
        fill="transparent"
        r={radius}
        cx="60"
        cy="60"
        style={{
          strokeDasharray: `${circumference} ${circumference}`,
          strokeDashoffset: circumference
        }}
      />
    </svg>
  );
}
