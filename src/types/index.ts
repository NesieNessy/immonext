export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Property {
  id: number;
  title: string;
  type: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
}
