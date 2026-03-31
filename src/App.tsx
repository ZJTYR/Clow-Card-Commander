import { useEffect, useRef, useState } from 'react';
import { useHandTracking } from './hooks/useHandTracking';
import { MagicCircle } from './components/MagicCircle';
import { motion, useSpring, useTransform } from 'framer-motion';

// Mock Clow Cards
const CARDS = [
  { id: 1, name: 'The Rain', image: 'https://picsum.photos/seed/rain/200/300' },
  { id: 2, name: 'The Shield', image: 'https://picsum.photos/seed/shield/200/300' },
  { id: 3, name: 'The Wave', image: 'https://picsum.photos/seed/wave/200/300' },
  { id: 4, name: 'The Windy', image: 'https://picsum.photos/seed/windy/200/300' },
  { id: 5, name: 'The Earthy', image: 'https://picsum.photos/seed/earthy/200/300' },
  { id: 6, name: 'The Flower', image: 'https://picsum.photos/seed/flower/200/300' },
];

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpread, setIsSpread] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isShattered, setIsShattered] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  
  const handTracking = useHandTracking(videoRef);

  // Smooth rotation using framer-motion spring
  const springRotation = useSpring(rotation, { stiffness: 50, damping: 20 });

  useEffect(() => {
    // Start webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setPermissionError(false);
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
        setPermissionError(true);
      });
  }, []);

  useEffect(() => {
    if (handTracking) {
      const { gesture, handX, landmarks } = handTracking;

      // Map handX (0 to 1) to rotation (-360 to 360)
      // handX is from raw video (not mirrored). 
      // handX = 0 is user's right. handX = 1 is user's left.
      // If user moves hand right (handX -> 0), we want front cards to move right (negative rotation).
      const targetRotation = (handX - 0.5) * 720;
      setRotation(targetRotation);

      // Flexible gesture handling: only update state if gesture is confident
      // We can add a simple debounce or threshold here if needed
      if (gesture !== 'None') {
        if (gesture === 'Open_Palm') {
          setIsSpread(true);
          setIsSelected(false);
          setIsShattered(false);
        } else if (gesture === 'Closed_Fist') {
          setIsSpread(false);
          setIsSelected(false);
          setIsShattered(false);
        } else if (gesture === 'Pointing_Up') {
          setIsSelected(true);
          setIsShattered(false);
        } else if (gesture === 'Victory') {
          setIsShattered(true);
        }
      }

      // Draw landmarks on canvas
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#eab308'; // yellow-500
          landmarks.forEach((landmark) => {
            const x = landmark.x * canvas.width;
            const y = landmark.y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      }
    } else {
      // Clear canvas if no hand
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [handTracking]);

  return (
    <div className="relative w-full h-screen bg-neutral-950 overflow-hidden flex items-center justify-center [perspective:1000px]">
      {/* Background Stars/Particles */}
      <div className="absolute inset-0 bg-neutral-950">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            initial={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              opacity: Math.random(),
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            style={{ width: '2px', height: '2px' }}
          />
        ))}
      </div>

      {/* Magic Circle */}
      <MagicCircle />

      {/* 3D Carousel */}
      <motion.div 
        className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]"
        style={{ rotateY: springRotation }}
      >
        {CARDS.map((card, index) => {
          const angle = (index / CARDS.length) * 360;
          
          // Determine if this card is currently facing front based on the carousel's rotation
          // We use a transform to check if the card is close to 0 degrees relative to the camera
          // rotation is negative when moving right, positive when moving left
          const currentAbsoluteAngle = (angle + rotation) % 360;
          const normalizedAngle = currentAbsoluteAngle < 0 ? currentAbsoluteAngle + 360 : currentAbsoluteAngle;
          
          // Front is around 0 or 360
          const isFront = normalizedAngle < 25 || normalizedAngle > 335;
          const isCardSelected = isSelected && isFront;

          return (
            <Card
              key={card.id}
              index={index}
              total={CARDS.length}
              angle={angle}
              isSpread={isSpread}
              isSelected={isCardSelected}
              isShattered={isShattered}
              image={card.image}
            />
          );
        })}
      </motion.div>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-yellow-500/80 font-mono text-sm space-y-2 z-50">
        <h1 className="text-xl font-bold text-yellow-500 mb-4">Clow Card Commander</h1>
        {permissionError ? (
          <div className="bg-red-900/80 p-4 rounded-lg border border-red-500 text-white">
            <p className="font-bold">Camera Permission Denied</p>
            <p className="text-xs mt-1">Please allow camera access in your browser settings.</p>
          </div>
        ) : (
          <>
            <p>Hand Gestures Enabled</p>
            <div className="mt-4 text-xs opacity-50">
              Current Gesture: {handTracking?.gesture || 'None'}
            </div>
          </>
        )}
      </div>

      {/* Webcam Preview */}
      <div className="absolute bottom-4 right-4 w-48 h-36 bg-black border border-yellow-500/30 rounded-lg overflow-hidden z-50">
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1]"
          width={192}
          height={144}
        />
      </div>
    </div>
  );
}

interface CardProps {
  index: number;
  total: number;
  angle: number;
  isSpread: boolean;
  isSelected: boolean;
  isShattered: boolean;
  image: string;
  key?: number;
}

function Card({ index, total, angle, isSpread, isSelected, isShattered, image }: CardProps) {
  // Animation variants
  const variants = {
    hidden: {
      rotateY: 0,
      z: index * 2,
      opacity: 1,
      scale: 0.8,
    },
    spread: {
      rotateY: angle,
      z: 350, // Radius of the carousel
      opacity: 1,
      scale: 1,
    },
    selected: {
      rotateY: angle,
      z: 500, // Pop out
      opacity: 1,
      scale: 1.2,
    },
    shattered: {
      rotateY: angle + (Math.random() * 180 - 90),
      z: 350 + Math.random() * 500,
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
      className="absolute top-1/2 left-1/2 w-48 h-80 -ml-24 -mt-40"
      variants={variants}
      initial="hidden"
      animate={state}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Front of card */}
      <div 
        className="absolute inset-0 rounded-xl overflow-hidden border-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] bg-neutral-900"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <img src={image} alt="Card Front" className="w-full h-full object-cover opacity-80" />
      </div>
      
      {/* Back of card */}
      <div 
        className="absolute inset-0 rounded-xl overflow-hidden border-4 border-yellow-500 bg-red-900 shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-center"
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        <div className="w-32 h-32 rounded-full border-2 border-yellow-500 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-yellow-500 flex items-center justify-center">
             <div className="text-yellow-500 text-4xl">*</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
