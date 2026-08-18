import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Loader2, Bus, Train, Wifi, Wind, Zap, Coffee, Shield, Clock, MapPin, Calendar, Image as ImageIcon, Globe } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';

const AMENITIES_OPTIONS = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'ac', label: 'Climatisation', icon: Wind },
    { id: 'charging', label: 'Prises USB', icon: Zap },
    { id: 'meals', label: 'Repas', icon: Coffee },
    { id: 'toilet', label: 'Toilettes', icon: Shield },
    { id: 'sleeping', label: 'Couchettes', icon: Clock },
    { id: 'observation', label: 'Vue Panoramique', icon: MapPin }
];

interface BaseFormProps {
    isOpen: boolean;
    onClose: () => void;
    agencyId?: string;
    initialData?: any;
    sites?: any[]; // Sites pour le personnel
}

export function AddAgencyForm({ isOpen, onClose, initialData }: BaseFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        logoUrl: ''
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.contact_phone || '',
                email: initialData.contact_email || '',
                address: initialData.address || '',
                logoUrl: initialData.logo_url || ''
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                logoUrl: ''
            });
            setLogoFile(null);
        }
    }, [initialData, isOpen]);

    const handleFileUpload = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `logos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
            .from('agencies')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('agencies').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error("Le nom de l'agence est requis");
            return;
        }

        setIsLoading(true);
        try {
            let finalLogoUrl = formData.logoUrl;
            
            if (logoFile) {
                toast.loading("Téléchargement du logo...", { id: 'upload' });
                try {
                   finalLogoUrl = await handleFileUpload(logoFile);
                   toast.success("Logo téléchargé !", { id: 'upload' });
                } catch (e: any) {
                   toast.error("Erreur lors de l'upload: " + e.message, { id: 'upload' });
                   setIsLoading(false);
                   return;
                }
            }

            const agencyData = {
                name: formData.name,
                contact_phone: formData.phone,
                contact_email: formData.email,
                address: formData.address,
                logo_url: finalLogoUrl
            };

            let error;
            if (initialData?.id) {
                const { error: updateError } = await supabase
                    .from('agencies')
                    .update(agencyData)
                    .eq('id', initialData.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('agencies')
                    .insert([agencyData]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(initialData ? "✅ Agence mise à jour" : "✅ Agence enregistrée");
            onClose();
            window.dispatchEvent(new CustomEvent('refresh-agencies'));
        } catch (error: any) {
            toast.error("❌ Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle>{initialData ? "Modifier l'Agence" : "Ajouter une Agence"}</DialogTitle>
                        <DialogDescription>
                            {initialData ? "Mettez à jour les informations de votre partenaire." : "Créez un nouveau partenaire de transport sur la plateforme."}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="agency-name">Nom de l'agence</Label>
                            <Input
                                id="agency-name"
                                placeholder="Ex: KonGO Express"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="agency-phone">Téléphone</Label>
                                <Input
                                    id="agency-phone"
                                    placeholder="+243..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="agency-email">Email</Label>
                                <Input
                                    id="agency-email"
                                    type="email"
                                    placeholder="contact@agence.cd"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="agency-address">Adresse Siège</Label>
                            <Input
                                id="agency-address"
                                placeholder="Avenue, Ville, RDC"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2 border-t pt-4 mt-2">
                            <Label className="text-kongo-black flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-kongo-lime" />
                                Branding Agence (Image / Logo)
                            </Label>
                            
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="agency-logo-file"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setLogoFile(file);
                                        }}
                                        className="cursor-pointer h-10 py-1"
                                    />
                                    {logoFile && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setLogoFile(null)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            Effacer
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Globe className="w-4 h-4 text-tertiary" />
                                    </div>
                                    <Input
                                        id="agency-logo"
                                        placeholder="Ou entrez une URL https://..."
                                        className="pl-10"
                                        value={formData.logoUrl}
                                        onChange={(e) => {
                                            setFormData({ ...formData, logoUrl: e.target.value });
                                            if (e.target.value) setLogoFile(null); // Clear file if URL provided
                                        }}
                                    />
                                </div>
                            </div>

                            {(logoFile || formData.logoUrl) && (
                                <div className="mt-2 h-32 w-full rounded-xl border border-dashed border-border-primary overflow-hidden bg-surface-secondary flex flex-col items-center justify-center p-3">
                                    <p className="text-[10px] text-tertiary uppercase font-bold mb-2">Aperçu du Branding</p>
                                    <img 
                                        src={logoFile ? URL.createObjectURL(logoFile) : formData.logoUrl} 
                                        alt="Brainding Agence" 
                                        className="h-20 object-contain" 
                                        onError={(e) => (e.currentTarget.style.display = 'none')} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-2">
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-kongo-black text-white hover:bg-kongo-black/90"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? "Mettre à jour" : "Enregistrer l'Agence"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function AddAgencyAdminForm({ isOpen, onClose, initialData }: BaseFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [agencies, setAgencies] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        agencyId: '',
        email: '',
        password: '',
        fullName: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                agencyId: initialData.agency_id || '',
                email: initialData.email || '',
                password: '', // Password remains empty unless changing? Auth update is complex.
                fullName: initialData.full_name || ''
            });
        } else {
            setFormData({
                agencyId: '',
                email: '',
                password: '',
                fullName: ''
            });
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        const fetchAgencies = async () => {
            const { data } = await supabase.from('agencies').select('id, name');
            if (data) setAgencies(data);
        };
        if (isOpen) fetchAgencies();
    }, [isOpen]);

    const handleSave = async () => {
        if (!formData.email || !formData.fullName || !formData.agencyId) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        if (!initialData && !formData.password) {
            toast.error("Le mot de passe est requis pour un nouveau compte");
            return;
        }

        setIsLoading(true);
        try {
            if (initialData) {
                // Update profile only
                console.log("Updating admin profile:", initialData.id, "to agency:", formData.agencyId);
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.fullName,
                        agency_id: formData.agencyId,
                        role: 'agency'
                    })
                    .eq('id', initialData.id);

                if (profileError) throw profileError;
                
                // Also update session metadata locally if possible or just rely on DB
                toast.success(`✅ Profil administrateur d'agence mis à jour !`);
            } else {
                // Fetch current session to restore it later
                const { data: { session } } = await supabase.auth.getSession();

                // Register the account
                const { data: authData, error: authError } = await supabase.auth.signUp({
                  email: formData.email,
                  password: formData.password,
                  options: {
                    data: {
                      full_name: formData.fullName,
                      role: 'agency', // ENSURE role is agency in auth metadata
                      agency_id: formData.agencyId
                    }
                  }
                });

                if (authError) throw authError;

                // Sync profile - ensure role is agency and agency_id is correctly set
                if (authData.user) {
                    const { error: syncError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: authData.user.id,
                            email: formData.email,
                            role: 'agency', 
                            agency_id: formData.agencyId,
                            full_name: formData.fullName
                        });
                    
                    if (syncError) {
                        console.error("Profile sync error:", syncError);
                        // Try update if upsert fails
                        await supabase
                            .from('profiles')
                            .update({
                                role: 'agency',
                                agency_id: formData.agencyId,
                                full_name: formData.fullName
                            })
                            .eq('id', authData.user.id);
                    }
                }
                
                // Restore the admin session immediately to avoid logging them out
                if (session) {
                    await supabase.auth.setSession({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token
                    });
                }
                
                toast.success("✅ Compte administrateur d'agence créé !");
            }

            onClose();
            window.dispatchEvent(new CustomEvent('refresh-admins'));
        } catch (error: any) {
            toast.error("❌ Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Modifier le Compte" : "Créer un Compte Agence"}</DialogTitle>
                    <DialogDescription>
                        {initialData 
                            ? "Mettez à jour les informations du compte administrateur d'agence."
                            : "Créez un nouvel accès administrateur lié à une agence spécifique."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Agence associée</Label>
                        <Select
                            value={formData.agencyId}
                            onValueChange={(v) => setFormData({ ...formData, agencyId: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'agence" />
                            </SelectTrigger>
                            <SelectContent>
                                {agencies.map(agency => (
                                    <SelectItem key={agency.id} value={agency.id}>
                                        {agency.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Nom Complet</Label>
                        <Input
                            placeholder="Ex: Jean Mukendi"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            placeholder="admin@agence.cd"
                            value={formData.email}
                            disabled={!!initialData} // Email is usually fixed in auth
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    {!initialData && (
                        <div className="grid gap-2">
                            <Label>Mot de passe</Label>
                            <Input
                                type="password"
                                placeholder="********"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-kongo-black text-white hover:bg-kongo-black/90 font-bold">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Mettre à jour" : "Créer le compte"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function AddBusForm({ isOpen, onClose, agencyId }: BaseFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [agencies, setAgencies] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        agencyId: agencyId || '',
        name: '',
        type: 'Luxe',
        plateNumber: '',
        capacity: '45'
    });

    useEffect(() => {
        if (isOpen) {
            fetchAgencies();
        }
    }, [isOpen]);

    useEffect(() => {
        if (agencyId) {
            setFormData(prev => ({ ...prev, agencyId }));
        }
    }, [agencyId]);

    const fetchAgencies = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        let finalAgencyId = agencyId;
        
        // If agencyId not provided via props, try to get it from metadata or profile
        if (!finalAgencyId && user) {
            finalAgencyId = user.user_metadata?.agency_id;
            
            if (!finalAgencyId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('agency_id')
                    .eq('id', user.id)
                    .single();
                finalAgencyId = profile?.agency_id;
            }
        }

        const isAdmin = user?.user_metadata?.role === 'superuser';

        if (isAdmin) {
            const { data } = await supabase.from('agencies').select('id, name');
            if (data) setAgencies(data);
        } else if (finalAgencyId) {
            const { data } = await supabase.from('agencies').select('id, name').eq('id', finalAgencyId);
            if (data) {
                setAgencies(data);
                setFormData(prev => ({ ...prev, agencyId: finalAgencyId }));
            }
        }
    };

    const handleSave = async () => {
        if (!formData.agencyId || !formData.name || !formData.plateNumber) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('buses')
                .insert([{
                    agency_id: formData.agencyId || null,
                    name: formData.name,
                    plate_number: formData.plateNumber,
                    capacity: parseInt(formData.capacity) || 0,
                    type: formData.type
                }]);

            if (error) throw error;

            toast.success("✅ Bus enregistré");
            onClose();
            window.dispatchEvent(new CustomEvent('refresh-buses'));
        } catch (error: any) {
            toast.error("❌ Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle>Ajouter un Bus</DialogTitle>
                        <DialogDescription>
                            Enregistrez un nouveau véhicule dans votre flotte ou celle d'un partenaire.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Agence Propriétaire</Label>
                            <Select
                                value={formData.agencyId}
                                onValueChange={(v: string) => setFormData({ ...formData, agencyId: v })}
                                disabled={agencies.length === 1}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une agence" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agencies.map(a => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bus-name">Nom du Bus / Identifiant</Label>
                            <Input
                                id="bus-name"
                                placeholder="Ex: Luxury-01"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bus-plate">Plaque d'immatriculation</Label>
                                <Input
                                    id="bus-plate"
                                    placeholder="KIN-0000-AA"
                                    value={formData.plateNumber}
                                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bus-capacity">Capacité (Sièges)</Label>
                                <Input
                                    id="bus-capacity"
                                    type="number"
                                    placeholder="45"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Type de véhicule</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v: string) => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Type de confort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="coach">Autocar (Coach)</SelectItem>
                                    <SelectItem value="Luxury Coach">Luxury Coach</SelectItem>
                                    <SelectItem value="mini">Mini-bus</SelectItem>
                                    <SelectItem value="van">Van</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-2">
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-kongo-black text-white hover:bg-kongo-black/90"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer le Bus
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function AddDriverForm({ isOpen, onClose, agencyId }: BaseFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        licenseNumber: ''
    });

    const handleSave = async () => {
        if (!formData.name || !formData.email) {
            toast.error("Veuillez remplir le nom et l'email du chauffeur");
            return;
        }

        setIsLoading(true);
        try {
            // Fetch current session to restore it later
            const { data: { session } } = await supabase.auth.getSession();
            const { data: { user } } = await supabase.auth.getUser();
            
            let finalAgencyId = agencyId;
            
            // If agencyId not provided via props, try to get it from metadata or profile
            if (!finalAgencyId && user) {
                finalAgencyId = user.user_metadata?.agency_id;
                
                if (!finalAgencyId) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('agency_id')
                        .eq('id', user.id)
                        .single();
                    finalAgencyId = profile?.agency_id;
                }
            }

            const tempPassword = 'KongoDriver' + Math.floor(Math.random() * 1000) + '!';
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: tempPassword,
                options: {
                    data: {
                        full_name: formData.name,
                        role: 'driver',
                        agency_id: finalAgencyId || null,
                        phone: formData.phone,
                        license_number: formData.licenseNumber
                    }
                }
            });

            // Restore the admin session immediately to avoid logging them out
            if (session) {
                await supabase.auth.setSession({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token
                });
            }

            if (error) throw error;

            toast.success("✅ Chauffeur ajouté", {
                description: `Le compte a été créé. Mot de passe provisoire : ${tempPassword}`
            });
            onClose();
        } catch (error: any) {
            toast.error("❌ Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle>Ajouter un Chauffeur</DialogTitle>
                        <DialogDescription>
                            Ajoutez un chauffeur à votre agence. Il pourra se connecter pour scanner les tickets.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="driver-name">Nom complet</Label>
                            <Input
                                id="driver-name"
                                placeholder="Jean Dupont"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="driver-phone">Téléphone</Label>
                                <Input
                                    id="driver-phone"
                                    placeholder="+243..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="driver-email">Email (Connexion)</Label>
                                <Input
                                    id="driver-email"
                                    type="email"
                                    placeholder="chauffeur@agence.cd"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="driver-license">Numéro de Permis</Label>
                            <Input
                                id="driver-license"
                                placeholder="PC-XXXX-XXXX"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-2">
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-kongo-black text-white hover:bg-kongo-black/90"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer le Chauffeur
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}


export function AddStaffForm({ isOpen, onClose, agencyId, sites, initialData }: BaseFormProps & { sites?: any[], initialData?: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        role: 'cashier',
        password: '',
        siteId: '',
        licenseNumber: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.full_name || '',
                    phone: initialData.phone || initialData.phone_number || '',
                    email: initialData.email || '',
                    role: initialData.role || 'cashier',
                    password: '', // On ne pré-remplit pas le mot de passe
                    siteId: initialData.site_id || '',
                    licenseNumber: initialData.license_number || ''
                });
            } else {
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    role: 'cashier',
                    password: '',
                    siteId: '',
                    licenseNumber: ''
                });
            }
            setIsLoading(false);
        }
    }, [isOpen, agencyId, initialData]);

    const handleSave = async () => {
        // En mode édition, le mot de passe n'est pas obligatoire
        if (!formData.name || !formData.email || !formData.role || (!initialData && !formData.password)) {
            toast.error("Veuillez remplir tous les champs requis");
            return;
        }
        
        if (!initialData && formData.password.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères");
            return;
        }

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let finalAgencyId = agencyId;
            
            // If agencyId not provided via props, try to get it from logged in user
            if (!finalAgencyId && user) {
                finalAgencyId = user.user_metadata?.agency_id;
                if (!finalAgencyId) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('agency_id')
                        .eq('id', user.id)
                        .single();
                    finalAgencyId = profile?.agency_id;
                }
            }

            if (initialData) {
                // UPDATE MODE
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.name,
                        role: formData.role,
                        site_id: (formData.siteId === 'none' || !formData.siteId) ? null : formData.siteId,
                        phone_number: formData.phone,
                        license_number: formData.role === 'driver' ? formData.licenseNumber : null
                    })
                    .eq('id', initialData.id);

                if (error) throw error;
                
                toast.success("✅ Profil mis à jour");
            } else {
                // CREATE MODE (Sign up)
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.name,
                            role: formData.role,
                            agency_id: finalAgencyId || null,
                            site_id: formData.siteId || null,
                            phone: formData.phone,
                            license_number: formData.role === 'driver' ? formData.licenseNumber : null
                        }
                    }
                });

                if (authError) throw authError;

                // CRITICAL: Manually sync to profiles table to ensure EVERYTHING (especially site_id) is captured
                if (authData.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: authData.user.id,
                            email: formData.email,
                            full_name: formData.name,
                            role: formData.role,
                            agency_id: finalAgencyId || null,
                            site_id: (formData.siteId === 'none' || !formData.siteId) ? null : formData.siteId,
                            phone_number: formData.phone,
                            license_number: formData.role === 'driver' ? formData.licenseNumber : null
                        });
                    
                    if (profileError) console.error("Profile sync error:", profileError);
                }

                // Restore session to prevent logout of the admin
                if (currentSession) {
                    await supabase.auth.setSession({
                        access_token: currentSession.access_token,
                        refresh_token: currentSession.refresh_token
                    });
                }
                
                toast.success(formData.role === 'driver' ? "✅ Chauffeur ajouté" : "✅ Membre du personnel ajouté");
            }
            onClose();
            window.dispatchEvent(new CustomEvent('refresh-staff'));
            window.dispatchEvent(new CustomEvent('refresh-drivers'));
        } catch (error: any) {
            toast.error("❌ Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle>
                            {initialData ? "Modifier" : "Ajouter"} {formData.role === 'driver' ? 'un Chauffeur' : 'un Membre du Personnel'}
                        </DialogTitle>
                        <DialogDescription>
                            {initialData 
                                ? "Mettez à jour les informations de votre employé." 
                                : "Créez un compte pour un nouvel employé de votre agence."}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="staff-role">Fonction / Rôle</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(v: string) => setFormData({ ...formData, role: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cashier">Caissier / Agent de vente</SelectItem>
                                        <SelectItem value="chef">Chef d'Agence / Superviseur</SelectItem>
                                        <SelectItem value="driver">Chauffeur / Conducteur</SelectItem>
                                        <SelectItem value="agency">Administrateur Agence</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="staff-site">Affectation Site</Label>
                                <Select
                                    value={formData.siteId}
                                    onValueChange={(v: string) => setFormData({ ...formData, siteId: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Siège / Bureau" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Siège Principal</SelectItem>
                                        {sites?.map(site => (
                                            <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="staff-name">Nom complet</Label>
                            <Input
                                id="staff-name"
                                placeholder="Jean Mukendi"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="staff-email">Email (Identifiant)</Label>
                                <Input
                                    id="staff-email"
                                    type="email"
                                    placeholder="employe@agence.cd"
                                    disabled={!!initialData}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="staff-phone">Téléphone</Label>
                                <Input
                                    id="staff-phone"
                                    placeholder="+243..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {formData.role === 'driver' && (
                            <div className="grid gap-2">
                                <Label htmlFor="staff-license">Numéro de Permis de conduire</Label>
                                <Input
                                    id="staff-license"
                                    placeholder="PC-XXXX-XXXX"
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                />
                            </div>
                        )}

                        {!initialData && (
                            <div className="grid gap-2">
                                <Label htmlFor="staff-password">Mot de passe temporaire</Label>
                                <Input
                                    id="staff-password"
                                    type="password"
                                    placeholder="Min. 6 caractères"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <p className="text-[10px] text-tertiary">L'employé devra changer son mot de passe à la première connexion.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 pt-2">
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-kongo-black text-white hover:bg-kongo-black/90 font-bold"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? "Sauvegarder" : "Créer le compte"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}


export function AddTripForm({ isOpen, onClose, agencyId, initialData }: BaseFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        originId: '',
        destinationId: '',
        departureDate: '',
        departureTime: '',
        arrivalDate: '',
        arrivalTime: '',
        price: '',
        busId: '',
        vehicleType: 'bus',
        busType: '',
        trainClass: 'economy',
        amenities: [] as string[],
        status: 'scheduled',
        departureAddress: '',
        arrivalAddress: '',
        stopsIds: [] as string[],
        departureStopId: '',
        arrivalStopId: ''
    });
    const [stops, setStops] = useState<any[]>([]);

    useEffect(() => {
        if (initialData) {
            const depDate = initialData.departure_time ? initialData.departure_time.split('T')[0] : '';
            const depTime = initialData.departure_time ? initialData.departure_time.split('T')[1].substring(0, 5) : '';
            const arrDate = initialData.arrival_time ? initialData.arrival_time.split('T')[0] : '';
            const arrTime = initialData.arrival_time ? initialData.arrival_time.split('T')[1].substring(0, 5) : '';

            setFormData({
                originId: initialData.origin_location_id || '',
                destinationId: initialData.destination_location_id || '',
                departureDate: depDate,
                departureTime: depTime,
                arrivalDate: arrDate,
                arrivalTime: arrTime,
                price: initialData.price?.toString() || '',
                busId: initialData.bus_id || '',
                vehicleType: initialData.vehicle_type || 'bus',
                busType: initialData.bus_type || '',
                trainClass: initialData.train_class || 'economy',
                amenities: initialData.amenities || [],
                status: initialData.status || 'scheduled',
                departureAddress: initialData.departure_address || '',
                arrivalAddress: initialData.arrival_address || '',
                stopsIds: initialData.stops_ids || [],
                departureStopId: initialData.departure_stop_id || '',
                arrivalStopId: initialData.arrival_stop_id || ''
            });
        } else {
            setFormData({
                originId: '',
                destinationId: '',
                departureDate: '',
                departureTime: '',
                arrivalDate: '',
                arrivalTime: '',
                price: '',
                busId: '',
                vehicleType: 'bus',
                busType: '',
                trainClass: 'economy',
                amenities: [] as string[],
                status: 'scheduled',
                departureAddress: '',
                arrivalAddress: '',
                stopsIds: [] as string[],
                departureStopId: '',
                arrivalStopId: ''
            });
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        let finalAgencyId = agencyId;
        
        // If agencyId not provided via props, try to get it from metadata or profile
        if (!finalAgencyId && user) {
            finalAgencyId = user.user_metadata?.agency_id;
            
            if (!finalAgencyId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('agency_id')
                    .eq('id', user.id)
                    .single();
                finalAgencyId = profile?.agency_id;
            }
        }

        const isAdmin = user?.user_metadata?.role === 'superuser';

        const locsQuery = supabase.from('locations').select('id, name');
        let busesQuery = supabase.from('buses').select('id, name, agency_id, plate_number, capacity, type');
        const stopsQuery = supabase.from('stops').select('*');
        
        if (!isAdmin && finalAgencyId) {
            busesQuery = busesQuery.eq('agency_id', finalAgencyId);
        }

        const [locsRes, busesRes, stopsRes] = await Promise.all([locsQuery, busesQuery, stopsQuery]);
        
        if (locsRes.data) setLocations(locsRes.data);
        if (busesRes.data) setBuses(busesRes.data);
        if (stopsRes.data) setStops(stopsRes.data);
    };

    const handleSave = async () => {
        if (!formData.originId || !formData.destinationId || !formData.departureDate || !formData.departureTime || !formData.price || !formData.busId || !formData.arrivalDate || !formData.arrivalTime) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsLoading(true);
        try {
            const departureDateTime = `${formData.departureDate}T${formData.departureTime}:00Z`;
            const arrivalDateTime = `${formData.arrivalDate}T${formData.arrivalTime}:00Z`;

            const selectedBus = buses.find(b => b.id === formData.busId);

            const tripData: any = {
                agency_id: selectedBus.agency_id,
                origin_location_id: formData.originId,
                destination_location_id: formData.destinationId,
                departure_time: departureDateTime,
                arrival_time: arrivalDateTime,
                price: parseFloat(formData.price),
                total_seats: selectedBus.capacity || 45,
                seats_available: selectedBus.capacity || 45,
                vehicle_type: formData.vehicleType,
                bus_type: formData.vehicleType === 'bus' ? (formData.busType || selectedBus.type) : null,
                train_class: formData.vehicleType === 'train' ? formData.trainClass : null,
                amenities: formData.amenities,
                status: formData.status,
                departure_address: formData.departureAddress,
                arrival_address: formData.arrivalAddress,
                stops_ids: formData.stopsIds,
                departure_stop_id: formData.departureStopId || null,
                arrival_stop_id: formData.arrivalStopId || null
            };

            let error;
            if (initialData?.id) {
                const { error: updateError } = await supabase
                    .from('trips')
                    .update(tripData)
                    .eq('id', initialData.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('trips')
                    .insert([tripData]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(initialData?.id ? "✅ Voyage mis à jour" : "✅ Voyage publié");
            onClose();
            window.dispatchEvent(new CustomEvent('refresh-trips'));
        } catch (error: any) {
            toast.error("❌ Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle>Créer un Nouveau Voyage</DialogTitle>
                        <DialogDescription>
                            Planifiez un itinéraire, fixez l'horaire et le tarif.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-2">
                    <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-tertiary uppercase flex items-center">
                                <MapPin className="w-4 h-4 mr-2" /> Itinéraire
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Ville de départ</Label>
                                    <Select
                                        value={formData.originId}
                                        onValueChange={(v: string) => setFormData({ ...formData, originId: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Origine" /></SelectTrigger>
                                        <SelectContent>
                                            {locations.map(l => (
                                                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Ville d'arrivée</Label>
                                    <Select
                                        value={formData.destinationId}
                                        onValueChange={(v: string) => setFormData({ ...formData, destinationId: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                                        <SelectContent>
                                            {locations.map(l => (
                                                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Adresse arrêt départ</Label>
                                    <Input
                                        placeholder="Ex: Arrêt Marché Central"
                                        value={formData.departureAddress}
                                        onChange={(e) => setFormData({ ...formData, departureAddress: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Adresse arrêt terminus</Label>
                                    <Input
                                        placeholder="Ex: Gare du Nord"
                                        value={formData.arrivalAddress}
                                        onChange={(e) => setFormData({ ...formData, arrivalAddress: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Point de ramassage (Optionnel)</Label>
                                    <Select
                                        value={formData.departureStopId}
                                        onValueChange={(v: string) => setFormData({ ...formData, departureStopId: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Choisir un arrêt" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun (Centre ville)</SelectItem>
                                            {stops.filter(s => s.location_id === formData.originId || !s.location_id).map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Point de dépose (Optionnel)</Label>
                                    <Select
                                        value={formData.arrivalStopId}
                                        onValueChange={(v: string) => setFormData({ ...formData, arrivalStopId: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Choisir un arrêt" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun (Centre ville)</SelectItem>
                                            {stops.filter(s => s.location_id === formData.destinationId || !s.location_id).map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="departure-date">Date de départ</Label>
                                    <Input
                                        id="departure-date"
                                        type="date"
                                        value={formData.departureDate}
                                        onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="departure-time">Heure de départ</Label>
                                    <Input
                                        id="departure-time"
                                        type="time"
                                        value={formData.departureTime}
                                        onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="arrival-date">Date d'arrivée</Label>
                                    <Input
                                        id="arrival-date"
                                        type="date"
                                        value={formData.arrivalDate}
                                        onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="arrival-time">Heure d'arrivée</Label>
                                    <Input
                                        id="arrival-time"
                                        type="time"
                                        value={formData.arrivalTime}
                                        onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-tertiary uppercase flex items-center">
                                <Bus className="w-4 h-4 mr-2" /> Véhicule et Service
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type de transport</Label>
                                    <Select
                                        value={formData.vehicleType}
                                        onValueChange={(v: string) => setFormData({ ...formData, vehicleType: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bus">Bus / Autocar</SelectItem>
                                            <SelectItem value="train">Train</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Véhicule Assigné</Label>
                                    <Select
                                        value={formData.busId}
                                        onValueChange={(v: string) => setFormData({ ...formData, busId: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Choisir un véhicule" /></SelectTrigger>
                                        <SelectContent>
                                            {buses.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name} ({b.plate_number})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {formData.vehicleType === 'bus' ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="bus-type">Type de Bus (ex: VIP, Standard)</Label>
                                        <Input
                                            id="bus-type"
                                            placeholder="Luxury Coach"
                                            value={formData.busType}
                                            onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label>Classe de Train</Label>
                                        <Select
                                            value={formData.trainClass}
                                            onValueChange={(v: string) => setFormData({ ...formData, trainClass: v })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="economy">Économique</SelectItem>
                                                <SelectItem value="business">Affaires</SelectItem>
                                                <SelectItem value="first">Première Classe</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Prix du billet (CDF)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="125000"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Statut Initial</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v: string) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Planifié</SelectItem>
                                        <SelectItem value="delayed">Retardé</SelectItem>
                                        <SelectItem value="cancelled">Annulé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-tertiary uppercase">Arrêts desservis sur ce trajet</Label>
                            <div className="grid grid-cols-2 gap-2 p-4 bg-surface-secondary rounded-lg border border-border-primary max-h-40 overflow-y-auto">
                                {stops.map((stop) => (
                                    <div key={stop.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            className="border-2 border-gray-400 data-[state=checked]:border-kongo-black"
                                            id={`stop-${stop.id}`}
                                            checked={formData.stopsIds.includes(stop.id)}
                                            onCheckedChange={(checked: boolean) => {
                                                if (checked) {
                                                    setFormData({ ...formData, stopsIds: [...formData.stopsIds, stop.id] });
                                                } else {
                                                    setFormData({ ...formData, stopsIds: formData.stopsIds.filter(id => id !== stop.id) });
                                                }
                                            }}
                                        />
                                        <label htmlFor={`stop-${stop.id}`} className="text-xs cursor-pointer truncate">
                                            {stop.name} <span className="text-[10px] text-tertiary">({stop.city_name})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-tertiary uppercase">Équipements à bord</Label>
                            <div className="grid grid-cols-2 gap-3 p-4 bg-surface-secondary rounded-lg border border-border-primary">
                                {AMENITIES_OPTIONS.map((option) => (
                                    <div key={option.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            className="border-2 border-gray-400 data-[state=checked]:border-kongo-black"
                                            id={`amenity-${option.id}`}
                                            checked={formData.amenities.includes(option.id)}
                                            onCheckedChange={(checked: boolean) => {
                                                if (checked) {
                                                    setFormData({ ...formData, amenities: [...formData.amenities, option.id] });
                                                } else {
                                                    setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== option.id) });
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor={`amenity-${option.id}`}
                                            className="text-sm flex items-center cursor-pointer"
                                        >
                                            <option.icon className="w-3 h-3 mr-2 text-tertiary" />
                                            {option.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-2">
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-kongo-lime text-kongo-black hover:bg-kongo-lime/90 font-bold"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Publier le Voyage
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export interface AddStopFormProps extends BaseFormProps {
    initialData?: any;
}

export function AddStopForm({ isOpen, onClose, initialData }: AddStopFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        cityName: '',
        address: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                cityName: initialData.city_name || '',
                address: initialData.address || ''
            });
        } else {
            setFormData({ name: '', cityName: '', address: '' });
        }
    }, [initialData, isOpen]);

    const handleSave = async () => {
        if (!formData.name || !formData.cityName) {
            toast.error("Veuillez remplir le nom de l'arrêt et la ville");
            return;
        }
        setIsLoading(true);
        try {
            const payload: any = {
                name: formData.name,
                city_name: formData.cityName,
                address: formData.address || null
            };

            let error;
            if (initialData?.id) {
                const { error: err } = await supabase.from('stops').update(payload).eq('id', initialData.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('stops').insert([payload]);
                error = err;
            }

            if (error) throw error;
            toast.success(initialData ? "✅ Arrêt mis à jour" : "✅ Arrêt enregistré");
            onClose();
            window.dispatchEvent(new CustomEvent('refresh-stops'));
        } catch (error: any) {
            toast.error("❌ Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Modifier" : "Ajouter"} un Arrêt</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Nom de l'Arrêt</Label>
                        <Input placeholder="Ex: Arrêt Rond-Point Matadi" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Ville / Province</Label>
                        <Input placeholder="Ex: Kinshasa" value={formData.cityName} onChange={e => setFormData({ ...formData, cityName: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Adresse (Optionnel)</Label>
                        <Input placeholder="Avenue ou Quartier" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-kongo-black text-white hover:bg-kongo-black/90">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Mettre à jour" : "Enregistrer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export interface AddAgeCategoryFormProps extends BaseFormProps {
    initialData?: any;
    trips?: any[];
}

export function AddAgeCategoryForm({ isOpen, onClose, initialData, trips = [] }: AddAgeCategoryFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        discount: '0',
        tripId: 'all'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                discount: (initialData.discount_percentage || 0).toString(),
                tripId: initialData.trip_id || 'all'
            });
        } else {
            setFormData({ name: '', discount: '0', tripId: 'all' });
        }
    }, [initialData, isOpen]);

    const handleSave = async () => {
        if (!formData.name) {
            toast.error("Veuillez saisir un nom");
            return;
        }
        setIsLoading(true);
        try {
            const payload: any = {
                name: formData.name,
                discount_percentage: parseFloat(formData.discount) || 0,
                trip_id: formData.tripId === 'all' ? null : formData.tripId
            };

            let error;
            if (initialData?.id) {
                const { error: err } = await supabase.from('age_categories').update(payload).eq('id', initialData.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('age_categories').insert([payload]);
                error = err;
            }

            if (error) throw error;
            toast.success(initialData ? "✅ Catégorie mise à jour" : "✅ Catégorie tarifaire ajoutée");
            onClose();
            window.dispatchEvent(new CustomEvent('refresh-categories'));
        } catch (error: any) {
            toast.error("❌ Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Modifier" : "Ajouter"} une Catégorie (Tarif)</DialogTitle>
                    <DialogDescription>Cette catégorie modifiera le prix de base d'un billet via une réduction.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Nom de la Catégorie</Label>
                        <Input placeholder="Ex: Étudiant" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Pourcentage de réduction (%)</Label>
                        <Input type="number" min="0" max="100" placeholder="Ex: 50 (pour -50%)" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Assigner à un voyage spécifique (Optionnel)</Label>
                        <Select value={formData.tripId} onValueChange={(val: string) => setFormData({ ...formData, tripId: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tous les voyages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les voyages (Défaut)</SelectItem>
                                {trips.map(trip => (
                                    <SelectItem key={trip.id} value={trip.id}>
                                        {trip.origin?.name || 'Départ'} → {trip.destination?.name || 'Arrivée'} ({new Date(trip.departure_time).toLocaleDateString()})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-kongo-black text-white hover:bg-kongo-black/90">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Mettre à jour" : "Enregistrer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AddSiteForm({ isOpen, onClose, agencyId, initialData }: BaseFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        phone: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                address: initialData.address || '',
                city: initialData.city || '',
                phone: initialData.phone || ''
            });
        } else {
            setFormData({ name: '', address: '', city: '', phone: '' });
        }
    }, [initialData, isOpen]);

    const handleSave = async () => {
        if (!formData.name) {
            toast.error("Veuillez saisir au moins le nom du site");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                agency_id: agencyId,
                name: formData.name,
                address: formData.address,
                city: formData.city,
                phone: formData.phone
            };

            let error;
            if (initialData?.id) {
                const { error: err } = await supabase.from('agency_sites').update(payload).eq('id', initialData.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('agency_sites').insert([payload]);
                error = err;
            }

            if (error) throw error;
            toast.success(initialData ? "Site mis à jour" : "Nouveau site ajouté");
            onClose();
            window.dispatchEvent(new CustomEvent('refresh-sites'));
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Modifier" : "Ajouter"} un Site d'Agence</DialogTitle>
                    <DialogDescription>Gérez vos points de vente physiques et bureaux.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Nom du Site / Agence physique</Label>
                        <Input placeholder="Ex: Agence Limete" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Ville</Label>
                        <Input placeholder="Kinshasa" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Adresse</Label>
                        <Input placeholder="Avenue, Quartier..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Téléphone direct du bureau</Label>
                        <Input placeholder="+243..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-kongo-black text-white hover:bg-kongo-black/90">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Mettre à jour" : "Enregistrer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
