import { PropertyForm } from "@/components/PropertyForm";
import type { Category } from "@/lib/types";

type AddListingFormProps = {
  categories?: Category[];
};

export function AddListingForm({ categories = [] }: AddListingFormProps) {
  return <PropertyForm mode="create" categories={categories} />;
}
