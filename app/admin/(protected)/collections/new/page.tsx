import { CollectionForm } from "@/components/admin/collection-form";

export const dynamic = "force-dynamic";

export default function NewCollectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Nouvelle collection</h1>
      </div>
      <CollectionForm />
    </div>
  );
}
