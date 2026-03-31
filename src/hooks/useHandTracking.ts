import { useEffect, useRef, useState, RefObject } from 'react';
import { FilesetResolver, GestureRecognizer, NormalizedLandmark } from '@mediapipe/tasks-vision';

export type Gesture = 'None' | 'Closed_Fist' | 'Open_Palm' | 'Pointing_Up' | 'Thumb_Down' | 'Thumb_Up' | 'Victory' | 'ILoveYou';

export interface HandTrackingResult {
  gesture: Gesture;
  handX: number; // 0 to 1
  handY: number; // 0 to 1
  landmarks: NormalizedLandmark[];
}

export function useHandTracking(videoRef: RefObject<HTMLVideoElement | null>) {
  const [result, setResult] = useState<HandTrackingResult | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        if (!active) return;

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (!active) return;
        recognizerRef.current = recognizer;
      } catch (e) {
        console.error("Failed to initialize GestureRecognizer", e);
      }
    };

    init();

    return () => {
      active = false;
      if (recognizerRef.current) {
        recognizerRef.current.close();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastVideoTime = -1;

    const detect = () => {
      if (video.readyState === 4 && recognizerRef.current) {
        let startTimeMs = performance.now();
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            const results = recognizerRef.current.recognizeForVideo(video, startTimeMs);
            
            if (results.gestures.length > 0 && results.landmarks.length > 0) {
              const gesture = results.gestures[0][0].categoryName as Gesture;
              const landmarks = results.landmarks[0];
              // Use middle finger MCP for hand center
              const handX = landmarks[9].x;
              const handY = landmarks[9].y;
              
              setResult({ gesture, handX, handY, landmarks });
            } else {
              setResult(null);
            }
          } catch (e) {
            console.error("Error during recognition", e);
          }
        }
      }
      requestRef.current = requestAnimationFrame(detect);
    };

    video.addEventListener('loadeddata', detect);
    // If video is already playing
    if (video.readyState >= 2) {
      detect();
    }

    return () => {
      video.removeEventListener('loadeddata', detect);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [videoRef]);

  return result;
}
