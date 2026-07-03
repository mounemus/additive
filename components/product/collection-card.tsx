"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { CatalogCollection } from "@/lib/catalog";
import { t, type Locale } from "@/lib/i18n";

export function CollectionCard({
  collection,
  index = 0,
  locale = "fr",
}: {
  collection: CatalogCollection;
  index?: number;
  locale?: Locale;
}) {
  const href =
    locale === "en"
      ? `/en/collections/${collection.slug}`
      : `/collections/${collection.slug}`;
  const ariaLabel =
    locale === "en"
      ? `Discover the ${collection.name} collection`
      : `Découvrir la collection ${collection.name}`;
  const countLabel =
    collection.productCount > 1
      ? t("product.models", locale)
      : t("product.model", locale);
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover="hover"
      className="group relative overflow-hidden rounded-3xl bg-[#0a0a0a]"
    >
      <Link href={href} className="block" aria-label={ariaLabel}>
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
              {collection.productCount} {countLabel}
              {collection.minPrice != null &&
                ` · ${t("product.from", locale)} ${collection.minPrice} $`}
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
              {t("product.discover", locale)} <ArrowRight className="h-4 w-4" />
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
