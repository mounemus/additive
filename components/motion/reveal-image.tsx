"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
};

/** Image révélée par un rideau qui glisse + léger zoom-out. */
export function RevealImage({
  src,
  alt,
  className,
  imgClassName,
  priority,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: RevealImageProps) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="relative h-full w-full"
        initial={reduce ? false : { scale: 1.08 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn("object-cover", imgClassName)}
        />
      </motion.div>
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute inset-0 z-10 bg-background"
          initial={{ scaleY: 1 }}
          whileInView={{ scaleY: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          style={{ transformOrigin: "top" }}
        />
      )}
    </div>
  );
}
