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
import { Loader2, User } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";

interface DriverAssignmentFormProps {
  bus: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DriverAssignmentForm({ bus, onSuccess, onCancel }: DriverAssignmentFormProps) {
  const { agencyId } = useAppState();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("none");

  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoading(true);
      try {
        const targetAgencyId = bus.agency_id || agencyId;
        
        // Fetch staff members who are drivers in this agency
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('role', 'driver')
          .eq('agency_id', targetAgencyId);
        
        if (error) throw error;
        
        if (data) {
          // Now check which ones are already in drivers table and their assignments
          const { data: driverRecords } = await supabase
            .from('drivers')
            .select('user_id, assigned_bus_id')
            .in('user_id', data.map(d => d.id));
          
          const enrichedDrivers = data.map(d => {
            const record = driverRecords?.find(r => r.user_id === d.id);
            return {
              ...d,
              assigned_bus_id: record?.assigned_bus_id || null
            };
          });
          
          setDrivers(enrichedDrivers);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, [bus, agencyId]);

  const handleAssign = async () => {
    if (selectedDriverId === "none") {
      toast.error("Veuillez sélectionner un chauffeur");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDriver = drivers.find(d => d.id === selectedDriverId);
      
      // Use the RPC which handles:
      // 1. Role validation (superuser, agency, chef, cashier)
      // 2. Automatic driver record creation (upsert)
      // 3. Bus assignment
      const { error } = await supabase.rpc('assign_driver_bus', {
        p_user_id: selectedDriverId,
        p_agency_id: bus.agency_id || agencyId,
        p_full_name: selectedDriver.full_name,
        p_phone: selectedDriver.phone_number || selectedDriver.phone || "",
        p_bus_id: bus.id
      });

      if (error) {
        if (error.message.includes('insufficient role')) {
          throw new Error("Vous n'avez pas les permissions nécessaires pour gérer les chauffeurs.");
        }
        throw error;
      }

      toast.success("Chauffeur assigné avec succès !");
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning driver:", error);
      toast.error(error.message || "Erreur lors de l'affectation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-black/5">
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#1D1D1F] shadow-sm border border-black/5">
          <div className="text-xl">🚌</div>
        </div>
        <div>
          <p className="text-[13px] font-bold text-[#86868B] uppercase tracking-wide">Bus Cible</p>
          <p className="text-[17px] font-bold text-[#1D1D1F]">{bus.plate_number} {bus.name ? `— ${bus.name}` : ""}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide px-1">Sélectionner un Chauffeur</label>
          <Select onValueChange={setSelectedDriverId} value={selectedDriverId}>
            <SelectTrigger className="h-12 rounded-xl border-black/5 bg-black/5 focus:ring-2 focus:ring-black/5">
              <SelectValue placeholder={isLoading ? "Chargement des chauffeurs..." : "Choisir un chauffeur"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>Choisir un chauffeur</SelectItem>
              {drivers.map(driver => {
                const isAssignedToOther = driver.assigned_bus_id && driver.assigned_bus_id !== bus.id;
                return (
                  <SelectItem 
                    key={driver.id} 
                    value={driver.id}
                    disabled={isAssignedToOther}
                  >
                    {driver.full_name} {isAssignedToOther ? `(Déjà sur un autre bus)` : driver.assigned_bus_id === bus.id ? "(Chauffeur actuel)" : "(Libre)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {drivers.length === 0 && !isLoading && (
            <p className="text-[12px] text-red-500 font-medium px-1">Aucun chauffeur disponible dans cette agence.</p>
          )}
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
            disabled={isSubmitting || isLoading || selectedDriverId === "none"}
            className="flex-1 h-12 bg-[#1D1D1F] text-white rounded-xl font-bold hover:bg-[#3A3A3C] transition-all shadow-md"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assigner au Bus
          </Button>
        </div>
      </div>
    </div>
  );
}
