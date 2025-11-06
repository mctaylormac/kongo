import { motion } from "motion/react";
import { ChevronRight, Home, Search, CreditCard, CheckCircle, User, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: any;
  clickable?: boolean;
  current?: boolean;
}

interface NavigationBreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (id: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  currentPage?: string;
}

export function NavigationBreadcrumbs({ 
  items, 
  onNavigate, 
  onBack, 
  showBackButton = true,
  currentPage 
}: NavigationBreadcrumbsProps) {
  
  const getPageIcon = (pageId: string) => {
    const iconMap: Record<string, any> = {
      home: Home,
      search: Search,
      seats: User,
      payment: CreditCard,
      confirmation: CheckCircle,
      dashboard: User
    };
    return iconMap[pageId] || Home;
  };

  const getPageTitle = (pageId: string) => {
    const titleMap: Record<string, string> = {
      home: "Accueil",
      search: "Recherche",
      seats: "Sélection des sièges",
      payment: "Paiement", 
      confirmation: "Confirmation",
      dashboard: "Tableau de bord"
    };
    return titleMap[pageId] || "Page";
  };

  // Enhanced breadcrumb items with proper icons and labels
  const enhancedItems = items.map(item => ({
    ...item,
    icon: item.icon || getPageIcon(item.id),
    label: item.label || getPageTitle(item.id)
  }));

  return (
    <div className="bg-surface-secondary border-b border-border-primary sticky top-16 z-30">
      <div className="container-professional py-3">
        <div className="flex items-center space-x-2">
          {/* Back Button for Mobile */}
          {showBackButton && onBack && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mr-2 md:hidden"
            >
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="btn-ghost p-2 h-auto"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1 flex-1 min-w-0" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-1 text-body-small">
              {enhancedItems.map((item, index) => {
                const isLast = index === enhancedItems.length - 1;
                const IconComponent = item.icon;
                
                return (
                  <li key={item.id} className="flex items-center">
                    {/* Breadcrumb Item */}
                    <div className="flex items-center">
                      {item.clickable && onNavigate ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onNavigate(item.id)}
                          className={`
                            flex items-center space-x-2 px-2 py-1 rounded-md transition-colors duration-200
                            ${isLast 
                              ? 'text-kongo-black font-semibold bg-surface-kongo-lime-light' 
                              : 'text-secondary hover:text-kongo-black hover:bg-surface-hover'
                            }
                          `}
                        >
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-32 sm:max-w-none">
                            {item.label}
                          </span>
                        </motion.button>
                      ) : (
                        <div className={`
                          flex items-center space-x-2 px-2 py-1 rounded-md
                          ${isLast 
                            ? 'text-kongo-black font-semibold bg-surface-kongo-lime-light' 
                            : 'text-secondary'
                          }
                        `}>
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-32 sm:max-w-none">
                            {item.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Separator */}
                    {!isLast && (
                      <ChevronRight className="w-4 h-4 text-quaternary mx-1 flex-shrink-0" />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Progress Indicator for Mobile */}
          <div className="flex items-center space-x-2 md:hidden">
            <div className="text-caption text-tertiary">
              {enhancedItems.findIndex(item => item.current) + 1}/{enhancedItems.length}
            </div>
          </div>
        </div>

        {/* Mobile Page Title */}
        <div className="mt-2 md:hidden">
          <h1 className="text-h5 text-kongo-black font-semibold truncate">
            {enhancedItems.find(item => item.current)?.label || 
             enhancedItems[enhancedItems.length - 1]?.label}
          </h1>
        </div>
      </div>

      {/* Mobile Bottom Border Animation */}
      <motion.div
        className="h-0.5 bg-kongo-lime md:hidden"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: (enhancedItems.findIndex(item => item.current) + 1) / enhancedItems.length }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
      />
    </div>
  );
}