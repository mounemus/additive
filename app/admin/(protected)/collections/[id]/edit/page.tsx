import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { CollectionForm } from "@/components/admin/collection-form";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const collection = await safeQuery(
    () => db.collection.findUnique({ where: { id: params.id } }),
    null
  );
  if (!collection) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Modifier « {collection.name} »
        </h1>
      </div>
      <CollectionForm
        collectionId={collection.id}
        initial={{
          name: collection.name,
          slug: collection.slug,
          tagline: collection.tagline ?? "",
          description: collection.description ?? "",
          image: collection.image ?? "",
          video: collection.video ?? "",
          order: collection.order,
          isPublished: collection.isPublished,
          seoTitle: collection.seoTitle ?? "",
          seoDescription: collection.seoDescription ?? "",
        }}
      />
    </div>
  );
}
