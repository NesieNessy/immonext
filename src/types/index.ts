export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Property {
  id: string;
  street: string;
  house_number: string;
  postcode: string;
  city: string;
  year_of_construction: number;
  date_of_acquisition: string;
  number_of_parking_spaces: number;
  energy_rating: string;
  net_internal_area_sqm: number;
  image?: {
    format: string;
    encoding: string;
    data: string;
  };
}
