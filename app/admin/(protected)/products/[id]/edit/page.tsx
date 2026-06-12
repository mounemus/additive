import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, collections] = await Promise.all([
    safeQuery(
      () =>
        db.product.findUnique({
          where: { id: params.id },
          include: { images: { orderBy: { order: "asc" } } },
        }),
      null
    ),
    safeQuery(
      () =>
        db.collection.findMany({
          orderBy: { order: "asc" },
          select: { id: true, name: true },
        }),
      []
    ),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Modifier « {product.name} »
        </h1>
        <p className="mt-1 text-sm text-muted">/{product.slug}</p>
      </div>
      <ProductForm
        productId={product.id}
        collections={collections}
        initial={{
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          price: product.price,
          currency: product.currency,
          collectionId: product.collectionId ?? "",
          colors: product.colors,
          materials: product.materials,
          dimensions: product.dimensions ?? "",
          features: product.features,
          images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
          customizable: product.customizable,
          isFeatured: product.isFeatured,
          isPublished: product.isPublished,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
        }}
      />
    </div>
  );
}
