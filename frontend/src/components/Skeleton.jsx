import { useTheme } from "../context/ThemeContext";

export default function Skeleton({ width = "100%", height = "20px", borderRadius = "8px", style = {} }) {
    const t = useTheme();

    return (
        <div style={{
            width, height, borderRadius,
            backgroundColor: t.dark ? "#2a2a3e" : "#e0e0e0",
            animation: "skeleton-pulse 1.5s ease-in-out infinite",
            ...style
        }}>
            <style>{`
        @keyframes skeleton-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
        </div>
    );
}
