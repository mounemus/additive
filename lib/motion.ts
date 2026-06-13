/**
 * Tokens de motion centralisés — durées et courbes d'accélération.
 * Source unique pour toutes les animations (Framer Motion / CSS).
 */
export const motionTokens = {
  duration: {
    instant: 0.15,
    fast: 0.3,
    normal: 0.55,
    slow: 0.9,
    cinematic: 1.4,
  },
  ease: {
    standard: [0.22, 1, 0.36, 1] as const,
    enter: [0.16, 1, 0.3, 1] as const,
    exit: [0.7, 0, 0.84, 0] as const,
  },
} as const;
