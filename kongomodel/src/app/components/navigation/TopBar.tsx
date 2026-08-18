import { Search, Bell, Plus, ChevronDown } from "../../../lib/icons";
import { useState } from "react";

export function TopBar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header
      className="h-16 bg-white/60 backdrop-blur-xl border-b border-black/5 flex items-center justify-between px-8"
      style={{
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            placeholder="Rechercher bus, voyages, agences..."
            className="w-full h-10 pl-10 pr-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Quick Action */}
        <button className="h-10 px-4 bg-[#1D1D1F] text-white rounded-lg flex items-center gap-2 hover:bg-[#2C2C2E] transition-all shadow-sm hover:shadow">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-[15px] font-medium">Ajout Rapide</span>
        </button>

        {/* Notifications */}
        <button className="relative w-10 h-10 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all group">
          <Bell className="w-5 h-5 text-[#86868B] group-hover:text-[#1D1D1F]" strokeWidth={2} />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF3B30] text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-3 pr-2 h-10 rounded-lg hover:bg-black/5 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF3B30] to-[#FF9500] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">AD</span>
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-[13px] font-medium text-[#1D1D1F]">Administrateur</div>
              <div className="text-[11px] text-[#86868B]">Super Admin</div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#86868B]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-xl border border-black/5 shadow-lg overflow-hidden">
              <div className="p-2">
                <button className="w-full px-3 py-2 text-left text-[14px] text-[#1D1D1F] hover:bg-black/5 rounded-lg transition-all">
                  Paramètres du Profil
                </button>
                <button className="w-full px-3 py-2 text-left text-[14px] text-[#1D1D1F] hover:bg-black/5 rounded-lg transition-all">
                  Préférences
                </button>
                <div className="h-px bg-black/5 my-2" />
                <button className="w-full px-3 py-2 text-left text-[14px] text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-all">
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
