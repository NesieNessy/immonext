import { supabase } from '@/lib/supabase/client';
import type { PersonalData, PersonalDataInsert, PersonalDataUpdate } from '@immonext/types';

function toPersonalData(row: Record<string, unknown>): PersonalData {
  return {
    userId: row.user_id as string,
    lastName: row.last_name as string,
    firstName: row.first_name as string,
    street: row.street as string,
    houseNumber: row.house_number as string,
    city: row.city as string,
    postalCode: row.postal_code as string,
    phoneNumber: row.phone_number as string | undefined,
    emailAddress: row.email_address as string,
    personalMarginalTaxRate: row.personal_marginal_tax_rate as string,
    profilePicture: row.profile_picture as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getPersonalData(userId: string): Promise<PersonalData | null> {
  const { data, error } = await supabase
    .from('personal_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return toPersonalData(data);
}

export async function upsertPersonalData(personalData: PersonalDataInsert): Promise<PersonalData | null> {
  const { data, error } = await supabase
    .from('personal_data')
    .upsert({
      user_id: personalData.userId,
      last_name: personalData.lastName,
      first_name: personalData.firstName,
      street: personalData.street,
      house_number: personalData.houseNumber,
      city: personalData.city,
      postal_code: personalData.postalCode,
      phone_number: personalData.phoneNumber,
      email_address: personalData.emailAddress,
      personal_marginal_tax_rate: personalData.personalMarginalTaxRate,
      profile_picture: personalData.profilePicture,
    })
    .select()
    .single();

  if (error || !data) return null;
  return toPersonalData(data);
}

export async function updatePersonalData(userId: string, updates: PersonalDataUpdate): Promise<PersonalData | null> {

  const dbUpdates: Record<string, unknown> = {};
  if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
  if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
  if (updates.street !== undefined) dbUpdates.street = updates.street;
  if (updates.houseNumber !== undefined) dbUpdates.house_number = updates.houseNumber;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode;
  if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
  if (updates.emailAddress !== undefined) dbUpdates.email_address = updates.emailAddress;
  if (updates.personalMarginalTaxRate !== undefined) dbUpdates.personal_marginal_tax_rate = updates.personalMarginalTaxRate;
  if (updates.profilePicture !== undefined) dbUpdates.profile_picture = updates.profilePicture;

  const { data, error } = await supabase
    .from('personal_data')
    .update(dbUpdates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) return null;
  return toPersonalData(data);
}
