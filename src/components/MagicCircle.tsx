import { motion } from 'framer-motion';

export function MagicCircle() {
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -ml-[300px] -mt-[300px] rounded-full border-4 border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)] flex items-center justify-center pointer-events-none"
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
    >
      {/* Inner circles and stars */}
      <div className="absolute w-[500px] h-[500px] rounded-full border-2 border-yellow-500/40 flex items-center justify-center">
        <div className="absolute w-[400px] h-[400px] rounded-full border border-yellow-500/50 flex items-center justify-center">
          {/* Star shape (simplified with CSS triangles or just an SVG) */}
          <svg viewBox="0 0 100 100" className="w-[300px] h-[300px] text-yellow-500/40 fill-transparent stroke-current stroke-[0.5]">
            <polygon points="50,5 61,35 95,35 67,55 78,85 50,65 22,85 33,55 5,35 39,35" />
            <polygon points="50,95 39,65 5,65 33,45 22,15 50,35 78,15 67,45 95,65 61,65" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
