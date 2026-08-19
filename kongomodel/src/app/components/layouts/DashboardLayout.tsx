import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
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
  ClipboardList,
  BarChart3,
  MapPin,
  TriangleAlert,
  Wallet,
  Zap,
  ChevronLeft,
  Briefcase,
  QrCode,
  Scan,
  MessageSquare,
  Globe,
  Megaphone,
  Star
} from "@/lib/icons";
import { toast } from "sonner";
import { useAppState } from "../../../hooks/useAppState";
import { supabase } from "../../../lib/supabase";
import { NAVIGATION_PAGES } from "../../../lib/constants";

interface SidebarItemProps {
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed?: boolean;
  badge?: number;
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick, collapsed, badge }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative mb-0.5
      ${isActive 
        ? "!bg-[#1D1D1F] !text-white shadow-sm"
        : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
      }`}
  >
    <div className="shrink-0 relative">
      <Icon 
        className={`w-4 h-4 transition-transform duration-200 ${isActive ? "!text-white" : "text-[#86868B] group-hover:text-[#1D1D1F] group-hover:scale-110"}`} 
        strokeWidth={isActive ? 2.5 : 2}
      />
      {/* Badge non-lus sur l'icône */}
      {badge && badge > 0 && !isActive && (
        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-[#FF3B30] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 border border-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
    {!collapsed && (
      <div className="flex-1 flex items-center justify-between">
        <span className={`text-[14px] font-medium tracking-tight ${isActive ? "!text-white" : ""}`}>
          {label}
        </span>
        {/* Badge texte quand sidebar déployée */}
        {badge && badge > 0 && !isActive && (
          <span className="min-w-[18px] h-[18px] bg-[#FF3B30]/15 text-[#FF3B30] text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
    )}
  </button>
);

export function DashboardLayout() {
  const { userRole, agencyId, setUserRole, setAgencyId, setIsAuthenticated } = useAppState();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string; avatar_url: string | null; role: string } | null>(null);
  // Badge non-lus pour le chat
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        navigate("/login");
        return;
      }
      setIsAuthenticated(true);
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role, agency_id')
        .eq('id', user.id)
        .single();
      
      if (data) {
        console.log('Auth check - Profile data:', data);
        setUserProfile(data as any);
        setUserRole(data.role || 'guest');
        if (data.agency_id) {
          setAgencyId(data.agency_id);
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  // ── Badge non-lus chat (realtime) ──────────────────────────────────────────
  useEffect(() => {
    if (!userRole || userRole === 'guest') return;
    
    const loadChatUnread = async () => {
      if (userRole === 'superuser') {
        // Superuser : compter tous les messages agency non-lus
        const { count } = await supabase
          .from('admin_chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_role', 'agency')
          .eq('is_read', false);
        setChatUnreadCount(count || 0);
      } else if (['agency', 'chef', 'cashier'].includes(userRole) && agencyId) {
        // Membres d'agence : compter les messages non lus envoyés par les autres
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        let query = supabase
          .from('admin_chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .neq('sender_id', user.id)
          .eq('is_read', false);
        
        // Pour chef et cashier, ne pas compter d'éventuels messages superuser
        if (['chef', 'cashier'].includes(userRole)) {
          query = query.neq('sender_role', 'superuser');
        }

        const { count } = await query;
        setChatUnreadCount(count || 0);
      }
    };

    loadChatUnread();

    const channel = supabase
      .channel('dashboard-layout-chat-badge')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'admin_chat_messages',
      }, () => {
        // Ne pas recompter si on est déjà sur la page chat
        const isOnChatPage = ['/chat', '/agency-chat'].includes(location.pathname);
        if (!isOnChatPage) loadChatUnread();
        else setChatUnreadCount(0);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userRole, agencyId, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole('guest');
    navigate('/login');
    toast.success('Déconnexion réussie');
  };

  const menuItems = (() => {
    if (userRole === 'superuser') {
       return [
         { id: '/', label: 'Global Audit', icon: LayoutDashboard },
         { id: '/agency-management', label: 'Agences Partenaires', icon: Briefcase },
         { id: '/featured-agencies', label: 'Mise en Avant Agences ⭐', icon: Star },
         { id: '/trips', label: 'Planification', icon: Map },
         { id: '/buses', label: 'Flotte Totale', icon: Bus },
         { id: '/bookings', label: 'Réservations', icon: Ticket },
         { id: '/users', label: 'Utilisateurs', icon: Users },
         { id: '/finance', label: 'Finance Globale', icon: Wallet },
         { id: '/locations-payments', label: 'Pays & Paiements', icon: Globe },
         { id: '/notifications', label: 'Diffusion Notifications 📣', icon: Megaphone },
         { id: '/chat', label: 'Chat Agences', icon: MessageSquare, badge: chatUnreadCount },
       ];
    } else if (userRole === 'agency') {
       return [
         { id: '/', label: 'Aperçu Agence', icon: LayoutDashboard },
         { id: '/live-map', label: 'Suivi Bus (GPS)', icon: MapPin },
         { id: '/buses', label: 'Ma Flotte', icon: Bus },
         { id: '/trips', label: 'Mes Voyages', icon: Map },
         { id: '/stops-routes', label: 'Arrêts & Trajets', icon: Map },
         { id: '/agencies', label: 'Points de Vente', icon: Building2 },
         { id: '/staff', label: 'Équipe & Chauffeurs', icon: Users },
         { id: '/bookings', label: 'Tickets', icon: Ticket },
         { id: '/finance', label: 'Finance', icon: Wallet },
         { id: '/cash-management', label: 'Gestion Caisse', icon: BarChart3 },
         { id: '/notifications', label: 'Notifier Clients 📣', icon: Megaphone },
         { id: '/extra-services', label: 'Services Extras', icon: Zap },
         { id: '/incidents', label: 'Signalements', icon: TriangleAlert },
         { id: '/scanner', label: 'Scanner QR', icon: QrCode },
         { id: '/agency-chat', label: 'Chat Agence', icon: MessageSquare, badge: chatUnreadCount },
       ];
    } else if (userRole === 'chef') {
       return [
         { id: '/', label: 'Tableau de bord', icon: LayoutDashboard },
         { id: '/trips', label: 'Voyages assignés', icon: Map },
         { id: '/buses', label: 'Mes Bus', icon: Bus },
         { id: '/staff', label: 'Équipe Chauffeurs', icon: Users },
         { id: '/notifications', label: 'Notifier Clients 📣', icon: Megaphone },
         { id: '/reports', label: 'Rapports', icon: BarChart3 },
         { id: '/incidents', label: 'Signalements', icon: TriangleAlert },
         { id: '/scanner', label: 'Scanner QR', icon: QrCode },
         { id: '/agency-chat', label: 'Chat Agence', icon: MessageSquare, badge: chatUnreadCount },
       ];
    } else if (userRole === 'cashier') {
       return [
         { id: '/', label: 'Dashboard Caisse', icon: BarChart3 },
         { id: '/new-booking', label: 'Vendre un Ticket', icon: Ticket },
         { id: '/trips', label: 'Voyages', icon: Map },
         { id: '/bookings', label: 'Historique Ventes', icon: ClipboardList },
         { id: '/buses', label: 'Ma Flotte', icon: Bus },
         { id: '/extra-services', label: 'Services Extras', icon: Zap },
         { id: '/scanner', label: 'Scanner QR', icon: QrCode },
         { id: '/agency-chat', label: 'Chat Agence', icon: MessageSquare, badge: chatUnreadCount },
       ];
    }
    return [{ id: '/', label: 'Tableau de bord', icon: LayoutDashboard, badge: 0 }];
  })();

  const adminActions = [
    { label: 'Paramètres', icon: Settings, id: '/settings' },
  ];

  const isItemActive = (itemId: string) => {
    const currentFull = location.pathname + location.search;
    if (itemId.includes('?')) {
      return currentFull === itemId;
    }
    return location.pathname === itemId && (!location.search || location.search === '?tab=all');
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] text-[#1D1D1F] overflow-hidden font-sans selection:bg-[#5CB338]/30">
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
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={isItemActive(item.id)}
                onClick={() => {
                  navigate(item.id);
                  setIsMobileMenuOpen(false);
                }}
                collapsed={isSidebarCollapsed}
                badge={(item as any).badge}
              />
            ))}
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
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-0.5
                  ${location.pathname === item.id 
                    ? "!bg-black/5 !text-[#1D1D1F]" 
                    : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"}`}
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
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 mt-3 rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all group active:scale-95
               ${isSidebarCollapsed ? 'justify-center' : ''}`}
           >
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="text-[11px] font-semibold uppercase tracking-widest">Déconnexion</span>}
           </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-black/5 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] shadow-sm z-50 transition-transform active:scale-90"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
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
                <button className="w-10 h-10 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5 rounded-lg transition-all relative">
                   <Bell className="w-5 h-5" />
                   <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF3B30] rounded-full border-2 border-white"></span>
                </button>
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

         <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div className="p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full">
                <Outlet />
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
                    {menuItems.map((item) => (
                      <SidebarItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={isItemActive(item.id)}
                        onClick={() => {
                          navigate(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        collapsed={false}
                      />
                    ))}
                  </nav>

                  <div className="mb-2 mt-8 inline-block px-1">
                     <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest opacity-60">Others</span>
                  </div>
                  <nav className="space-y-0.5">
                    {adminActions.map((item) => (
                       <button
                        key={item.label}
                        onClick={() => {
                          navigate(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-0.5
                          ${location.pathname === item.id 
                            ? "bg-black/5 text-[#1D1D1F]" 
                            : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"}`}
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
                    onClick={handleLogout}
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

