import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { Loader2, Store } from "../../../lib/icons";
import { useAppState } from "../../../hooks/useAppState";

interface AddSiteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export function AddSiteForm({ onSuccess, onCancel, initialData }: AddSiteFormProps) {
  const { agencyId, userRole } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    location_id: "",
    address: "",
    phone: "",
    selected_agency_id: "", // For superuser to select agency
  });

  const [agencies, setAgencies] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        city: initialData.city || "",
        location_id: initialData.location_id || "",
        address: initialData.address || "",
        phone: initialData.phone || "",
        selected_agency_id: initialData.agency_id || "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Fetch Locations
        const { data: locData, error: locError } = await supabase.from("locations").select("id, name").order("name");
        if (locError) throw locError;
        
        if (isMounted && locData) {
          setLocations(locData);
          if (!formData.location_id && formData.city) {
            const matchedLocation = locData.find((loc) => loc.name.toLowerCase() === formData.city.toLowerCase());
            if (matchedLocation) {
              setFormData(prev => ({ ...prev, location_id: matchedLocation.id, city: matchedLocation.name }));
            }
          }
        }

        // Fetch Agencies for Superuser
        if (userRole === 'superuser') {
          const { data: agencyData, error: agencyError } = await supabase.from("agencies").select("id, name").order("name");
          if (agencyError) throw agencyError;
          if (isMounted && agencyData) {
            setAgencies(agencyData);
          }
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [userRole]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.location_id || !formData.address.trim() || !formData.phone.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (userRole === 'superuser' && !formData.selected_agency_id) {
      toast.error("Veuillez sélectionner une agence");
      return;
    }

    setIsLoading(true);
    try {
      let targetAgencyId = userRole === 'superuser' ? formData.selected_agency_id : agencyId;

      if (!targetAgencyId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("agency_id")
            .eq("id", user.id)
            .maybeSingle();
          targetAgencyId = profileData?.agency_id || null;
        }
      }

      if (!targetAgencyId) {
        throw new Error("Agence introuvable. Veuillez sélectionner une agence.");
      }

      const siteData = {
        name: formData.name,
        city: formData.city,
        location_id: formData.location_id,
        address: formData.address,
        phone: formData.phone,
        agency_id: targetAgencyId,
      };

      let error;
      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from("agency_sites")
          .update(siteData)
          .eq("id", initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("agency_sites")
          .insert([siteData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(initialData?.id ? "Site mis à jour" : "Site ajouté avec succès");
      onSuccess();
    } catch (error: any) {
      console.error("Save error:", error);
      if (error?.code === "42501" || error?.status === 403) {
        toast.error("Accès refusé pour créer ce site (RLS). Vérifiez votre rôle.");
      } else {
        toast.error("Erreur: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const InputClass = "w-full h-11 px-4 bg-black/5 border-0 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium placeholder:text-black/30";
  const SelectClass = "w-full h-11 px-4 bg-black/5 border-0 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all appearance-none cursor-pointer font-medium";
  const LabelClass = "text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide";

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="space-y-4">
        <h4 className="text-[15px] font-bold text-[#86868B] uppercase tracking-wide flex items-center">
          <Store className="w-4 h-4 mr-2" /> Informations du Site
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRole === 'superuser' && (
            <div className="space-y-2 md:col-span-2">
              <label className={LabelClass}>Agence Propriétaire</label>
              <select
                className={SelectClass}
                value={formData.selected_agency_id}
                onChange={(e) => setFormData({ ...formData, selected_agency_id: e.target.value })}
              >
                <option value="">Sélectionner une agence</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className={LabelClass}>Nom du Point de Vente</label>
            <input
              type="text"
              className={InputClass}
              placeholder="Ex: Agence Gare Centrale"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className={LabelClass}>Ville</label>
            <select
              className={SelectClass}
              value={formData.location_id}
              onChange={(e) => {
                const selectedId = e.target.value;
                const loc = locations.find((l) => l.id === selectedId);
                setFormData({
                  ...formData,
                  location_id: selectedId,
                  city: loc ? loc.name : "",
                });
              }}
            >
              <option value="">Sélectionner une ville</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={LabelClass}>Adresse Complète</label>
            <input
              type="text"
              className={InputClass}
              placeholder="Ex: 15 Avenue du Port, Gombe"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={LabelClass}>Numéro de Téléphone</label>
            <input
              type="text"
              className={InputClass}
              placeholder="Ex: +243 81 000 0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-black/5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 h-11 bg-black/5 rounded-xl font-bold text-[#1D1D1F] hover:bg-black/10 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 h-11 bg-[#1D1D1F] text-white rounded-xl font-bold hover:bg-[#3A3A3C] transition-all shadow-md flex items-center justify-center"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Mettre à jour" : "Enregistrer le site"}
        </button>
      </div>
    </form>
  );
}



