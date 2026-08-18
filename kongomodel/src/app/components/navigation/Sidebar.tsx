import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  Bus,
  Route,
  MapPin,
  Map,
  Wallet,
  Banknote,
  UserCog,
  Calendar,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  Activity,
} from "../../../lib/icons";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: "/", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { path: "/agencies", label: "Agences", icon: Building2 },
  { path: "/users", label: "Passagers", icon: Users },
  { path: "/buses", label: "Bus", icon: Bus },
  { path: "/trips", label: "Voyages", icon: Route },
  { path: "/stops-routes", label: "Arrêts & Routes", icon: MapPin },
  { path: "/live-map", label: "Carte en Direct", icon: Map },
  { path: "/bookings", label: "Réservations", icon: Calendar },
  { path: "/finance", label: "Finance", icon: Wallet },
  { path: "/cash-management", label: "Gestion de Caisse", icon: Banknote },
  { path: "/staff", label: "Personnel", icon: UserCog },
  { path: "/reports", label: "Rapports", icon: FileText },
  { path: "/activity-logs", label: "Journal d'Activité", icon: Activity },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`h-full bg-white/70 backdrop-blur-xl border-r border-black/5 transition-all duration-300 ease-in-out flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1D1D1F] to-[#3A3A3C] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">K</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-[17px] text-[#1D1D1F] tracking-tight">
              KONGO
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-[#1D1D1F] text-white shadow-sm"
                  : "text-[#86868B] hover:bg-black/5 hover:text-[#1D1D1F]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    !collapsed && "group-hover:scale-110"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {!collapsed && (
                  <span className="text-[15px] font-medium tracking-tight">
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="h-14 flex items-center justify-center border-t border-black/5 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
      >
        <ChevronLeft
          className={`w-5 h-5 transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
          }`}
        />
      </button>
    </aside>
  );
}
