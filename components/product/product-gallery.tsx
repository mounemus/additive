"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length
    ? images
    : [{ url: "/images/products/placeholder.svg", alt: name }];

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#0a0a0a]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full w-full"
          >
            <Image
              src={list[active].url}
              alt={list[active].alt ?? `${name} — vue ${active + 1}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {list.length > 1 && (
        <div className="mt-4 flex gap-3" role="tablist" aria-label="Vues du produit">
          {list.map((img, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Vue ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-20 w-24 overflow-hidden rounded-xl border-2 transition-all",
                i === active
                  ? "border-foreground"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
