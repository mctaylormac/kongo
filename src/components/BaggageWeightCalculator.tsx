import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { 
  Luggage,
  Scale,
  Package,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  Calculator,
  ArrowRight,
  Trash2,
  Edit,
  Weight,
  DollarSign
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface BaggageItem {
  id: string;
  type: 'cabine' | 'soute';
  weight: number;
  price: number;
  description: string;
}

interface BaggageWeightCalculatorProps {
  passengers: number;
  onBaggageUpdate?: (baggage: BaggageItem[], totalCost: number) => void;
  onContinue?: () => void;
  onBack?: () => void;
}

export function BaggageWeightCalculator({ 
  passengers = 1, 
  onBaggageUpdate,
  onContinue,
  onBack 
}: BaggageWeightCalculatorProps) {
  const [baggageItems, setBaggageItems] = useState<BaggageItem[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Grille tarifaire par tranches de poids (en CDF)
  const pricingTiers = {
    cabine: [
      { min: 0, max: 7, price: 0, label: "Gratuit", description: "Bagage cabine standard" },
      { min: 7, max: 10, price: 15000, label: "Léger", description: "Léger excédent" },
      { min: 10, max: 15, price: 35000, label: "Moyen", description: "Excédent modéré" },
      { min: 15, max: 20, price: 65000, label: "Lourd", description: "Excédent important" }
    ],
    soute: [
      { min: 0, max: 20, price: 0, label: "Gratuit", description: "Bagage soute inclus" },
      { min: 20, max: 25, price: 25000, label: "Standard+", description: "Excédent léger" },
      { min: 25, max: 30, price: 45000, label: "Moyen", description: "Excédent modéré" },
      { min: 30, max: 35, price: 75000, label: "Lourd", description: "Excédent important" },
      { min: 35, max: 40, price: 120000, label: "Très lourd", description: "Excédent maximal" },
      { min: 40, max: 50, price: 200000, label: "Exceptionnel", description: "Cas spécial" }
    ]
  };

  const calculatePrice = (type: 'cabine' | 'soute', weight: number): number => {
    const tiers = pricingTiers[type];
    const tier = tiers.find(t => weight >= t.min && weight <= t.max);
    return tier?.price || 0;
  };

  const getTierInfo = (type: 'cabine' | 'soute', weight: number) => {
    const tiers = pricingTiers[type];
    return tiers.find(t => weight >= t.min && weight <= t.max);
  };

  const addBaggage = (type: 'cabine' | 'soute') => {
    const defaultWeight = type === 'cabine' ? 5 : 15;
    const price = calculatePrice(type, defaultWeight);
    
    const newBaggage: BaggageItem = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      weight: defaultWeight,
      price,
      description: `Bagage ${type} - Passager ${selectedPassenger}`
    };

    setBaggageItems(prev => [...prev, newBaggage]);
    
    toast.success("🧳 Bagage ajouté", {
      description: `${type === 'cabine' ? 'Cabine' : 'Soute'} - ${defaultWeight}kg - ${price > 0 ? `${price.toLocaleString()} CDF` : 'Gratuit'}`
    });
  };

  const updateBaggageWeight = (id: string, weight: number) => {
    setBaggageItems(prev => prev.map(item => {
      if (item.id === id) {
        const newPrice = calculatePrice(item.type, weight);
        return { ...item, weight, price: newPrice };
      }
      return item;
    }));
  };

  const removeBaggage = (id: string) => {
    setBaggageItems(prev => prev.filter(item => item.id !== id));
    toast.info("🗑️ Bagage supprimé");
  };

  const totalCost = baggageItems.reduce((sum, item) => sum + item.price, 0);
  const totalWeight = baggageItems.reduce((sum, item) => sum + item.weight, 0);

  // Notify parent component when baggage changes
  useEffect(() => {
    if (onBaggageUpdate) {
      onBaggageUpdate(baggageItems, totalCost);
    }
  }, [baggageItems, totalCost]);

  const getWeightStatus = (type: 'cabine' | 'soute', weight: number) => {
    if (type === 'cabine' && weight > 20) return 'error';
    if (type === 'soute' && weight > 50) return 'error';
    if (weight === 0) return 'info';
    const tier = getTierInfo(type, weight);
    if (!tier) return 'error';
    if (tier.price === 0) return 'success';
    return 'warning';
  };

  const getBaggageStats = () => {
    const cabineCount = baggageItems.filter(item => item.type === 'cabine').length;
    const souteCount = baggageItems.filter(item => item.type === 'soute').length;
    const cabineWeight = baggageItems.filter(item => item.type === 'cabine').reduce((sum, item) => sum + item.weight, 0);
    const souteWeight = baggageItems.filter(item => item.type === 'soute').reduce((sum, item) => sum + item.weight, 0);
    
    return { cabineCount, souteCount, cabineWeight, souteWeight };
  };

  const stats = getBaggageStats();

  return (
    <div className="min-h-screen bg-surface-primary py-8">
      <div className="container-professional">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-3 bg-surface-kongo-lime-light px-6 py-3 rounded-full mb-6"
            >
              <Scale className="w-6 h-6 text-kongo-lime-dark" />
              <span className="text-body font-semibold text-kongo-lime-dark">
                CALCUL BAGAGES
              </span>
            </motion.div>
            
            <h1 className="text-h1 text-kongo-black mb-4">
              Calculez vos <span className="text-kongo-lime">bagages</span>
            </h1>
            
            <p className="text-body-large text-secondary max-w-2xl mx-auto">
              Optimisez vos coûts de transport avec notre calculateur intelligent. 
              Tarification transparente selon le poids de vos bagages.
            </p>
          </div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="card-elevated">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-surface-kongo-lime-light rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Luggage className="w-6 h-6 text-kongo-lime-dark" />
                </div>
                <div className="text-h4 text-kongo-black font-bold">{baggageItems.length}</div>
                <div className="text-body-small text-secondary">Bagages totaux</div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-surface-kongo-lime-light rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Weight className="w-6 h-6 text-kongo-lime-dark" />
                </div>
                <div className="text-h4 text-kongo-black font-bold">{totalWeight}kg</div>
                <div className="text-body-small text-secondary">Poids total</div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-surface-kongo-lime-light rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-kongo-lime-dark" />
                </div>
                <div className="text-h4 text-kongo-black font-bold">
                  {totalCost.toLocaleString()} CDF
                </div>
                <div className="text-body-small text-secondary">Coût total</div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-surface-kongo-lime-light rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Calculator className="w-6 h-6 text-kongo-lime-dark" />
                </div>
                <div className="text-h4 text-kongo-black font-bold">
                  {passengers > 1 ? `${passengers}` : '1'}
                </div>
                <div className="text-body-small text-secondary">
                  Passager{passengers > 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Pricing Guide */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="lg:col-span-1"
            >
              <Card className="card-elevated h-fit sticky top-8">
                <CardHeader>
                  <CardTitle className="text-h4 text-kongo-black flex items-center">
                    <Info className="w-5 h-5 mr-3 text-kongo-lime" />
                    Grille Tarifaire
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Baggage Cabine */}
                  <div>
                    <h4 className="text-label text-primary font-semibold mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Bagage Cabine
                    </h4>
                    <div className="space-y-2">
                      {pricingTiers.cabine.map((tier, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-primary"
                        >
                          <div>
                            <div className="text-body-small font-medium text-primary">
                              {tier.min}-{tier.max}kg
                            </div>
                            <div className="text-caption text-tertiary">
                              {tier.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={tier.price === 0 ? "status-success" : "status-warning"}>
                              {tier.price === 0 ? 'Gratuit' : `${tier.price.toLocaleString()} CDF`}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Baggage Soute */}
                  <div>
                    <h4 className="text-label text-primary font-semibold mb-3 flex items-center">
                      <Luggage className="w-4 h-4 mr-2" />
                      Bagage Soute
                    </h4>
                    <div className="space-y-2">
                      {pricingTiers.soute.map((tier, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-primary"
                        >
                          <div>
                            <div className="text-body-small font-medium text-primary">
                              {tier.min}-{tier.max}kg
                            </div>
                            <div className="text-caption text-tertiary">
                              {tier.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={tier.price === 0 ? "status-success" : "status-warning"}>
                              {tier.price === 0 ? 'Gratuit' : `${tier.price.toLocaleString()} CDF`}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="p-4 bg-surface-kongo-lime-light rounded-lg border border-kongo-lime/20">
                    <h5 className="text-label font-semibold text-kongo-lime-dark mb-2">
                      💡 Conseils KonGO
                    </h5>
                    <div className="space-y-2 text-body-small text-kongo-lime-darker">
                      <p>• Pesez vos bagages avant le voyage</p>
                      <p>• Répartissez le poids entre cabine et soute</p>
                      <p>• Les objets fragiles vont en cabine</p>
                      <p>• Économisez avec les tranches gratuites</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Baggage Calculator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="lg:col-span-2 space-y-6"
            >
              
              {/* Passenger Selection */}
              {passengers > 1 && (
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-h5 text-kongo-black">
                      Sélectionnez le passager
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      {Array.from({ length: passengers }, (_, i) => i + 1).map((num) => (
                        <Button
                          key={num}
                          onClick={() => setSelectedPassenger(num)}
                          variant={selectedPassenger === num ? "default" : "outline"}
                          className={selectedPassenger === num ? "btn-secondary" : "btn-outline"}
                        >
                          Passager {num}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Baggage Actions */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-h5 text-kongo-black flex items-center justify-between">
                    <span>Ajouter des bagages</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-body-small text-secondary">Mode avancé</span>
                      <Switch
                        checked={showAdvanced}
                        onCheckedChange={setShowAdvanced}
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Add Cabine Baggage */}
                    <motion.button
                      onClick={() => addBaggage('cabine')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-6 rounded-lg border-2 border-dashed border-border-secondary hover:border-kongo-lime bg-surface-secondary hover:bg-surface-kongo-lime-light transition-all duration-300 group"
                    >
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-surface-primary group-hover:bg-kongo-lime rounded-xl flex items-center justify-center mx-auto transition-colors">
                          <Package className="w-8 h-8 text-kongo-lime group-hover:text-kongo-black transition-colors" />
                        </div>
                        <div>
                          <div className="text-body font-semibold text-primary group-hover:text-kongo-lime-dark">
                            Bagage Cabine
                          </div>
                          <div className="text-body-small text-secondary">
                            Max 20kg • 0-7kg gratuit
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <Plus className="w-5 h-5 text-kongo-lime" />
                        </div>
                      </div>
                    </motion.button>

                    {/* Add Soute Baggage */}
                    <motion.button
                      onClick={() => addBaggage('soute')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-6 rounded-lg border-2 border-dashed border-border-secondary hover:border-kongo-lime bg-surface-secondary hover:bg-surface-kongo-lime-light transition-all duration-300 group"
                    >
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-surface-primary group-hover:bg-kongo-lime rounded-xl flex items-center justify-center mx-auto transition-colors">
                          <Luggage className="w-8 h-8 text-kongo-lime group-hover:text-kongo-black transition-colors" />
                        </div>
                        <div>
                          <div className="text-body font-semibold text-primary group-hover:text-kongo-lime-dark">
                            Bagage Soute
                          </div>
                          <div className="text-body-small text-secondary">
                            Max 50kg • 0-20kg gratuit
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <Plus className="w-5 h-5 text-kongo-lime" />
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </CardContent>
              </Card>

              {/* Baggage Items List */}
              <AnimatePresence>
                {baggageItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h5 text-kongo-black flex items-center">
                          <Scale className="w-5 h-5 mr-3 text-kongo-lime" />
                          Mes bagages ({baggageItems.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {baggageItems.map((item, index) => {
                          const status = getWeightStatus(item.type, item.weight);
                          const tierInfo = getTierInfo(item.type, item.weight);
                          
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 rounded-lg border border-border-primary bg-surface-secondary"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-surface-kongo-lime-light rounded-lg flex items-center justify-center">
                                    {item.type === 'cabine' ? 
                                      <Package className="w-5 h-5 text-kongo-lime-dark" /> :
                                      <Luggage className="w-5 h-5 text-kongo-lime-dark" />
                                    }
                                  </div>
                                  <div>
                                    <div className="text-body font-medium text-primary">
                                      Bagage {item.type === 'cabine' ? 'Cabine' : 'Soute'}
                                    </div>
                                    <div className="text-body-small text-secondary">
                                      {item.description}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {status === 'success' && <CheckCircle className="w-5 h-5 text-success" />}
                                  {status === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
                                  {status === 'error' && <AlertTriangle className="w-5 h-5 text-error" />}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBaggage(item.id)}
                                    className="w-8 h-8 p-0 text-error hover:text-error"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Weight Slider */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-label text-primary">
                                    Poids: {item.weight}kg
                                  </label>
                                  {tierInfo && (
                                    <Badge className={status === 'success' ? 'status-success' : status === 'warning' ? 'status-warning' : 'status-error'}>
                                      {tierInfo.label}
                                    </Badge>
                                  )}
                                </div>
                                
                                <Slider
                                  value={[item.weight]}
                                  onValueChange={([value]) => updateBaggageWeight(item.id, value)}
                                  min={0}
                                  max={item.type === 'cabine' ? 25 : 55}
                                  step={0.5}
                                  className="w-full"
                                />
                                
                                <div className="flex items-center justify-between text-body-small">
                                  <span className="text-tertiary">
                                    Limite: {item.type === 'cabine' ? '20kg' : '50kg'}
                                  </span>
                                  <span className={`font-semibold ${item.price === 0 ? 'text-success' : 'text-kongo-black'}`}>
                                    {item.price === 0 ? 'Gratuit' : `${item.price.toLocaleString()} CDF`}
                                  </span>
                                </div>
                                
                                {tierInfo && (
                                  <div className="text-caption text-tertiary">
                                    {tierInfo.description}
                                  </div>
                                )}
                              </div>

                              {/* Advanced Mode: Manual Input */}
                              {showAdvanced && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-4 pt-4 border-t border-border-primary"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-1">
                                      <Input
                                        type="number"
                                        value={item.weight}
                                        onChange={(e) => updateBaggageWeight(item.id, parseFloat(e.target.value) || 0)}
                                        min="0"
                                        max={item.type === 'cabine' ? '25' : '55'}
                                        step="0.1"
                                        className="text-center"
                                      />
                                    </div>
                                    <span className="text-body-small text-secondary">kg</span>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Summary and Actions */}
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-surface-kongo-lime-light rounded-lg">
                        <div className="text-h4 text-kongo-lime-dark font-bold">
                          {stats.cabineCount}
                        </div>
                        <div className="text-body-small text-kongo-lime-darker">
                          Bagages cabine
                        </div>
                        <div className="text-caption text-kongo-lime-darker">
                          {stats.cabineWeight}kg total
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-surface-kongo-lime-light rounded-lg">
                        <div className="text-h4 text-kongo-lime-dark font-bold">
                          {stats.souteCount}
                        </div>
                        <div className="text-body-small text-kongo-lime-darker">
                          Bagages soute
                        </div>
                        <div className="text-caption text-kongo-lime-darker">
                          {stats.souteWeight}kg total
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-kongo-black rounded-lg">
                        <div className="text-h4 text-on-black font-bold">
                          {totalCost.toLocaleString()}
                        </div>
                        <div className="text-body-small text-on-black opacity-90">
                          Coût total CDF
                        </div>
                        <div className="text-caption text-on-black opacity-75">
                          {totalWeight}kg au total
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {onBack && (
                        <Button
                          onClick={onBack}
                          variant="outline"
                          className="btn-outline flex-1"
                        >
                          Retour
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          if (baggageItems.length === 0) {
                            toast.info("💼 Aucun bagage ajouté", {
                              description: "Vous voyagez léger ! Passez à l'étape suivante.",
                              action: {
                                label: "Continuer",
                                onClick: () => onContinue?.()
                              }
                            });
                          } else {
                            toast.success("✅ Bagages confirmés", {
                              description: `${baggageItems.length} bagage${baggageItems.length > 1 ? 's' : ''} • ${totalWeight}kg • ${totalCost.toLocaleString()} CDF`
                            });
                          }
                          onContinue?.();
                        }}
                        className="btn-primary flex-1"
                      >
                        <span>Continuer</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    {/* Additional Info */}
                    {totalCost > 0 && (
                      <div className="p-4 bg-surface-secondary rounded-lg border border-border-primary">
                        <div className="flex items-start space-x-3">
                          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                          <div className="text-body-small text-secondary">
                            <strong>Note importante :</strong> Les frais de bagages seront ajoutés à votre facture finale. 
                            Assurez-vous que vos bagages respectent les dimensions autorisées : 
                            cabine (55x40x20cm), soute (75x50x30cm).
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}