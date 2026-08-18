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
import { Loader2, Bus, CreditCard } from "../../../lib/icons";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";

interface BusAssignmentFormProps {
  staffMember: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BusAssignmentForm({ staffMember, onSuccess, onCancel }: BusAssignmentFormProps) {
  const { agencyId } = useAppState();
  const [buses, setBuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<string>("none");
  const [occupiedBusIds, setOccupiedBusIds] = useState<string[]>([]);
  const [licenseNumber, setLicenseNumber] = useState<string>(staffMember.license_number || "");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch available buses for this agency
        const targetAgencyId = staffMember.agency_id || agencyId;
        const { data: busData } = await supabase
          .from('buses')
          .select('*')
          .eq('agency_id', targetAgencyId)
          .eq('status', 'active')
          .order('name');
        
        if (busData) setBuses(busData);

        // 2. Fetch current driver record to pre-select assigned bus and license number
        const { data: driverData } = await supabase
          .from('drivers')
          .select('assigned_bus_id, license_number')
          .eq('user_id', staffMember.id)
          .maybeSingle();
        
        if (driverData) {
          if (driverData.assigned_bus_id) setSelectedBusId(driverData.assigned_bus_id);
          if (driverData.license_number) setLicenseNumber(driverData.license_number);
        }

        // 3. Fetch all occupied bus IDs in this agency to prevent double assignment
        const { data: allDrivers } = await supabase
          .from('drivers')
          .select('assigned_bus_id')
          .eq('agency_id', targetAgencyId)
          .not('assigned_bus_id', 'is', null);
        
        if (allDrivers) {
          const occupied = allDrivers
            .map(d => d.assigned_bus_id)
            .filter((id): id is string => !!id);
          setOccupiedBusIds(occupied);
        }
      } catch (error) {
        console.error("Error fetching assignment data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [staffMember, agencyId]);

  const handleAssign = async () => {
    setIsSubmitting(true);
    try {
      const busId = selectedBusId === "none" ? null : selectedBusId;
      const targetAgencyId = staffMember.agency_id || agencyId;

      // Use the RPC which handles:
      // 1. Role validation (superuser, agency, chef, cashier)
      // 2. Automatic driver record creation (upsert)
      // 3. Bus assignment
      const { data, error } = await supabase.rpc('assign_driver_bus', {
        p_user_id: staffMember.id,
        p_agency_id: targetAgencyId,
        p_full_name: staffMember.full_name,
        p_phone: staffMember.phone_number || staffMember.phone,
        p_bus_id: busId,
        p_license_number: licenseNumber
      });

      if (error) {
        // Handle specific error messages from the RPC if needed
        if (error.message.includes('insufficient role')) {
          throw new Error("Vous n'avez pas les permissions nécessaires pour gérer les chauffeurs.");
        }
        throw error;
      }

      toast.success("Affectation du bus mise à jour !");
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning bus:", error);
      toast.error(error.message || "Erreur lors de l'affectation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
          <Bus className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-blue-900 uppercase tracking-wide">Chauffeur</p>
          <p className="text-[17px] font-bold text-blue-950">{staffMember.full_name}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide px-1">Choisir un Bus</label>
          <Select onValueChange={setSelectedBusId} value={selectedBusId}>
            <SelectTrigger className="h-12 rounded-xl border-black/5 bg-black/5 focus:ring-2 focus:ring-black/5">
              <SelectValue placeholder={isLoading ? "Chargement des bus..." : "Sélectionner un bus"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun bus assigné</SelectItem>
              {buses.map(bus => {
                const isOccupiedByOther = occupiedBusIds.includes(bus.id) && selectedBusId !== bus.id;
                return (
                  <SelectItem 
                    key={bus.id} 
                    value={bus.id}
                    disabled={isOccupiedByOther}
                  >
                    {bus.name} — {bus.plate_number} ({bus.capacity} places)
                    {isOccupiedByOther && " (Déjà assigné)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide px-1">Numéro de Permis</label>
          <div className="relative">
            <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <Input 
              placeholder="Ex: 0123456789"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="h-12 pl-10 rounded-xl border-black/5 bg-black/5 focus:ring-2 focus:ring-black/5"
            />
          </div>
          <p className="text-[11px] text-[#86868B] px-1">Optionnel - Sera enregistré sur le profil du chauffeur.</p>
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
            Confirmer l'Affectation
          </Button>
        </div>
      </div>
    </div>
  );
}
