export type ProductResponse = {
  id: string;
  label: string;
  imageURL?: string;
  description?: string;
  isAvailable: boolean;
  price: number;
  categories: { id: string; name: string }[];
  variantTypes: {
    id: string;
    label: string;
    description?: string;
    variants: {
      id: string;
      label: string;
      imageURL?: string;
      priceDelta: number;
      isAvailable: boolean;
    }[];
  }[];
  addons: {
    id: string;
    label: string;
    description?: string;
    options: {
      id: string;
      label: string;
      imageURL?: string;
      priceDelta: number;
      isAvailable: boolean;
    }[];
  }[];
};


