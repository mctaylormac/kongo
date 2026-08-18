import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, 
  Map, 
  Ticket, 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search,
  Building2,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  HelpCircle,
  ClipboardList,
  BarChart3,
  MapPin,
  TriangleAlert,
  Wallet,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { NAVIGATION_PAGES } from '../app/AppConstants';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface SidebarItemProps {
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick, collapsed }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative mb-0.5
      ${isActive 
        ? "!bg-[#1D1D1F] !text-white shadow-sm"
        : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
      }`}
  >
    <div className="shrink-0">
      <Icon 
        className={`w-4 h-4 transition-transform duration-200 ${isActive ? "!text-white" : "text-[#86868B] group-hover:text-[#1D1D1F] group-hover:scale-110"}`} 
        strokeWidth={isActive ? 2.5 : 2}
      />
    </div>
    {!collapsed && (
      <span className={`text-[14px] font-medium tracking-tight ${isActive ? "!text-white" : ""}`}>
        {label}
      </span>
    )}
  </button>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  userRole: string;
}

export function DashboardLayout({ 
  children, 
  currentPage, 
  onPageChange, 
  onLogout,
  userRole 
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(() => typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '');
  const [userProfile, setUserProfile] = useState<{ full_name: string; avatar_url: string | null; role: string } | null>(null);

  React.useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, role')
          .eq('id', user.id)
          .single();
        if (data) {
          setUserProfile(data as any);
        }
      }
    }
    fetchProfile();
  }, []);

  React.useEffect(() => {
    const handleHash = () => setCurrentHash(window.location.hash.replace('#', ''));
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavClick = (item: any) => {
    if (item.isHash) {
      window.location.hash = item.id;
      if (currentPage !== NAVIGATION_PAGES.ADMIN_DASHBOARD) {
        onPageChange(NAVIGATION_PAGES.ADMIN_DASHBOARD);
      }
    } else {
      // Clear hash when navigating to a non-hash page (like Dashboard)
      if (window.location.hash) {
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
        // Force a hashchange event since pushState doesn't trigger it
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
      onPageChange(item.id);
    }
    setIsMobileMenuOpen(false);
  };

  const getMenuItems = () => {
    if (userRole === 'superuser') {
      return [
        { id: NAVIGATION_PAGES.ADMIN_DASHBOARD, label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'agencies', label: 'Agences', icon: Building2, isHash: true },
        { id: 'buses', label: 'Bus Total', icon: Bus, isHash: true },
        { id: 'trips', label: 'Voyages', icon: Map, isHash: true },
        { id: 'bookings', label: 'Réservations', icon: Ticket, isHash: true },
        { id: 'clients', label: 'Clients', icon: Users, isHash: true },
        { id: 'drivers', label: 'Chauffeurs', icon: UserIcon, isHash: true } 
      ];
    } else if (userRole === 'agency') {
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, isHash: true },
        { id: 'map', label: 'Carte Live GPS', icon: MapPin, isHash: true },
        { id: 'buses', label: 'Bus', icon: Bus, isHash: true },
        { id: 'trips', label: 'Voyages', icon: Map, isHash: true },
        { id: 'stops', label: 'Arrêts', icon: Map, isHash: true },
        { id: 'sites', label: 'Sites', icon: Building2, isHash: true },
        { id: 'personnel', label: 'Équipe', icon: Users, isHash: true },
        { id: 'bookings', label: 'Bookings', icon: Ticket, isHash: true },
        { id: 'pricing', label: 'Revenus (CDF)', icon: Ticket, isHash: true },
        { id: 'services', label: 'Services & Bagages', icon: Wallet, isHash: true },
        { id: 'reports', label: 'Signalements', icon: TriangleAlert, isHash: true }
      ];
    } else if (userRole === 'chef') {
      return [
        { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard, isHash: true },
        { id: 'trips', label: 'Voyages', icon: Map, isHash: true },
        { id: 'buses', label: 'Bus', icon: Bus, isHash: true }
      ];
    } else if (userRole === 'cashier') {
      return [
        { id: 'overview', label: 'Tableau de bord', icon: BarChart3, isHash: true },
        { id: 'new', label: 'Enregistrer', icon: Ticket, isHash: true },
        { id: 'history', label: 'Historique', icon: ClipboardList, isHash: true }
      ];
    }
    
    return [
      { id: NAVIGATION_PAGES.ADMIN_DASHBOARD, label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'buses', label: 'Bus', icon: Bus, isHash: true },
      { id: 'trips', label: 'Voyages', icon: Map, isHash: true }
    ];
  };

  const menuItems = getMenuItems();

  const adminActions = [
    { label: 'Paramètres', icon: Settings },
    { label: 'Support', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-[#F5F5F7] text-[#1D1D1F] overflow-hidden font-sans selection:bg-kongo-lime/30">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col border-r border-black/5 bg-white/70 backdrop-blur-xl transition-all duration-300 relative z-50
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        style={{
          boxShadow: "0 0 0 0.5px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div className="h-16 flex items-center px-6 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center shadow-lg border border-white/10 shrink-0">
              <span className="text-white font-bold text-sm leading-none">K</span>
            </div>
            {!isSidebarCollapsed && (
              <span className="font-semibold text-[17px] text-[#1D1D1F] tracking-tight uppercase">
                KONGO
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 px-3 mt-2 overflow-y-auto no-scrollbar">
          {!isSidebarCollapsed && (
             <div className="px-3 mb-2 mt-4 inline-block">
                <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest opacity-60">Main Menu</span>
             </div>
          )}
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = item.isHash ? currentHash === item.id : currentPage === item.id;
              return (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  onClick={() => handleNavClick(item)}
                  collapsed={isSidebarCollapsed}
                />
              );
            })}
          </div>
          
          {!isSidebarCollapsed && (
             <div className="px-3 mb-2 mt-8 inline-block">
                <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest opacity-60">Others</span>
             </div>
          )}

          <div className="space-y-0.5">
            {adminActions.map((item) => (
               <button
                key={item.label}
                onClick={() => toast.info('Bientôt disponible')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F] transition-all group mb-0.5"
              >
                <div className="shrink-0">
                  <item.icon className="w-4 h-4 group-hover:text-[#1D1D1F]" />
                </div>
                {!isSidebarCollapsed && <span className="text-[14px] font-medium tracking-tight">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-black/5">
           <div className={`flex items-center gap-3 p-3 rounded-xl border border-black/5 bg-black/5 transition-all
              ${isSidebarCollapsed ? 'justify-center p-2' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D1D1F] to-[#3A3A3C] overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">
                 {userProfile?.avatar_url ? (
                     <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                     <span className="text-white font-semibold text-[10px]">
                        {(userProfile?.full_name || 'AD').split(' ').map(n => n[0]).join('')}
                     </span>
                 )}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                   <p className="text-[13px] font-medium text-[#1D1D1F] truncate tracking-tight">{userProfile?.full_name || 'Administrateur'}</p>
                   <p className="text-[11px] text-[#86868B] lowercase tracking-wide leading-none mt-0.5">{userRole}</p>
                </div>
              )}
           </div>
           <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 mt-3 rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all group active:scale-95
               ${isSidebarCollapsed ? 'justify-center' : ''}`}
           >
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="text-[11px] font-semibold uppercase tracking-widest">Déconnexion</span>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#F5F5F7]">
         {/* Top Header */}
         <header 
          className="h-16 border-b border-black/5 bg-white/60 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8"
          style={{
            boxShadow: "0 0 0 0.5px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)",
          }}
         >
             <div className="flex items-center gap-6">
                <button 
                 onClick={() => setIsMobileMenuOpen(true)}
                 className="lg:hidden w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-lg transition-colors text-[#86868B]"
                >
                   <Menu className="w-6 h-6" />
                </button>
                
                {/* Branding / Slogan on the Left */}
                <div className="hidden sm:flex flex-col">
                   <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-4 h-4 bg-emerald-50 rounded flex items-center justify-center border border-emerald-100">
                         <Zap className="w-2.5 h-2.5 text-emerald-600" />
                      </div>
                      <span className="text-[9px] text-[#1D1D1F] font-black uppercase tracking-[0.15em]">
                         Partenaire {userRole === 'agency' ? 'Agence' : (userRole || 'Actif')}
                      </span>
                   </div>
                   <p className="text-[10px] text-[#86868B] font-medium italic opacity-80 leading-none">
                      Pilotage de la flotte et des opérations logistiques
                   </p>
                </div>

                <div className="hidden md:flex items-center bg-black/5 border-0 rounded-lg px-4 py-2 w-[320px] group focus-within:ring-2 focus-within:ring-[#1D1D1F]/10 focus-within:bg-white transition-all ml-2">
                   <Search className="w-4 h-4 text-[#86868B] mr-3 group-focus-within:text-[#1D1D1F]" />
                   <input 
                     type="text" 
                     placeholder="Rechercher..." 
                     className="bg-transparent border-none outline-none text-[15px] w-full placeholder:text-[#86868B] text-[#1D1D1F]"
                   />
                </div>
             </div>

             <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 group cursor-pointer transition-all">
                    <div className="hidden sm:block text-right">
                       <p className="text-[13px] font-medium text-[#1D1D1F] leading-none mb-1">
                          {userProfile?.full_name || 'Administrateur'}
                       </p>
                       <span className="text-[11px] text-[#86868B] font-semibold uppercase tracking-widest leading-none block">
                           {userRole || 'Actif'}
                       </span>
                    </div>
                   <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1D1D1F] to-[#3A3A3C] overflow-hidden flex items-center justify-center shadow-md relative transition-transform group-hover:scale-105">
                       {userProfile?.avatar_url ? (
                           <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                           <span className="text-white font-semibold text-sm">
                              {(userProfile?.full_name || 'AD').split(' ').map(n => n[0]).join('')}
                           </span>
                       )}
                   </div>
                </div>
             </div>
          </header>

         {/* Content Scroll Area */}
         <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div className="p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full">
                {children}
             </div>
         </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white/90 backdrop-blur-xl z-[70] lg:hidden p-6 flex flex-col border-r border-black/5"
            >
               <div className="w-full flex items-center gap-3 p-3 rounded-2xl bg-black/5 border border-black/5 group cursor-pointer active:scale-[0.98] transition-all mb-8">
                  <div className="w-10 h-10 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white text-[15px] font-semibold border-2 border-white/20 shadow-sm shrink-0">
                    {userRole?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[14px] font-semibold text-[#1D1D1F] truncate leading-tight capitalize">{userRole}</p>
                    <p className="text-[11px] font-medium text-[#86868B] truncate mt-0.5">Administrateur</p>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-lg text-[#86868B]"
                  >
                     <X className="w-6 h-6" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto no-scrollbar -mx-2 px-2">
                  <div className="mb-2 mt-4 inline-block px-1">
                     <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest opacity-60">Main Menu</span>
                  </div>
                  <nav className="space-y-0.5">
                    {menuItems.map((item) => {
                      const isActive = item.isHash ? currentHash === item.id : currentPage === item.id;
                      return (
                        <SidebarItem
                          key={item.id}
                          icon={item.icon}
                          label={item.label}
                          isActive={isActive}
                          onClick={() => handleNavClick(item)}
                          collapsed={false}
                        />
                      );
                    })}
                  </nav>

                  <div className="mb-2 mt-8 inline-block px-1">
                     <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest opacity-60">Others</span>
                  </div>
                  <nav className="space-y-0.5">
                    {adminActions.map((item) => (
                       <button
                        key={item.label}
                        onClick={() => toast.info('Bientôt disponible')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F] transition-all group mb-0.5"
                      >
                        <div className="shrink-0">
                          <item.icon className="w-4 h-4 group-hover:text-[#1D1D1F]" />
                        </div>
                        <span className="text-[14px] font-medium tracking-tight">{item.label}</span>
                      </button>
                    ))}
                  </nav>
               </div>

               <div className="mt-6 flex-shrink-0 pt-6 border-t border-black/5">
                  <button 
                    onClick={onLogout}
                    className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-black/5 border border-black/5 text-[#FF3B30] font-semibold text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

