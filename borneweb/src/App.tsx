import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Search, Clock, ArrowRight, 
  ChevronLeft, Loader2
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { KioskFlow } from './components/KioskFlow';

// navigation states
type KioskPage = 'HOME' | 'SEARCH' | 'RESULTS' | 'SEATS' | 'BAGGAGE' | 'PAYMENT' | 'SUCCESS';

export default function App() {
  const [currentPage, setCurrentPage] = useState<KioskPage>('HOME');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  
  // Real-time clock for the kiosk header
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    // Authentification anonyme pour permettre les insertions (RLS)
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
    };
    initAuth();

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderPage = () => {
    switch(currentPage) {
      case 'HOME': return <KioskHome onStart={() => setCurrentPage('SEARCH')} />;
      case 'SEARCH': return <KioskSearch onBack={() => setCurrentPage('HOME')} onResults={(originName: string, destName: string) => { 
        setSelectedOriginId(originName);
        setSelectedDestinationId(destName); 
        setCurrentPage('RESULTS'); 
      }} />;
      case 'RESULTS': return <KioskResults originName={selectedOriginId} destinationName={selectedDestinationId} onSelect={(trip: any) => { setSelectedTrip(trip); setCurrentPage('SEATS'); }} onBack={() => setCurrentPage('SEARCH')} />;
      case 'SEATS': 
      case 'BAGGAGE':
      case 'PAYMENT':
      case 'SUCCESS':
        return <KioskFlow trip={selectedTrip} onComplete={() => setCurrentPage('HOME')} />;
      default: return <div className="p-20 text-center">En développement...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      <Toaster position="top-center" richColors />
      
      {/* Kiosk Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-green-600 p-2 rounded-xl">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">KonGO <span className="text-green-600 italic">BORNE</span></h1>
            <p className="text-slate-500 font-medium text-sm uppercase tracking-widest">Gare Centrale Kinshasa</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-slate-800">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-slate-500 font-medium">
            {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="bg-slate-900 text-slate-400 px-8 py-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Terminal Connecté
          </span>
          <span>ID Borne: KIN-001</span>
        </div>
        <div className="flex gap-4">
          <span>Assistance: +243 000 000 000</span>
        </div>
      </footer>
    </div>
  );
}

// Temporary components to be moved later
function KioskHome({ onStart }: { onStart: () => void }) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      const { data } = await supabase
        .from('trips')
        .select(`
          *,
          origin:locations!origin_location_id(name),
          destination:locations!destination_location_id(name),
          agency:agencies(name)
        `)
        .in('status', ['active', 'scheduled'])
        .gte('departure_time', new Date().toISOString())
        .order('departure_time', { ascending: true })
        .limit(3);
      
      if (data) setTrips(data);
      setLoading(false);
    };
    fetchTrips();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-12 py-16">
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-black text-slate-900">Bienvenue chez KonGO</h2>
        <p className="text-2xl text-slate-500">Réservez votre voyage en moins de 2 minutes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8">
        <div className="space-y-6">
          <h3 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="text-green-600" /> Prochains Départs
          </h3>
          
          {loading ? (
             <div className="flex justify-center p-12"><Loader2 className="w-12 h-12 text-green-600 animate-spin" /></div>
          ) : trips.length > 0 ? trips.map(trip => (
            <div key={trip.id} className="kiosk-card flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-4xl font-black text-green-600">
                  {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div>
                  <div className="text-2xl font-bold">{trip.origin?.name} → {trip.destination?.name}</div>
                  <div className="text-slate-500 font-medium text-lg">{trip.agency?.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">{trip.price.toLocaleString()} FC</div>
                <div className="text-green-600 font-bold uppercase text-sm">Disponible</div>
              </div>
            </div>
          )) : (
            <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold">
              Aucun départ prévu pour le moment.
            </div>
          )}
        </div>

        <button 
          onClick={onStart}
          className="h-[400px] w-full bg-green-600 rounded-[2rem] shadow-2xl shadow-green-200 flex flex-col items-center justify-center text-white gap-6 hover:bg-green-700 transition-all active:scale-[0.97]"
        >
          <div className="bg-white/20 p-8 rounded-full">
            <Search className="w-20 h-20" />
          </div>
          <div className="text-center">
            <span className="text-5xl font-black block mb-2">COMMENCER</span>
            <span className="text-xl font-medium opacity-80 uppercase tracking-widest">Appuyez ici pour rechercher</span>
          </div>
          <ArrowRight className="w-12 h-12 mt-4 animate-bounce-x" />
        </button>
      </div>
    </div>
  );
}

function KioskSearch({ onBack, onResults }: { onBack: () => void, onResults: (originId: string, destId: string) => void }) {
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [availableOrigins, setAvailableOrigins] = useState<any[]>([]);
  const [availableDestinations, setAvailableDestinations] = useState<any[]>([]);
  const [originName, setOriginName] = useState('');
  const [destName, setDestName] = useState('');

  useEffect(() => {
    const fetchAvailableRoutes = async () => {
      // 1. Récupérer les villes enregistrées dans la table 'cities' de Supabase
      const { data: dbCities } = await supabase
        .from('cities')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      // 2. Récupérer les trajets existants
      const { data: trips } = await supabase
        .from('trips')
        .select(`
          origin:locations!origin_location_id(id, name),
          destination:locations!destination_location_id(id, name)
        `)
        .in('status', ['active', 'scheduled'])
        .gte('departure_time', new Date().toISOString());

      if (trips) {
        setAllTrips(trips);
      }

      if (dbCities && dbCities.length > 0) {
        setAvailableOrigins(dbCities);
      } else if (trips) {
        const origins = trips.reduce((acc: any[], current: any) => {
          if (!acc.find(item => item.name === current.origin.name)) {
            acc.push(current.origin);
          }
          return acc;
        }, []).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAvailableOrigins(origins);
      }
    };
    fetchAvailableRoutes();
  }, []);

  // Mettre à jour les destinations possibles quand l'origine change
  useEffect(() => {
    if (originName) {
      // Filtrer parmi les trajets s'il y en a, sinon proposer toutes les autres villes actives
      const tripDests = allTrips
        .filter(t => t.origin.name === originName)
        .reduce((acc: any[], current: any) => {
          if (!acc.find(item => item.name === current.destination.name)) {
            acc.push(current.destination);
          }
          return acc;
        }, []).sort((a: any, b: any) => a.name.localeCompare(b.name));

      if (tripDests.length > 0) {
        setAvailableDestinations(tripDests);
      } else {
        setAvailableDestinations(availableOrigins.filter(c => c.name !== originName));
      }
      setDestName(''); // Reset destination selection
    } else {
      setAvailableDestinations([]);
    }
  }, [originName, allTrips, availableOrigins]);

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-12 py-16">
       <button onClick={onBack} className="text-slate-500 flex items-center gap-2 text-xl font-bold">
         <ChevronLeft /> Retour
       </button>
       <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-900">Où voulez-vous aller ?</h2>
      </div>
      <div className="kiosk-card p-12 space-y-12">
         <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xl font-bold text-slate-500 block">DÉPART</label>
              <select 
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                className="w-full p-8 bg-white border-4 border-slate-200 rounded-3xl text-4xl font-black appearance-none outline-none focus:border-blue-500"
              >
                <option value="">Ville de départ...</option>
                {availableOrigins.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-xl font-bold text-slate-500 block">DESTINATION</label>
              <select 
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                disabled={!originName}
                className="w-full p-8 bg-white border-4 border-green-500 rounded-3xl text-4xl font-black appearance-none outline-none focus:ring-4 focus:ring-green-100 disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="">{originName ? 'Où allez-vous ?' : 'Sélectionnez d\'abord le départ'}</option>
                {availableDestinations.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
         </div>

          <button 
           disabled={!originName || !destName}
           onClick={() => onResults(originName, destName)}
           className={`w-full p-10 rounded-3xl text-4xl font-black flex items-center justify-center gap-4 transition-all ${
             originName && destName ? 'bg-green-600 text-white shadow-2xl shadow-green-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
           }`}
         >
           Rechercher des trajets <ArrowRight className="w-10 h-10" />
         </button>
      </div>
    </div>
  );
}

function KioskResults({ originName, destinationName, onSelect, onBack }: any) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      let query = supabase
        .from('trips')
        .select(`
          *,
          origin:locations!origin_location_id!inner(name),
          destination:locations!destination_location_id!inner(name),
          agency:agencies(name)
        `)
        .in('status', ['active', 'scheduled'])
        .gte('departure_time', new Date().toISOString());
      
      if (originName) {
        query = query.ilike('origin.name', `%${originName}%`);
      }
      
      if (destinationName) {
        query = query.ilike('destination.name', `%${destinationName}%`);
      }

      const { data } = await query.order('departure_time', { ascending: true });
      
      if (data) setTrips(data);
      setLoading(false);
    };
    fetchTrips();
  }, [originName, destinationName]);

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-12 py-16">
       <button onClick={onBack} className="text-slate-500 flex items-center gap-2 text-xl font-bold">
         <ChevronLeft /> Modifier la recherche
       </button>
       <div className="space-y-6">
         <h2 className="text-4xl font-black">Trajets disponibles</h2>
         
         {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="w-16 h-16 text-green-600 animate-spin" /></div>
         ) : trips.length > 0 ? trips.map(trip => (
           <div key={trip.id} onClick={() => onSelect(trip)} className="kiosk-card p-10 cursor-pointer hover:bg-slate-50 border-4 border-transparent hover:border-green-500">
             <div className="flex justify-between items-center mb-6">
                <div className="flex gap-6 items-center">
                   <div className="bg-green-100 p-6 rounded-3xl">
                     <Clock className="w-12 h-12 text-green-600" />
                   </div>
                   <div>
                     <div className="text-5xl font-black">
                       {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </div>
                     <div className="text-2xl text-slate-500 font-bold">
                       {new Date(trip.departure_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}
                     </div>
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-5xl font-black text-green-600">{trip.price.toLocaleString()} FC</div>
                   <div className="text-xl text-slate-400 font-bold">{trip.agency?.name}</div>
                </div>
             </div>
             <div className="flex items-center gap-4 text-2xl font-bold text-slate-600 pt-6 border-t border-slate-100">
                <Bus className="w-8 h-8 text-green-600" /> 
                {trip.origin?.name} → {trip.destination?.name}
             </div>
           </div>
         )) : (
           <div className="p-20 bg-white rounded-3xl border-4 border-dashed border-slate-200 text-center space-y-6">
              <Search className="w-20 h-20 text-slate-200 mx-auto" />
              <p className="text-3xl text-slate-400 font-black uppercase">Aucun trajet trouvé</p>
           </div>
         )}
       </div>
    </div>
  );
}
