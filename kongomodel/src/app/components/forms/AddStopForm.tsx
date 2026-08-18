import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { Loader2, MapPin, Navigation } from "../../../lib/icons";

interface AddStopFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export function AddStopForm({ onSuccess, onCancel, initialData }: AddStopFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    city_name: "",
    location_id: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        city_name: initialData.city_name || "",
        location_id: initialData.location_id || "",
        address: initialData.address || "",
        latitude: initialData.latitude?.toString() || "",
        longitude: initialData.longitude?.toString() || "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    let isMounted = true;
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase.from("locations").select("id, name").order("name");
        if (error) throw error;
        if (isMounted && data) {
          setLocations(data);

          // Auto-sync location_id if we have a city name but no ID
          if (!formData.location_id && formData.city_name) {
            const matchedLocation = data.find((loc) => loc.name.toLowerCase() === formData.city_name.toLowerCase());
            if (matchedLocation) {
              setFormData(prev => ({ ...prev, location_id: matchedLocation.id, city_name: matchedLocation.name }));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location_id) {
      toast.error("Veuillez remplir le nom de l'arrêt et la ville");
      return;
    }

    setIsLoading(true);
    try {
      const stopData = {
        name: formData.name,
        city_name: formData.city_name,
        location_id: formData.location_id,
        address: formData.address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      let error;
      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from("stops")
          .update(stopData)
          .eq("id", initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("stops")
          .insert([stopData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(initialData?.id ? "✅ Arrêt mis à jour" : "✅ Arrêt ajouté avec succès");
      onSuccess();
    } catch (error: any) {
      toast.error("❌ Erreur: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const InputClass = "w-full h-11 px-4 bg-black/5 border-0 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium";
  const SelectClass = "w-full h-11 px-4 bg-black/5 border-0 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all appearance-none cursor-pointer font-medium";
  const LabelClass = "text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide";

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="space-y-4">
        <h4 className="text-[15px] font-bold text-[#86868B] uppercase tracking-wide flex items-center">
          <MapPin className="w-4 h-4 mr-2" /> Informations de l'Arrêt
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className={LabelClass}>Nom de l'Arrêt</label>
            <input
              type="text"
              className={InputClass}
              placeholder="Ex: Arrêt Rond-Point Matadi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className={LabelClass}>Ville / Province</label>
            <select
              className={SelectClass}
              value={formData.location_id}
              onChange={(e) => {
                const loc = locations.find(l => l.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  location_id: e.target.value,
                  city_name: loc ? loc.name : "" 
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

          <div className="space-y-2">
            <label className={LabelClass}>Adresse (Optionnel)</label>
            <input
              type="text"
              className={InputClass}
              placeholder="Avenue ou Quartier"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <h4 className="text-[13px] font-bold text-[#86868B] uppercase tracking-wide flex items-center pt-2">
              <Navigation className="w-3 h-3 mr-2" /> Coordonnées GPS (Optionnel)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={LabelClass}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  className={InputClass}
                  placeholder="-4.321"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className={LabelClass}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  className={InputClass}
                  placeholder="15.123"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>
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
          {initialData ? "Mettre à jour" : "Enregistrer l'arrêt"}
        </button>
      </div>
    </form>
  );
}

