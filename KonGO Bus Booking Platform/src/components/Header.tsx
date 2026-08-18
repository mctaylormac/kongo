import { useState, useEffect } from "react";
import { HeaderLogo } from "./header/HeaderLogo";
import { HeaderNavigation } from "./header/HeaderNavigation";
import { HeaderActions } from "./header/HeaderActions";
import { MobileMenu } from "./header/MobileMenu";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Phone, Bell, ChevronDown } from "lucide-react";

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  notificationCount?: number;
  onToggleNotifications?: () => void;
  onLogout?: () => void;
  userRole?: string;
}

const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Accueil' },
  { id: 'search', label: 'Rechercher' },
  { id: 'agencies', label: 'Agences' },
  { id: 'dashboard', label: 'Mes Voyages' }
];

const LANGUAGES = [
  { code: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'EN', name: 'English', flag: '🇺🇸' }
];

export function Header({ 
  currentLanguage, 
  onLanguageChange, 
  currentPage, 
  onPageChange,
  notificationCount = 0,
  onToggleNotifications,
  onLogout,
  userRole = 'guest'
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when page changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPage]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogoClick = () => {
    onPageChange('home');
  };

  // Create navigation items with active state
  const navigationItems = NAVIGATION_ITEMS.map(item => ({
    ...item,
    active: currentPage === item.id || 
            (item.id === 'search' && ['search', 'seats', 'payment', 'confirmation'].includes(currentPage))
  }));

  const currentLang = LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0];

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-40 transition-all duration-300
          ${isScrolled 
            ? 'bg-surface-elevated/95 backdrop-blur-md shadow-lg border-b border-border-primary/50' 
            : 'bg-surface-primary border-b border-border-primary/30'
          }
        `}
      >
        {/* Top Tier (Utility Bar) - Desktop Only */}
        {/* [Agent Stitch] - Action: Refactored top utility bar, collapses smoothly on scroll */}
        <div 
          className={`
            hidden lg:block bg-kongo-black text-white/80 border-b border-white/10 transition-all duration-300 ease-in-out overflow-hidden
            ${isScrolled ? 'h-0 opacity-0 pointer-events-none' : 'h-8 opacity-100'}
          `}
        >
          <div className="container-professional h-full flex items-center justify-between text-xs">
            <div className="flex items-center space-x-6">
              <a 
                href="tel:+243123456789" 
                className="flex items-center gap-1.5 hover:text-white transition-colors text-white/90"
              >
                <Phone className="w-3.5 h-3.5 text-kongo-lime" />
                <span className="font-semibold">+243 123 456 789</span>
                <span className="text-white/60">(Support Client 24/7)</span>
              </a>
              <span className="h-3 w-px bg-white/20" />
              <div className="flex items-center gap-2 text-white/70">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kongo-lime opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-kongo-lime"></span>
                </span>
                <span>Réseau national : Kinshasa, Lubumbashi, Goma, Bukavu, Kisangani</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-1.5 hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/10 cursor-pointer">
                    <span className="text-base">{currentLang.flag}</span>
                    <span className="font-medium text-[11px]">{currentLang.code}</span>
                    <ChevronDown className="w-3 h-3 text-white/60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 bg-surface-elevated text-kongo-black">
                  {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => onLanguageChange(lang.code)}
                      className={`flex items-center space-x-3 cursor-pointer transition-colors ${
                        lang.code === currentLanguage ? 'bg-surface-kongo-lime-light font-semibold' : ''
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="text-xs">{lang.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="h-3 w-px bg-white/20" />

              {/* Notification Trigger */}
              {onToggleNotifications && (
                <button 
                  onClick={onToggleNotifications}
                  className="relative flex items-center justify-center p-1.5 hover:bg-white/10 rounded transition-colors text-white/90 hover:text-white cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-kongo-lime text-kongo-black rounded-full flex items-center justify-center text-[10px] font-bold">
                      {notificationCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Tier */}
        <div className="container-professional">
          <div className="flex items-center justify-between h-16 relative">
            
            <HeaderLogo onClick={handleLogoClick} />
            
            <div className="hidden lg:block flex-1 max-w-xl mx-auto px-6">
              <HeaderNavigation 
                items={navigationItems}
                onNavigate={onPageChange}
              />
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-3">
              <HeaderActions
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                onPageChange={onPageChange}
                notificationCount={notificationCount}
                onToggleNotifications={onToggleNotifications}
                onLogout={onLogout}
                userRole={userRole}
              />
              
              {/* Mobile Menu */}
              <MobileMenu
                isOpen={isMobileMenuOpen}
                onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                navigationItems={navigationItems}
                languages={LANGUAGES}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                onNavigate={onPageChange}
                onLogout={onLogout}
                userRole={userRole}
              />
            </div>

            {isScrolled && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-kongo-lime/5 to-transparent pointer-events-none" />
            )}
          </div>
        </div>
      </header>

      {/* Spacer to prevent content overlap - adapts to double-tier height */}
      <div className="h-16 lg:h-[96px] transition-all duration-300" />
    </>
  );
}
