import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Loader2 } from "../../../lib/icons";

interface AddBusFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddBusForm({ initialData, onSuccess, onCancel }: AddBusFormProps) {
  const { userRole, agencyId } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);

  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
      plate_number: initialData?.plate_number || "",
      capacity: initialData?.capacity || 50,
      type: initialData?.type || "Luxury Coach",
      status: initialData?.status || "active",
      agency_id: initialData?.agency_id || agencyId || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        plate_number: initialData.plate_number || "",
        capacity: initialData.capacity || 50,
        type: initialData.type || "Luxury Coach",
        status: initialData.status || "active",
        agency_id: initialData.agency_id || agencyId || "",
      });
    }
  }, [initialData, agencyId, form]);

  useEffect(() => {
    if (userRole === 'superuser') {
      const fetchAgencies = async () => {
        setIsLoadingAgencies(true);
        try {
          const { data, error } = await supabase
            .from('agencies')
            .select('id, name')
            .order('name');
          if (error) throw error;
          if (data) setAgencies(data);
        } catch (error) {
          console.error("Error fetching agencies:", error);
          toast.error("Impossible de charger les agences");
        } finally {
          setIsLoadingAgencies(false);
        }
      };
      fetchAgencies();
    }
  }, [userRole]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        plate_number: values.plate_number,
        capacity: values.capacity,
        type: values.type,
        status: values.status,
        agency_id: userRole === 'superuser' ? values.agency_id : agencyId
      };

      if (!payload.agency_id) {
        throw new Error("L'agence est requise");
      }

      if (initialData?.id) {
        const { error } = await supabase
          .from('buses')
          .update(payload)
          .eq('id', initialData.id);

        if (error) {
          if (error.code === '23505') {
            throw new Error("Un bus avec cette plaque existe déjà");
          }
          throw error;
        }
        toast.success("Bus mis à jour avec succès !");
      } else {
        const { error } = await supabase
          .from('buses')
          .insert([payload]);

        if (error) {
          if (error.code === '23505') {
            throw new Error("Un bus avec cette plaque existe déjà");
          }
          throw error;
        }
        toast.success("Bus enregistré avec succès !");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error adding bus:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement du bus");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Le nom du bus est requis" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du Bus / Identifiant</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Luxury-01" {...field} className="h-11 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plate_number"
            rules={{ 
              required: "Le numéro de plaque est requis",
              minLength: { value: 3, message: "Trop court" }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de Plaque</FormLabel>
                <FormControl>
                  <Input placeholder="ABC-1234" {...field} className="font-mono h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            rules={{ 
              required: "La capacité est requise", 
              min: { value: 1, message: "Minimum 1 place" },
              max: { value: 100, message: "Maximum 100 places" }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacité (Places)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    className="h-11 rounded-xl"
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de véhicule</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Type de confort" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="coach">Autocar (Coach)</SelectItem>
                    <SelectItem value="Luxury Coach">Luxury Coach</SelectItem>
                    <SelectItem value="mini">Mini-bus</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut Initial</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {userRole === 'superuser' && (
          <FormField
            control={form.control}
            name="agency_id"
            rules={{ required: "L'agence est requise" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agence Propriétaire</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder={isLoadingAgencies ? "Chargement..." : "Sélectionner une agence"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agencies.map(agency => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1 h-11 rounded-xl font-bold"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1 h-11 bg-[#1D1D1F] text-white rounded-xl font-bold hover:bg-[#3A3A3C] transition-all shadow-md"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </Form>
  );
}
