import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Globe,
  Phone,
  User,
  ChevronDown,
  History,
  Heart,
  Bell,
  Settings,
  LogIn,
  UserPlus,
  Search,
  MessageCircle,
  HelpCircle
} from "lucide-react";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface HeaderActionsProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  onPageChange: (page: string) => void;
  onDemoTrigger: () => void;
  notificationCount?: number;
  onToggleNotifications?: () => void;
}

const languages: Language[] = [
  { code: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'EN', name: 'English', flag: '🇺🇸' }
];

// Animation variants pour les actions
const actionItemVariants = {
  hidden: {
    x: 20,
    opacity: 0,
    scale: 0.9
  },
  visible: (index: number) => ({
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 20,
      delay: index * 0.08,
      duration: 0.5
    }
  })
};

const buttonHoverVariants = {
  initial: { scale: 1, y: 0 },
  hover: { 
    scale: 1.05,
    y: -1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: { scale: 0.95 }
};

const demoButtonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05,
    boxShadow: "0 4px 20px rgba(191, 235, 48, 0.3)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: { scale: 0.95 }
};

const pulseVariants = {
  initial: { scale: 1, opacity: 0.7 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 0.3, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function HeaderActions({ 
  currentLanguage, 
  onLanguageChange, 
  onPageChange,
  onDemoTrigger,
  notificationCount = 0,
  onToggleNotifications
}: HeaderActionsProps) {
  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className="flex items-center space-x-3">
      {/* Language Selector */}
      <motion.div
        variants={actionItemVariants}
        custom={0}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              variants={buttonHoverVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="hidden sm:flex items-center space-x-2 px-3 py-2 h-9 hover:bg-surface-hover rounded-md"
              >
                <span className="text-base">{currentLang.flag}</span>
                <span className="text-body-small font-medium">{currentLang.code}</span>
                <motion.div
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3" />
                </motion.div>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`flex items-center space-x-3 cursor-pointer transition-colors ${
                  lang.code === currentLanguage ? 'bg-surface-kongo-lime-light' : ''
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <div>
                  <div className="text-body-small font-medium">{lang.name}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Quick Search Button - Desktop */}
      <div className="hidden md:block">
        <motion.div
          variants={actionItemVariants}
          custom={0}
        >
          <motion.div
            variants={buttonHoverVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange('search')}
              className="h-9 px-3 text-secondary hover:text-kongo-black hover:bg-surface-hover rounded-md"
            >
              <Search className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Rechercher</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Notifications Button */}
      {onToggleNotifications && (
        <motion.div
          variants={actionItemVariants}
          custom={1}
        >
          <motion.div
            variants={buttonHoverVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="relative"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleNotifications}
              className="h-9 w-9 p-0 text-secondary hover:text-kongo-black hover:bg-surface-hover rounded-md"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-kongo-lime text-on-lime rounded-full flex items-center justify-center text-xs font-bold"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.div>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Quick Actions - Desktop */}
      <div className="hidden lg:flex items-center space-x-2">
        <motion.div
          variants={actionItemVariants}
          custom={2}
        >
          <motion.div
            variants={demoButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="relative"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onDemoTrigger}
              className="h-9 px-3 text-kongo-lime hover:bg-surface-kongo-lime-light hover:text-kongo-lime-dark rounded-md font-medium"
            >
              <motion.span
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                🚌
              </motion.span>
              <span className="ml-1">Démo</span>
            </Button>
            
            {/* Subtle pulse effect */}
            <motion.div
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              className="absolute inset-0 rounded-md bg-kongo-lime pointer-events-none -z-10"
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={actionItemVariants}
          custom={3}
        >
          <motion.div
            variants={buttonHoverVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('tel:+243123456789', '_self')}
              className="h-9 px-3 text-secondary hover:text-kongo-black hover:bg-surface-hover rounded-md"
              title="Appel d'urgence"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
              >
                <Phone className="w-4 h-4" />
              </motion.div>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* User Menu */}
      <motion.div
        variants={actionItemVariants}
        custom={4}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              variants={buttonHoverVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2 px-2 py-2 h-9 hover:bg-surface-hover rounded-md"
              >
                <motion.div 
                  className="w-7 h-7 bg-kongo-black rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <User className="w-3 h-3 text-on-black" />
                </motion.div>
                <motion.div
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3 text-secondary hidden sm:block" />
                </motion.div>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2 border-b border-border-primary">
              <div className="font-medium text-body-small text-kongo-black">
                Compte KonGO
              </div>
              <div className="text-caption text-tertiary">
                Gérez votre profil et préférences
              </div>
            </div>
            
            {/* Section Authentification */}
            <DropdownMenuItem 
              onClick={() => onPageChange('login')}
              className="flex items-center px-4 py-3 cursor-pointer hover:bg-surface-kongo-lime-light"
            >
              <LogIn className="w-4 h-4 mr-3 text-kongo-black" />
              <div className="flex flex-col">
                <span className="text-body-small font-medium text-kongo-black">Connexion</span>
                <span className="text-caption text-tertiary">Accédez à votre compte</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => onPageChange('signup')}
              className="flex items-center px-4 py-3 cursor-pointer hover:bg-surface-kongo-lime-light"
            >
              <UserPlus className="w-4 h-4 mr-3 text-kongo-lime-dark" />
              <div className="flex flex-col">
                <span className="text-body-small font-medium text-kongo-lime-dark">Inscription</span>
                <span className="text-caption text-tertiary">Créez votre compte gratuit</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Section Navigation */}
            <DropdownMenuItem onClick={() => onPageChange('dashboard')}>
              <History className="w-4 h-4 mr-3" />
              <span>Mes Réservations</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Heart className="w-4 h-4 mr-3" />
              <span>Routes Favorites</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-3" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Section Support */}
            <DropdownMenuItem>
              <HelpCircle className="w-4 h-4 mr-3" />
              <span>Centre d'Aide</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => window.open('tel:+243123456789', '_self')}>
              <Phone className="w-4 h-4 mr-3" />
              <span>Support 24/7</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </div>
  );
}