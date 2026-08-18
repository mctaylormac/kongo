import React, { useState } from "react";
import { Loader2, Luggage, Utensils, Package, Zap } from "../../../lib/icons";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";

interface ExtraService {
  id: string;
  agency_id: string;
  title: string;
  description: string;
  category: string;
  sub_category?: string;
  price: number;
  min_weight?: number;
  max_weight?: number;
  icon?: string;
  is_active: boolean;
}

interface AddExtraServiceFormProps {
  initialData?: ExtraService | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { id: 'Baggage', label: 'Bagages', icon: Luggage },
  { id: 'Meal', label: 'Repas / Boisson', icon: Utensils },
  { id: 'Transport', label: 'Transport Spécial', icon: Zap },
  { id: 'Other', label: 'Autre', icon: Package },
];

export function AddExtraServiceForm({ initialData, onSuccess, onCancel }: AddExtraServiceFormProps) {
  const { agencyId } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "Baggage",
    sub_category: initialData?.sub_category || "",
    price: initialData?.price || 0,
    min_weight: initialData?.min_weight || 0,
    max_weight: initialData?.max_weight || 0,
    is_active: initialData?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) {
      toast.error("ID de l'agence manquant");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        agency_id: agencyId,
      };

      if (initialData) {
        const { error } = await supabase
          .from('extra_services')
          .update(dataToSave)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success("Service mis à jour avec succès");
      } else {
        const { error } = await supabase
          .from('extra_services')
          .insert([dataToSave]);
        if (error) throw error;
        toast.success("Service ajouté avec succès");
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving extra service:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5">Titre du Service</label>
          <input
            required
            type="text"
            placeholder="Ex: Bagage supplémentaire 10kg"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5">Description</label>
          <textarea
            rows={2}
            placeholder="Description détaillée du service..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-black/5 border-0 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5">Catégorie</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5">Sous-catégorie (Optionnel)</label>
          <input
            type="text"
            placeholder="Ex: Petit / Moyen / Grand"
            value={formData.sub_category}
            onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
            className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5">{formData.category === 'Baggage' ? 'Prix par Kg (CDF)' : 'Prix (CDF)'}</label>
          <input
            required
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10 font-bold"
          />
        </div>

        <div className="flex items-end pb-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative inline-flex items-center">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <div className="w-11 h-6 bg-[#86868B]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
            </div>
            <span className="text-[14px] font-medium text-[#1D1D1F]">Service Actif</span>
          </label>
        </div>

        {formData.category === 'Baggage' && (
          <>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5">Franchise gratuite (kg)</label>
              <input
                type="number"
                min="0"
                value={formData.min_weight}
                onChange={(e) => setFormData({ ...formData, min_weight: Number(e.target.value) })}
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-1.5">Poids Max (kg)</label>
              <input
                type="number"
                min="0"
                value={formData.max_weight}
                onChange={(e) => setFormData({ ...formData, max_weight: Number(e.target.value) })}
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-6 rounded-xl text-[15px] font-medium text-[#1D1D1F] hover:bg-black/5 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 px-8 bg-[#1D1D1F] text-white rounded-xl text-[15px] font-semibold hover:bg-[#3A3A3C] transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px]"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? "Enregistrer" : "Créer le service")}
        </button>
      </div>
    </form>
  );
}
