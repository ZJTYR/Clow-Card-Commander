import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface CardProps {
  index: number;
  total: number;
  rotation: number; // Global rotation of the carousel
  isSpread: boolean;
  isSelected: boolean;
  isShattered: boolean;
  frontImage: string;
}

export function Card({ index, total, rotation, isSpread, isSelected, isShattered, frontImage }: CardProps) {
  // Calculate the base angle for this card in the carousel
  const angle = (index / total) * 360;
  
  // The card's current angle relative to the camera
  const currentAngle = angle + rotation;
  
  // Is this card currently facing the front?
  const normalizedAngle = ((currentAngle % 360) + 360) % 360;
  const isFrontFacing = normalizedAngle > 340 || normalizedAngle < 20;

  // Animation variants
  const variants = {
    hidden: {
      rotateY: 0,
      z: 0,
      x: 0,
      opacity: 0,
      scale: 0.5,
    },
    spread: {
      rotateY: angle,
      z: 300, // Radius of the carousel
      x: 0,
      opacity: 1,
      scale: 1,
    },
    selected: {
      rotateY: angle,
      z: isFrontFacing ? 500 : 300, // Pop out if front facing
      x: 0,
      opacity: 1,
      scale: isFrontFacing ? 1.5 : 1,
    },
    shattered: {
      rotateY: angle + (Math.random() * 180 - 90),
      z: 300 + Math.random() * 500,
      x: Math.random() * 1000 - 500,
      y: Math.random() * 1000 - 500,
      opacity: 0,
      scale: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  let state = 'hidden';
  if (isShattered) state = 'shattered';
  else if (isSelected) state = 'selected';
  else if (isSpread) state = 'spread';

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 w-48 h-80 -ml-24 -mt-40 preserve-3d"
      variants={variants}
      initial="hidden"
      animate={state}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{
        transformOrigin: 'center center -300px', // Rotate around the center of the carousel
      }}
    >
      {/* Front of card */}
      <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden border-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
        <img src={frontImage} alt="Card Front" className="w-full h-full object-cover" />
      </div>
      
      {/* Back of card */}
      <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden border-4 border-yellow-500 bg-red-800 rotate-y-180 shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-2 border-yellow-500 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-yellow-500 flex items-center justify-center">
             <div className="text-yellow-500 text-4xl">âœ¨</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
