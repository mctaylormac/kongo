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
import { Loader2, Eye, EyeOff, ImagePlus, User, X } from "../../../lib/icons";

interface AddStaffFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddStaffForm({ initialData, onSuccess, onCancel }: AddStaffFormProps) {
  const { userRole, agencyId: currentAgencyId } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string; city: string | null }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null);

  const form = useForm({
    defaultValues: {
      full_name: initialData?.full_name || "",
      email: initialData?.email || "",
      phone_number: initialData?.phone_number || "",
      role: initialData?.role || "cashier",
      agency_id: initialData?.agency_id || currentAgencyId || "",
      site_id: initialData?.site_id || "none",
      license_number: initialData?.license_number || "",
      city: initialData?.city || "",
      date_of_birth: initialData?.date_of_birth || "",
      password: "",
    },
  });

  const selectedRole = form.watch("role");
  const selectedAgencyId = form.watch("agency_id");

  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        // Fetch Locations for city selection
        const { data: locData } = await supabase.from('locations').select('id, name').order('name');
        if (isMounted && locData) setLocations(locData);

        // Fetch Agencies if superuser
        if (userRole === 'superuser') {
          const { data: agencyData } = await supabase
            .from('agencies')
            .select('id, name')
            .order('name');
          if (isMounted && agencyData) setAgencies(agencyData);
        }

        // Fetch Sites for the selected agency
        const agencyToUse = userRole === 'superuser' ? selectedAgencyId : currentAgencyId;
        if (agencyToUse && agencyToUse !== "") {
          const { data: siteData } = await supabase
            .from('agency_sites')
            .select('id, name, city')
            .eq('agency_id', agencyToUse)
            .order('name');
          if (isMounted && siteData) setSites(siteData);
        } else {
          if (isMounted) setSites([]);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        if (isMounted) setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
    return () => { isMounted = false; };
  }, [userRole, selectedAgencyId, currentAgencyId]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      let avatar_url = initialData?.avatar_url || null;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('agency-assets')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

        if (uploadError) throw new Error(`Erreur lors du téléchargement de l'image : ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('agency-assets').getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      } else if (!avatarPreview) {
        avatar_url = null;
      }

      const payload: any = {
        full_name: values.full_name,
        email: values.email,
        phone_number: values.phone_number,
        role: values.role,
        agency_id: userRole === 'superuser' ? values.agency_id : currentAgencyId,
        site_id: values.site_id === "none" ? null : values.site_id,
        city: values.city || null,
        date_of_birth: values.date_of_birth || null,
        license_number: values.role === 'driver' ? values.license_number : null,
        avatar_url: avatar_url,
      };

      if (!payload.agency_id) {
        throw new Error("L'agence est requise");
      }

      if (initialData?.id) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', initialData.id);

        if (error) throw error;
        
        toast.success("Profil mis à jour avec succès !");

        // --- NEW: Sync to drivers table if role is driver ---
        if (values.role === 'driver') {
          const targetAgencyId = userRole === 'superuser' ? values.agency_id : currentAgencyId;
          const { error: syncError } = await supabase.rpc('assign_driver_bus', {
            p_user_id: initialData.id,
            p_agency_id: targetAgencyId,
            p_full_name: values.full_name,
            p_phone: values.phone_number,
            p_bus_id: null, // Keep existing bus (RPC handles NULL by COALESCE or we could pass current bus if we had it, but passing NULL is safer to just ensure record exists)
            p_license_number: values.license_number
          });

          if (syncError) {
            console.warn("Driver sync error during update:", syncError);
          }
        }
      } else {
        // Create new auth user and profile
        if (!values.password) {
          throw new Error("Le mot de passe est requis pour un nouveau compte");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.full_name,
              role: values.role,
              agency_id: payload.agency_id,
              site_id: payload.site_id,
              phone_number: values.phone_number,
              city: values.city,
              date_of_birth: values.date_of_birth,
              license_number: values.role === 'driver' ? values.license_number : null,
              avatar_url: avatar_url
            }
          }
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error("Échec de la création du compte utilisateur");
        }

        // If the trigger didn't catch everything or if we need to ensure payload matches
        const { error: profileError } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', authData.user.id);

        if (profileError) {
          console.warn("Profile update error (may be handled by trigger):", profileError);
        }

        toast.success("Membre du personnel enregistré et compte créé !");

        // --- NEW: Sync to drivers table if role is driver ---
        if (values.role === 'driver') {
          const targetAgencyId = userRole === 'superuser' ? values.agency_id : currentAgencyId;
          const { error: syncError } = await supabase.rpc('assign_driver_bus', {
            p_user_id: authData.user.id,
            p_agency_id: targetAgencyId,
            p_full_name: values.full_name,
            p_phone: values.phone_number,
            p_bus_id: null, // No bus assigned yet
            p_license_number: values.license_number
          });

          if (syncError) {
            console.warn("Driver sync error:", syncError);
            toast.info("Profil créé, mais la fiche chauffeur n'a pas pu être initialisée. Elle le sera lors de l'affectation d'un bus.");
          }
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving staff:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <ImagePlus className="w-4 h-4 text-gray-600" />
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("L'image ne doit pas dépasser 2 Mo.");
                    return;
                  }
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }} 
            />
            {avatarPreview && (
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors translate-x-1/3 -translate-y-1/3"
              >
                <X className="w-3 h-3 text-red-500" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="full_name"
            rules={{ required: "Le nom complet est requis" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom Complet</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Jean Dupont" {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            rules={{ 
              required: "L'email est requis",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email invalide"
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="jean@domain.com" {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!initialData && (
          <FormField
            control={form.control}
            name="password"
            rules={{ 
              required: "Le mot de passe est requis",
              minLength: { value: 6, message: "Le mot de passe doit faire au moins 6 caractères" }
            }}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Mot de Passe</FormLabel>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2) + "!";
                      form.setValue("password", randomPassword);
                      setShowPassword(true);
                      toast.info("Mot de passe généré : " + randomPassword);
                    }}
                    className="text-[12px] text-[#007AFF] hover:underline font-medium"
                  >
                    Générer un mot de passe
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      {...field} 
                      className="h-11 rounded-xl pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="+243 ..." {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="driver">Chauffeur</SelectItem>
                    <SelectItem value="cashier">Caissier</SelectItem>
                    <SelectItem value="chef">Chef d'Agence</SelectItem>
                    <SelectItem value="agency">Gestionnaire Agence</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedRole === 'driver' && (
          <FormField
            control={form.control}
            name="license_number"
            rules={{ required: "Le numéro de permis est requis pour les chauffeurs" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de Permis</FormLabel>
                <FormControl>
                  <Input placeholder="LIC-XXXX-XXXX" {...field} className="h-11 rounded-xl font-mono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.name}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de Naissance</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRole === 'superuser' && (
            <FormField
              control={form.control}
              name="agency_id"
              rules={{ required: "L'agence est requise" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agence</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Sélectionner une agence" />
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

          <FormField
            control={form.control}
            name="site_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Affectation Site (Optionnel)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder={isLoadingMetadata ? "Chargement..." : "Sélectionner un site"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Aucun (Siège)</SelectItem>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} ({site.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
