import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { KonGOLogo } from "../KonGOLogo";
import { Menu, X, Phone, MessageCircle, Home, Search, Building2, Ticket, LogIn, UserPlus, LogOut, ChevronRight } from "lucide-react";

interface NavigationItem {
  id: string;
  label: string;
  active: boolean;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  navigationItems: NavigationItem[];
  languages: Language[];
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  userRole?: string;
}

export function MobileMenu({
  isOpen,
  onToggle,
  navigationItems,
  languages,
  currentLanguage,
  onLanguageChange,
  onNavigate,
  onLogout,
  userRole = 'guest'
}: MobileMenuProps) {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onToggle();
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="lg:hidden p-2 h-9 w-9"
        aria-label="Menu de navigation"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-surface-overlay z-40 lg:hidden"
              onClick={onToggle}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-14 right-0 bottom-0 w-72 max-w-[85vw] bg-surface-elevated border-l border-border-primary shadow-2xl z-50 lg:hidden overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal de navigation"
              tabIndex={-1}
            >
              <div className="p-5 space-y-6">
                
                {/* Header */}
                <div className="text-center pb-4 border-b border-border-primary">
                  <KonGOLogo variant="full" size="md" className="mx-auto mb-2" />
                  <p className="text-caption text-secondary">Transport RDC</p>
                </div>

                {/* Navigation Principale */}
                <nav className="space-y-2">
                  <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest pl-3 mb-2">Navigation</h3>
                  {navigationItems.filter(item => !(item.id === 'dashboard' && userRole === 'guest')).map((item) => {
                    const Icon = item.id === 'home' ? Home : 
                                 item.id === 'search' ? Search : 
                                 item.id === 'agencies' ? Building2 : 
                                 item.id === 'dashboard' ? Ticket : Home;
                    
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => handleNavigate(item.id)}
                        whileHover={{ x: 4, backgroundColor: "var(--surface-hover)" }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold transition-all duration-200
                          ${item.active 
                            ? 'text-kongo-black bg-kongo-lime shadow-lg shadow-kongo-lime/20' 
                            : 'text-primary hover:bg-surface-hover border border-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center">
                          <Icon className={`w-5 h-5 mr-4 ${item.active ? 'text-kongo-black' : 'text-kongo-lime'}`} />
                          <span className="text-base">{item.label}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 opacity-50 ${item.active ? 'text-kongo-black' : ''}`} />
                      </motion.button>
                    );
                  })}
                </nav>

                {/* Language Selection */}
                <div className="space-y-3">
                  <h3 className="text-label-small text-tertiary">LANGUE</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((lang) => (
                      <motion.button
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          flex items-center space-x-2 px-3 py-2 rounded-md border transition-all text-sm
                          ${lang.code === currentLanguage 
                            ? 'bg-surface-kongo-lime-light border-kongo-lime text-kongo-black' 
                            : 'border-border-primary hover:border-kongo-lime/50 hover:bg-surface-hover'
                          }
                        `}
                      >
                        <span className="text-sm">{lang.flag}</span>
                        <span className="font-medium">{lang.code}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Authentification */}
                <div className="space-y-3">
                  <h3 className="text-label-small text-tertiary">COMPTE</h3>
                  <div className="space-y-2">
                    {userRole === 'guest' ? (
                      <>
                        <Button
                          onClick={() => handleNavigate('login')}
                          variant="ghost"
                          className="w-full justify-start h-10 text-kongo-black hover:bg-surface-hover"
                        >
                          <LogIn className="w-5 h-5 mr-3" />
                          Connexion
                        </Button>

                        <Button
                          onClick={() => handleNavigate('signup')}
                          className="w-full justify-start h-10 btn-secondary"
                        >
                          <UserPlus className="w-5 h-5 mr-3" />
                          Inscription Gratuite
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleNavigate('dashboard')}
                          variant="ghost"
                          className="w-full justify-start h-10 text-kongo-black hover:bg-surface-hover"
                        >
                          <Ticket className="w-5 h-5 mr-3" />
                          Mes Voyages
                        </Button>

                        {onLogout && (
                          <Button
                            onClick={() => {
                              onLogout();
                              onToggle();
                            }}
                            variant="ghost"
                            className="w-full justify-start h-10 text-error hover:bg-error/10"
                          >
                            <LogOut className="w-5 h-5 mr-3" />
                            Deconnexion
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="text-label-small text-tertiary">ACTIONS</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => window.open('tel:+243123456789', '_self')}
                      className="w-full justify-start h-10 text-secondary hover:text-kongo-black hover:bg-surface-hover rounded-md"
                    >
                      <Phone className="w-4 h-4 mr-3" />
                      Appeler KonGO
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      className="w-full justify-start h-10 text-secondary hover:text-kongo-black hover:bg-surface-hover rounded-md"
                    >
                      <MessageCircle className="w-4 h-4 mr-3" />
                      Chat Support
                    </Button>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center pt-4 border-t border-border-primary">
                  <Badge className="status-kongo">
                    <div className="w-2 h-2 bg-kongo-lime rounded-full mr-2" />
                    Service 24/7
                  </Badge>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

