"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ColorDots } from "@/components/product/color-dots";
import { formatPrice } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <motion.article
      whileHover="hover"
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow duration-500 hover:shadow-card-hover"
    >
      <Link href={`/produits/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#0a0a0a]">
          <motion.div
            variants={{ hover: { scale: 1.06 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full w-full"
          >
            <Image
              src={product.image}
              alt={product.images[0]?.alt ?? product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </motion.div>
          {product.collection && (
            <Badge
              variant="muted"
              className="absolute left-4 top-4 bg-black/40 text-white backdrop-blur"
            >
              {product.collection.name}
            </Badge>
          )}
          <motion.div
            variants={{ hover: { opacity: 1, y: 0 } }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black"
            aria-hidden
          >
            <ArrowUpRight className="h-4 w-4" />
          </motion.div>
        </div>

        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <h3 className="font-display text-lg font-semibold">{product.name}</h3>
            {product.shortDescription && (
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {product.shortDescription}
              </p>
            )}
            <ColorDots colors={product.colors} className="mt-3" />
          </div>
          <p className="shrink-0 text-sm font-medium">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
