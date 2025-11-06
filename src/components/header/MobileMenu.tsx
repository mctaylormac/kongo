import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { KonGOLogo } from "../KonGOLogo";
import { Menu, X, Phone, MessageCircle } from "lucide-react";

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
  onDemoTrigger: () => void;
}

export function MobileMenu({
  isOpen,
  onToggle,
  navigationItems,
  languages,
  currentLanguage,
  onLanguageChange,
  onNavigate,
  onDemoTrigger
}: MobileMenuProps) {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    onToggle();
  };

  const handleDemo = () => {
    onDemoTrigger();
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
            >
              <div className="p-5 space-y-6">
                
                {/* Header */}
                <div className="text-center pb-4 border-b border-border-primary">
                  <KonGOLogo variant="full" size="md" className="mx-auto mb-2" />
                  <p className="text-caption text-secondary">Transport RDC</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  <h3 className="text-label-small text-tertiary mb-3">NAVIGATION</h3>
                  {navigationItems.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-md font-medium transition-all duration-200
                        ${item.active 
                          ? 'text-kongo-black bg-surface-kongo-lime-light border border-kongo-lime/20' 
                          : 'text-secondary hover:text-kongo-black hover:bg-surface-hover'
                        }
                      `}
                    >
                      {item.label}
                    </motion.button>
                  ))}
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
                    <Button
                      onClick={() => handleNavigate('login')}
                      variant="ghost"
                      className="w-full justify-start h-10 text-kongo-black hover:bg-surface-hover"
                    >
                      <motion.div className="w-5 h-5 mr-3 flex items-center justify-center">
                        👤
                      </motion.div>
                      Connexion
                    </Button>

                    <Button
                      onClick={() => handleNavigate('signup')}
                      className="w-full justify-start h-10 btn-secondary"
                    >
                      <motion.div className="w-5 h-5 mr-3 flex items-center justify-center">
                        ✨
                      </motion.div>
                      Inscription Gratuite
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="text-label-small text-tertiary">ACTIONS</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={handleDemo}
                      variant="ghost"
                      className="w-full justify-start h-10 bg-surface-kongo-lime-light hover:bg-surface-kongo-lime-medium text-kongo-lime-dark"
                    >
                      🚌 Voir Démo Sièges
                    </Button>

                    <Button
                      onClick={() => window.open('tel:+243123456789', '_self')}
                      className="w-full justify-start h-10 btn-primary"
                    >
                      <Phone className="w-4 h-4 mr-3" />
                      Appeler KonGO
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full justify-start h-10 border-kongo-lime text-kongo-lime-dark hover:bg-kongo-lime hover:text-on-lime"
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