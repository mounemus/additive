"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { CatalogCollection } from "@/lib/catalog";

export function CollectionCard({
  collection,
  index = 0,
}: {
  collection: CatalogCollection;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover="hover"
      className="group relative overflow-hidden rounded-3xl bg-[#0a0a0a]"
    >
      <Link
        href={`/collections/${collection.slug}`}
        className="block"
        aria-label={`Découvrir la collection ${collection.name}`}
      >
        <div className="relative aspect-[3/4] sm:aspect-[4/5]">
          {collection.image && (
            <motion.div
              variants={{ hover: { scale: 1.07 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full w-full"
            >
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover opacity-90"
              />
            </motion.div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <p className="eyebrow mb-2 !text-white/60">
              {collection.productCount} modèle{collection.productCount > 1 ? "s" : ""}
              {collection.minPrice != null && ` · à partir de ${collection.minPrice} $`}
            </p>
            <h3 className="font-display text-3xl font-bold text-white">
              {collection.name}
            </h3>
            {collection.tagline && (
              <p className="mt-2 text-sm text-white/70">{collection.tagline}</p>
            )}
            <motion.span
              variants={{ hover: { x: 6 } }}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white"
            >
              Découvrir <ArrowRight className="h-4 w-4" />
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
