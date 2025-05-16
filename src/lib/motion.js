'use client';

// Import specific components instead of using export *
import { 
  motion,
  AnimatePresence,
  useAnimation,
  useInView,
  useScroll,
  useTransform,
  animations
} from 'framer-motion';

// Destructure animations
const { spring, animate } = animations;

// Export only what you need
export {
  motion,
  AnimatePresence,
  useAnimation,
  useInView,
  useScroll,
  useTransform,
  spring,
  animate
}; 