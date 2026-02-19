import { RenovationAttribute, RenovationValue } from "@/constants/RndValues";

export type RenovationFields = {
  [key in RenovationAttribute]: RenovationValue;
};

export type Renovation = {
  id: number;
  property_id: string;
} & RenovationFields;

