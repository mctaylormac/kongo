import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { Loader2, MapPin, Bus, Check } from "../../../lib/icons";
import { useAppState } from "../../../hooks/useAppState";

const AMENITIES_OPTIONS = [
  { id: "wifi", label: "WiFi" },
  { id: "ac", label: "Climatisation" },
  { id: "charging", label: "Prises USB" },
  { id: "meals", label: "Repas" },
  { id: "toilet", label: "Toilettes" },
  { id: "sleeping", label: "Couchettes" },
  { id: "observation", label: "Vue Panoramique" },
];

interface AddTripFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export function AddTripForm({ onSuccess, onCancel, initialData }: AddTripFormProps) {
  const { userRole, agencyId } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [busyBusIds, setBusyBusIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    originId: "",
    destinationId: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
    staffId: "",
    currency: "CDF",
    duration: "",
    price: "",
    busId: "",
    vehicleType: "bus",
    busType: "",
    trainClass: "economy",
    amenities: [] as string[],
    status: "scheduled",
    departureAddress: "",
    arrivalAddress: "",
    stopsIds: [] as string[],
    departureStopId: "",
    arrivalStopId: "",
    isPopular: false,
    handicapSeats: "0",
  });

  useEffect(() => {
    if (initialData) {
      const depDate = initialData.departure_time ? initialData.departure_time.split("T")[0] : "";
      const depTime = initialData.departure_time ? initialData.departure_time.split("T")[1].substring(0, 5) : "";
      const arrDate = initialData.arrival_time ? initialData.arrival_time.split("T")[0] : "";
      const arrTime = initialData.arrival_time ? initialData.arrival_time.split("T")[1].substring(0, 5) : "";

      setFormData({
        originId: initialData.origin_location_id || "",
        destinationId: initialData.destination_location_id || "",
        departureDate: depDate,
        departureTime: depTime,
        arrivalDate: arrDate,
        arrivalTime: arrTime,
        staffId: initialData.staff_id || "",
        currency: initialData.currency || "CDF",
        duration: initialData.duration || "",
        price: initialData.price?.toString() || "",
        busId: initialData.bus_id || "",
        vehicleType: initialData.vehicle_type || "bus",
        busType: initialData.bus_type || "",
        trainClass: initialData.train_class || "economy",
        amenities: initialData.amenities || [],
        status: initialData.status || "scheduled",
        departureAddress: initialData.departure_address || "",
        arrivalAddress: initialData.arrival_address || "",
        stopsIds: initialData.stops_ids || [],
        departureStopId: initialData.departure_stop_id || "",
        arrivalStopId: initialData.arrival_stop_id || "",
        isPopular: initialData.is_popular || false,
        handicapSeats: (initialData.handicap_seats ?? 0).toString(),
      });
    }
  }, [initialData]);

  const fetchData = async () => {
    const locsQuery = supabase.from("locations").select("id, name");
    let busesQuery = supabase.from("buses").select("id, name, agency_id, plate_number, capacity, type");
    const stopsQuery = supabase.from("stops").select("*");
    
    let staffQuery = supabase.from("profiles").select("id, full_name, agency_id").in("role", ["cashier", "chef", "agency"]);

    if (userRole !== "superuser" && agencyId) {
      busesQuery = busesQuery.eq("agency_id", agencyId);
      staffQuery = staffQuery.eq("agency_id", agencyId);
    }

    let tripsQuery = supabase
      .from("trips")
      .select("id, bus_id, status")
      .in("status", ["scheduled", "in_progress", "departed", "full", "delayed"]);

    if (userRole !== "superuser" && agencyId) {
      tripsQuery = tripsQuery.eq("agency_id", agencyId);
    }

    const [locsRes, busesRes, stopsRes, staffRes, tripsRes] = await Promise.all([
      locsQuery, 
      busesQuery, 
      stopsQuery,
      staffQuery,
      tripsQuery,
    ]);

    if (locsRes.error) console.error("Error fetching locations:", locsRes.error);
    if (busesRes.error) console.error("Error fetching buses:", busesRes.error);
    if (stopsRes.error) console.error("Error fetching stops:", stopsRes.error);
    if (staffRes.error) console.error("Error fetching staff:", staffRes.error);
    if (tripsRes.error) console.error("Error fetching trips:", tripsRes.error);

    const activeTrips = (tripsRes.data || []).filter((trip: any) => trip.id !== initialData?.id);
    const busyBuses = new Set(activeTrips.map((trip: any) => trip.bus_id).filter(Boolean));

    if (locsRes.data) setLocations(locsRes.data);
    if (busesRes.data) setBuses(
      (busesRes.data || []).filter(
        (b: any) => !busyBuses.has(b.id) || b.id === initialData?.bus_id
      )
    );
    if (stopsRes.data) setStops(stopsRes.data);
    if (staffRes.data) setStaffList(staffRes.data);

    setBusyBusIds(busyBuses);
  };

  useEffect(() => {
    fetchData();
  }, [userRole, agencyId, initialData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      !formData.originId ||
      !formData.destinationId ||
      !formData.departureDate ||
      !formData.departureTime ||
      !formData.price ||
      !formData.arrivalDate ||
      !formData.arrivalTime
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires (Origine, Destination, Dates, Heures, Prix)");
      return;
    }

    setIsLoading(true);
    try {
      const departureDateTime = `${formData.departureDate}T${formData.departureTime}:00Z`;
      const arrivalDateTime = `${formData.arrivalDate}T${formData.arrivalTime}:00Z`;

      const selectedBus = buses.find((b) => b.id === formData.busId);

      if (selectedBus && busyBusIds.has(selectedBus.id) && selectedBus.id !== initialData?.bus_id) {
        toast.error("Ce véhicule est déjà affecté à un voyage actif.");
        setIsLoading(false);
        return;
      }
      
      const tripAgencyId = selectedBus?.agency_id || agencyId || null;

      const handicapSeatsCount = Math.max(0, parseInt(formData.handicapSeats) || 0);
      const tripData: any = {
        agency_id: tripAgencyId,
        origin_location_id: formData.originId,
        destination_location_id: formData.destinationId,
        departure_time: departureDateTime,
        arrival_time: arrivalDateTime,
        price: parseFloat(formData.price),
        total_seats: selectedBus?.capacity || 45,
        seats_available: selectedBus?.capacity || 45,
        vehicle_type: formData.vehicleType,
        bus_id: formData.busId || null,
        bus_type: formData.vehicleType === "bus" ? formData.busType || selectedBus?.type : null,
        train_class: formData.vehicleType === "train" ? formData.trainClass : null,
        amenities: formData.amenities,
        status: formData.status,
        departure_address: formData.departureAddress,
        arrival_address: formData.arrivalAddress,
        stops_ids: formData.stopsIds,
        driver_id: null,
        staff_id: formData.staffId || null,
        currency: formData.currency,
        duration: formData.duration,
        departure_stop_id: formData.departureStopId || null,
        arrival_stop_id: formData.arrivalStopId || null,
        is_popular: formData.isPopular,
        handicap_seats: handicapSeatsCount,
      };

      let error;
      if (initialData?.id) {
        const { error: updateError } = await supabase.from("trips").update(tripData).eq("id", initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from("trips").insert([tripData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success(initialData?.id ? "✅ Voyage mis à jour" : "✅ Voyage publié");
      onSuccess();
    } catch (error: any) {
      toast.error("❌ Erreur: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const toggleStop = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      stopsIds: prev.stopsIds.includes(id)
        ? prev.stopsIds.filter((s) => s !== id)
        : [...prev.stopsIds, id],
    }));
  };

  const InputClass = "w-full h-11 px-4 bg-black/5 border-0 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all font-medium";
  const SelectClass = "w-full h-11 px-4 bg-black/5 border-0 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all appearance-none cursor-pointer font-medium";
  const LabelClass = "text-[13px] font-bold text-[#1D1D1F] uppercase tracking-wide";

  return (
    <form className="space-y-6 max-h-[70vh] overflow-y-auto pr-2" onSubmit={handleSave}>
      <div className="space-y-4">
        <h4 className="text-[15px] font-bold text-[#86868B] uppercase tracking-wide flex items-center">
          <MapPin className="w-4 h-4 mr-2" /> Itinéraire
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LabelClass}>Ville de départ</label>
            <select
              className={SelectClass}
              value={formData.originId}
              onChange={(e) => setFormData({ ...formData, originId: e.target.value })}
            >
              <option value="">Origine</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={LabelClass}>Ville d'arrivée</label>
            <select
              className={SelectClass}
              value={formData.destinationId}
              onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
            >
              <option value="">Destination</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Adresse arrêt départ</label>
            <input
              type="text"
              className={InputClass}
              placeholder="Ex: Arrêt Marché Central"
              value={formData.departureAddress}
              onChange={(e) => setFormData({ ...formData, departureAddress: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className={LabelClass}>Adresse arrêt terminus</label>
            <input
              type="text"
              className={InputClass}
              placeholder="Ex: Gare du Nord"
              value={formData.arrivalAddress}
              onChange={(e) => setFormData({ ...formData, arrivalAddress: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Point de ramassage (Optionnel)</label>
            <select
              className={SelectClass}
              value={formData.departureStopId}
              onChange={(e) => setFormData({ ...formData, departureStopId: e.target.value })}
            >
              <option value="">Aucun (Centre ville)</option>
              {stops
                .filter((s) => s.location_id === formData.originId || !s.location_id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={LabelClass}>Point de dépose (Optionnel)</label>
            <select
              className={SelectClass}
              value={formData.arrivalStopId}
              onChange={(e) => setFormData({ ...formData, arrivalStopId: e.target.value })}
            >
              <option value="">Aucun (Centre ville)</option>
              {stops
                .filter((s) => s.location_id === formData.destinationId || !s.location_id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Date de départ</label>
            <input
              type="date"
              className={InputClass}
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className={LabelClass}>Heure de départ</label>
            <input
              type="time"
              className={InputClass}
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Date d'arrivée</label>
            <input
              type="date"
              className={InputClass}
              value={formData.arrivalDate}
              onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className={LabelClass}>Heure d'arrivée</label>
            <input
              type="time"
              className={InputClass}
              value={formData.arrivalTime}
              onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-black/5">
        <h4 className="text-[15px] font-bold text-[#86868B] uppercase tracking-wide flex items-center">
          <Bus className="w-4 h-4 mr-2" /> Véhicule et Service
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LabelClass}>Type de transport</label>
            <select
              className={SelectClass}
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            >
              <option value="bus">Bus / Autocar</option>
              <option value="train">Train</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={LabelClass}>Véhicule Assigné</label>
            <select
              className={SelectClass}
              value={formData.busId}
              onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
            >
              <option value="">Choisir un véhicule</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.plate_number})
                </option>
              ))}
            </select>
          </div>

          {formData.vehicleType === "bus" ? (
            <div className="space-y-2">
              <label className={LabelClass}>Type de Bus (ex: VIP, Standard)</label>
              <input
                type="text"
                className={InputClass}
                placeholder="Luxury Coach"
                value={formData.busType}
                onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className={LabelClass}>Classe de Train</label>
              <select
                className={SelectClass}
                value={formData.trainClass}
                onChange={(e) => setFormData({ ...formData, trainClass: e.target.value })}
              >
                <option value="economy">Économique</option>
                <option value="business">Affaires</option>
                <option value="first">Première Classe</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className={LabelClass}>Prix du billet (CDF)</label>
            <input
              type="number"
              className={InputClass}
              placeholder="125000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Statut Initial</label>
            <select
              className={SelectClass}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="scheduled">Planifié</option>
              <option value="delayed">Retardé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Assistant / Convoyeur</label>
            <select
              className={SelectClass}
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
            >
              <option value="">Sélectionner un assistant</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Devise</label>
            <select
              className={SelectClass}
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <option value="CDF">CDF (Franc Congolais)</option>
              <option value="USD">USD (Dollar Américain)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Durée Estimée (ex: 4h 30min)</label>
            <input
              type="text"
              className={InputClass}
              placeholder="6h"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className={LabelClass}>Sièges PMR / Handicapés ♿</label>
            <input
              type="number"
              min="0"
              className={InputClass}
              placeholder="0"
              value={formData.handicapSeats}
              onChange={(e) => setFormData({ ...formData, handicapSeats: e.target.value })}
            />
            <p className="text-[11px] text-[#86868B]">Nombre de places réservées aux personnes à mobilité réduite par voyage</p>
          </div>

          <div className="space-y-2 flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="isPopular"
              className="w-5 h-5 rounded border-gray-300 text-[#1D1D1F] focus:ring-[#1D1D1F]"
              checked={formData.isPopular}
              onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
            />
            <label htmlFor="isPopular" className={LabelClass}>Mettre en avant (Populaire)</label>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-black/5">
        <label className={LabelClass}>Arrêts desservis sur ce trajet</label>
        <div className="grid grid-cols-2 gap-3 p-4 bg-black/5 rounded-xl">
          {stops.map((stop) => (
            <div
              key={stop.id}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => toggleStop(stop.id)}
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  formData.stopsIds.includes(stop.id) ? "bg-[#1D1D1F] border-[#1D1D1F]" : "border-gray-400 bg-white"
                }`}
              >
                {formData.stopsIds.includes(stop.id) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-[14px] font-medium text-[#1D1D1F] select-none">
                {stop.name} <span className="text-[11px] text-[#86868B]">({stop.city_name})</span>
              </span>
            </div>
          ))}
          {stops.length === 0 && (
            <div className="col-span-2 text-[13px] text-[#86868B]">Aucun arrêt disponible</div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-black/5">
        <label className={LabelClass}>Équipements à bord</label>
        <div className="grid grid-cols-2 gap-3 p-4 bg-black/5 rounded-xl">
          {AMENITIES_OPTIONS.map((option) => (
            <div
              key={option.id}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => toggleAmenity(option.id)}
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  formData.amenities.includes(option.id) ? "bg-[#1D1D1F] border-[#1D1D1F]" : "border-gray-400 bg-white"
                }`}
              >
                {formData.amenities.includes(option.id) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-[14px] font-medium text-[#1D1D1F] select-none">{option.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-6 sticky bottom-0 bg-white/90 backdrop-blur-sm pb-4">
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
          {initialData ? "Mettre à jour" : "Enregistrer le Voyage"}
        </button>
      </div>
    </form>
  );
}
