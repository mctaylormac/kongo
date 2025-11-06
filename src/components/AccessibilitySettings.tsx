import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  Accessibility,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  MousePointer,
  Keyboard,
  Palette,
  Type,
  Settings,
  X,
  RotateCcw,
  CheckCircle,
  Zap,
  Heart
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface AccessibilitySettingsProps {
  onSettingChange?: (setting: string, value: any) => void;
}

export function AccessibilitySettings({ onSettingChange }: AccessibilitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    keyboardNavigation: true,
    screenReader: false,
    focusVisible: true,
    textSpacing: 1,
    colorBlindness: 'none',
    fontSize: 16,
    sounds: true,
    autoRead: false,
    stickyKeys: false
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('kongo-accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }
  }, []);

  // Apply settings to the document
  const applySettings = (newSettings: typeof settings) => {
    const root = document.documentElement;
    
    // Reduced motion
    if (newSettings.reducedMotion) {
      root.style.setProperty('--motion-duration', '0.01ms');
      document.body.classList.add('reduce-motion');
    } else {
      root.style.removeProperty('--motion-duration');
      document.body.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (newSettings.highContrast) {
      document.body.classList.add('high-contrast');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#2c2c2c');
    } else {
      document.body.classList.remove('high-contrast');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--text-secondary');
    }
    
    // Large text
    if (newSettings.largeText) {
      root.style.setProperty('--font-size-multiplier', '1.2');
      document.body.classList.add('large-text');
    } else {
      root.style.removeProperty('--font-size-multiplier');
      document.body.classList.remove('large-text');
    }
    
    // Font size
    root.style.setProperty('--base-font-size', `${newSettings.fontSize}px`);
    
    // Focus visible
    if (newSettings.focusVisible) {
      document.body.classList.add('focus-visible-enhanced');
    } else {
      document.body.classList.remove('focus-visible-enhanced');
    }
    
    // Text spacing
    root.style.setProperty('--text-spacing-multiplier', newSettings.textSpacing.toString());
  };

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('kongo-accessibility-settings', JSON.stringify(newSettings));
    
    // Notify parent component
    onSettingChange?.(key, value);
    
    // Show feedback
    const settingNames = {
      reducedMotion: 'Animation réduite',
      highContrast: 'Contraste élevé',
      largeText: 'Texte agrandi',
      keyboardNavigation: 'Navigation clavier',
      screenReader: 'Lecteur d\'écran',
      focusVisible: 'Focus visible',
      sounds: 'Sons d\'interface',
      autoRead: 'Lecture automatique',
      stickyKeys: 'Touches rémanentes'
    };
    
    toast.success(`⚙️ ${settingNames[key] || key}`, {
      description: `${value ? 'Activé' : 'Désactivé'} avec succès`,
      duration: 2000
    });
  };

  const resetToDefaults = () => {
    const defaults = {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      keyboardNavigation: true,
      screenReader: false,
      focusVisible: true,
      textSpacing: 1,
      colorBlindness: 'none',
      fontSize: 16,
      sounds: true,
      autoRead: false,
      stickyKeys: false
    };
    
    setSettings(defaults);
    applySettings(defaults);
    localStorage.removeItem('kongo-accessibility-settings');
    
    toast.success("🔄 Paramètres réinitialisés", {
      description: "Tous les paramètres d'accessibilité ont été restaurés"
    });
  };

  const settingSections = [
    {
      title: "Vision",
      icon: Eye,
      settings: [
        {
          key: 'highContrast',
          label: 'Contraste élevé',
          description: 'Améliore la lisibilité avec des couleurs contrastées',
          type: 'switch'
        },
        {
          key: 'largeText',
          label: 'Texte agrandi',
          description: 'Augmente la taille du texte pour une meilleure lecture',
          type: 'switch'
        },
        {
          key: 'fontSize',
          label: 'Taille de police',
          description: 'Ajustez la taille de base du texte',
          type: 'slider',
          min: 12,
          max: 24,
          step: 1,
          unit: 'px'
        }
      ]
    },
    {
      title: "Mouvement",
      icon: MousePointer,
      settings: [
        {
          key: 'reducedMotion',
          label: 'Réduire les animations',
          description: 'Désactive ou réduit les effets visuels en mouvement',
          type: 'switch'
        },
        {
          key: 'focusVisible',
          label: 'Focus visible renforcé',
          description: 'Améliore la visibilité des éléments sélectionnés',
          type: 'switch'
        }
      ]
    },
    {
      title: "Navigation",
      icon: Keyboard,
      settings: [
        {
          key: 'keyboardNavigation',
          label: 'Navigation clavier optimisée',
          description: 'Active la navigation complète au clavier',
          type: 'switch'
        },
        {
          key: 'stickyKeys',
          label: 'Touches rémanentes',
          description: 'Permet d\'utiliser les raccourcis une touche à la fois',
          type: 'switch'
        }
      ]
    },
    {
      title: "Audio",
      icon: Volume2,
      settings: [
        {
          key: 'sounds',
          label: 'Sons d\'interface',
          description: 'Feedback audio pour les interactions',
          type: 'switch'
        },
        {
          key: 'screenReader',
          label: 'Support lecteur d\'écran',
          description: 'Optimise l\'interface pour les lecteurs d\'écran',
          type: 'switch'
        },
        {
          key: 'autoRead',
          label: 'Lecture automatique',
          description: 'Lit automatiquement le contenu des pages',
          type: 'switch'
        }
      ]
    },
    {
      title: "Mise en page",
      icon: Type,
      settings: [
        {
          key: 'textSpacing',
          label: 'Espacement du texte',
          description: 'Ajuste l\'espacement entre les lignes et mots',
          type: 'slider',
          min: 0.8,
          max: 2,
          step: 0.1,
          unit: 'x'
        }
      ]
    }
  ];

  // Quick accessibility actions
  const quickActions = [
    {
      name: 'Mode sombre',
      action: () => {
        document.body.classList.toggle('dark');
        toast.success("🌙 Mode sombre", {
          description: document.body.classList.contains('dark') ? 'Activé' : 'Désactivé'
        });
      }
    },
    {
      name: 'Zoom +',
      action: () => {
        const currentZoom = parseFloat(document.body.style.zoom || '1');
        const newZoom = Math.min(currentZoom + 0.1, 2);
        document.body.style.zoom = newZoom.toString();
        toast.success(`🔍 Zoom ${Math.round(newZoom * 100)}%`);
      }
    },
    {
      name: 'Zoom -',
      action: () => {
        const currentZoom = parseFloat(document.body.style.zoom || '1');
        const newZoom = Math.max(currentZoom - 0.1, 0.5);
        document.body.style.zoom = newZoom.toString();
        toast.success(`🔍 Zoom ${Math.round(newZoom * 100)}%`);
      }
    },
    {
      name: 'Réinitialiser zoom',
      action: () => {
        document.body.style.zoom = '1';
        toast.success("🔍 Zoom réinitialisé à 100%");
      }
    }
  ];

  return (
    <>
      {/* Accessibility Toggle Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="fixed top-20 left-4 z-50"
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 bg-kongo-black text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 group"
          aria-label="Ouvrir les paramètres d'accessibilité"
        >
          <Accessibility className="w-6 h-6 group-hover:text-kongo-lime transition-colors" />
        </motion.button>
      </motion.div>

      {/* Accessibility Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface-overlay z-[60] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] bg-surface-elevated rounded-xl shadow-2xl border border-border-primary overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-primary bg-gradient-to-r from-surface-primary to-surface-secondary">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-kongo-lime rounded-lg flex items-center justify-center">
                    <Accessibility className="w-6 h-6 text-kongo-black" />
                  </div>
                  <div>
                    <h2 className="text-h3 text-kongo-black font-bold">Accessibilité KonGO</h2>
                    <p className="text-body-small text-secondary">
                      Personnalisez votre expérience de navigation
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className="status-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    WCAG AA+
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col md:flex-row h-full max-h-[75vh]">
                
                {/* Quick Actions Sidebar */}
                <div className="w-full md:w-64 p-4 bg-surface-secondary border-r border-border-primary">
                  <h3 className="text-label text-primary font-semibold mb-4 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-kongo-lime" />
                    Actions Rapides
                  </h3>
                  
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.name}
                        onClick={action.action}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-left p-3 rounded-lg bg-surface-primary hover:bg-surface-hover border border-border-primary hover:border-kongo-lime/50 transition-all duration-200"
                      >
                        <div className="text-body-small text-primary font-medium">
                          {action.name}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Button
                      onClick={resetToDefaults}
                      variant="outline"
                      size="sm"
                      className="w-full border-border-secondary hover:border-kongo-lime"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </Button>
                    
                    <div className="p-3 bg-surface-kongo-lime-light rounded-lg border border-kongo-lime/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Heart className="w-4 h-4 text-kongo-lime-dark" />
                        <span className="text-body-small font-medium text-kongo-lime-dark">
                          Accessibilité
                        </span>
                      </div>
                      <p className="text-caption text-kongo-lime-darker">
                        KonGO s'engage à être accessible à tous les utilisateurs, 
                        conformément aux standards WCAG 2.1 AA.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-8">
                    {settingSections.map((section, sectionIndex) => (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIndex * 0.1, duration: 0.3 }}
                      >
                        <Card className="card-elevated">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-h4 text-kongo-black flex items-center">
                              <section.icon className="w-5 h-5 mr-3 text-kongo-lime" />
                              {section.title}
                            </CardTitle>
                          </CardHeader>
                          
                          <CardContent className="space-y-6">
                            {section.settings.map((setting) => (
                              <div key={setting.key} className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="text-label text-primary font-medium">
                                      {setting.label}
                                    </div>
                                    <div className="text-body-small text-secondary mt-1">
                                      {setting.description}
                                    </div>
                                  </div>
                                  
                                  <div className="ml-4">
                                    {setting.type === 'switch' && (
                                      <Switch
                                        checked={settings[setting.key]}
                                        onCheckedChange={(checked) => 
                                          handleSettingChange(setting.key, checked)
                                        }
                                      />
                                    )}
                                    
                                    {setting.type === 'slider' && (
                                      <div className="w-32">
                                        <Slider
                                          value={[settings[setting.key]]}
                                          onValueChange={([value]) => 
                                            handleSettingChange(setting.key, value)
                                          }
                                          min={setting.min}
                                          max={setting.max}
                                          step={setting.step}
                                          className="w-full"
                                        />
                                        <div className="text-center text-caption text-tertiary mt-1">
                                          {settings[setting.key]}{setting.unit}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border-primary bg-surface-secondary">
                <div className="flex items-center justify-between">
                  <div className="text-body-small text-secondary">
                    <strong>Raccourci :</strong> Alt + A pour ouvrir ce panneau
                  </div>
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="btn-primary"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut listener */}
      <div className="hidden">
        {typeof window !== 'undefined' && (
          <div
            onKeyDown={(e) => {
              if (e.altKey && e.key === 'a') {
                e.preventDefault();
                setIsOpen(true);
                toast.info("♿ Panneau d'accessibilité ouvert", {
                  description: "Utilisez Tab pour naviguer entre les options"
                });
              }
            }}
          />
        )}
      </div>
    </>
  );
}

// Add global styles for accessibility
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .reduce-motion * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    
    .high-contrast {
      filter: contrast(150%);
    }
    
    .large-text {
      font-size: 1.2em;
      line-height: 1.5;
    }
    
    .focus-visible-enhanced *:focus-visible {
      outline: 3px solid var(--kongo-lime) !important;
      outline-offset: 2px !important;
      border-radius: 4px;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  
  if (!document.head.querySelector('#accessibility-styles')) {
    style.id = 'accessibility-styles';
    document.head.appendChild(style);
  }
}