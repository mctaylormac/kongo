import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loader2, MapPin } from "../../../lib/icons";

interface SiteAssignmentFormProps {
  staffMember: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SiteAssignmentForm({ staffMember, onSuccess, onCancel }: SiteAssignmentFormProps) {
  const { userRole, agencyId } = useAppState();
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("none");

  useEffect(() => {
    const fetchSites = async () => {
      setIsLoading(true);
      try {
        const targetAgencyId = staffMember.agency_id || agencyId;
        const { data } = await supabase
          .from('agency_sites')
          .select('*')
          .eq('agency_id', targetAgencyId)
          .order('name');
        
        if (data) setSites(data);
        if (staffMember.site_id) {
          setSelectedSiteId(staffMember.site_id);
        }
      } catch (error) {
        console.error("Error fetching sites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSites();
  }, [staffMember, agencyId]);

  const handleAssign = async () => {
    setIsSubmitting(true);
    try {
      const siteId = selectedSiteId === "none" ? null : selectedSiteId;

      const { error } = await supabase
        .from('profiles')
        .update({ site_id: siteId })
        .eq('id', staffMember.id);
      
      if (error) throw error;

      toast.success("Affectation au site mise à jour !");
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning site:", error);
      toast.error(error.message || "Erreur lors de l'affectation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-sm">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-purple-900 uppercase tracking-wide">Personnel</p>
          <p className="text-[17px] font-bold text-purple-950">{staffMember.full_name}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide px-1">Choisir un Site / Agence physique</label>
          <Select onValueChange={setSelectedSiteId} value={selectedSiteId}>
            <SelectTrigger className="h-12 rounded-xl border-black/5 bg-black/5 focus:ring-2 focus:ring-black/5">
              <SelectValue placeholder={isLoading ? "Chargement des sites..." : "Sélectionner un site"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Siège Social / Global</SelectItem>
              {sites.map(site => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name} — {site.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1 h-12 rounded-xl font-bold"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={isSubmitting || isLoading}
            className="flex-1 h-12 bg-[#1D1D1F] text-white rounded-xl font-bold hover:bg-[#3A3A3C] transition-all shadow-md"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mettre à jour le Site
          </Button>
        </div>
      </div>
    </div>
  );
}
