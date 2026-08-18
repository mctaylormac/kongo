import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface Country {
  id?: string;
  name: string;
  code: string;
  phone_code: string;
  flag_emoji: string;
  currency: string;
}

export const DEFAULT_COUNTRIES: Country[] = [
  { id: 'cd', name: 'République Démocratique du Congo', code: 'RDC', phone_code: '+243', flag_emoji: '🇨🇩', currency: 'CDF' },
  { id: 'cg', name: 'République du Congo', code: 'CG', phone_code: '+242', flag_emoji: '🇨🇬', currency: 'XAF' },
  { id: 'cm', name: 'Cameroun', code: 'CM', phone_code: '+237', flag_emoji: '🇨🇲', currency: 'XAF' },
  { id: 'ci', name: 'Côte d\'Ivoire', code: 'CI', phone_code: '+225', flag_emoji: '🇨🇮', currency: 'XOF' },
  { id: 'ga', name: 'Gabon', code: 'GA', phone_code: '+241', flag_emoji: '🇬🇦', currency: 'XAF' },
];

interface CountryContextType {
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  countries: Country[];
  loadingCountries: boolean;
}

const CountryContext = createContext<CountryContextType>({
  selectedCountry: DEFAULT_COUNTRIES[0],
  setSelectedCountry: () => {},
  countries: DEFAULT_COUNTRIES,
  loadingCountries: false,
});

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [countries, setCountries] = useState<Country[]>(DEFAULT_COUNTRIES);
  const [selectedCountry, setSelectedCountryState] = useState<Country>(DEFAULT_COUNTRIES[0]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(false);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('id, name, code, phone_code, flag_emoji, currency')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const loaded: Country[] = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code || 'RDC',
            phone_code: c.phone_code.startsWith('+') ? c.phone_code : `+${c.phone_code}`,
            flag_emoji: c.flag_emoji || '🌐',
            currency: c.currency || 'CDF',
          }));
          setCountries(loaded);
          const rdc = loaded.find(x => x.code === 'RDC' || x.phone_code === '+243') || loaded[0];
          setSelectedCountryState(rdc);
        }
      } catch (err) {
        console.error('Erreur chargement des pays:', err);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const setSelectedCountry = (country: Country) => {
    setSelectedCountryState(country);
  };

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry, countries, loadingCountries }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => useContext(CountryContext);
