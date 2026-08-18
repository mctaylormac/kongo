export interface Country {
  id: string;
  name: string;
  code: string;
  phone_code: string;
  currency: string;
  flag_emoji: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface City {
  id: string;
  country_id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  country?: Country;
}

export interface PaymentMethod {
  id: string;
  country_id: string;
  city_id: string | null;
  name: string;
  code: string;
  provider: string;
  icon_name: string;
  instructions: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  country?: Country;
  city?: City;
}
