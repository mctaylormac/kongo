import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Minus, Plus, Package, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

import { BaggageItem } from "./app/AppTypes";


interface BaggageWeightCalculatorProps {
  passengers: number;
  trip?: any;
  onBaggageUpdate?: (baggage: BaggageItem[], totalCost: number) => void;
  onContinue?: () => void;
  onBack?: () => void;
  variant?: 'full' | 'compact';
}

export function BaggageWeightCalculator({ 
  passengers = 1, 
  trip,
  onBaggageUpdate,
  onContinue,
  onBack,
  variant = 'full'
}: BaggageWeightCalculatorProps) {
  const [extraServices, setExtraServices] = useState<any[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<{service: any, quantity: number}[]>([]);

  useEffect(() => {
    console.log("BaggageWeightCalculator - Trip received:", trip);
    if (trip?.agency_id) {
      supabase
        .from('extra_services')
        .select('*')
        .eq('agency_id', trip.agency_id)
        .eq('is_active', true)
        .then(({ data, error }) => {
          if (error) console.error("Error fetching extra services:", error);
          setExtraServices(data || []);
        });
    }
  }, [trip?.agency_id]);

  const updateQuantity = (service: any, delta: number) => {
    setSelectedExtras(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(item => item.service.id !== service.id);
        }
        return prev.map(item => 
          item.service.id === service.id ? { ...item, quantity: newQty } : item
        );
      } else if (delta > 0) {
        return [...prev, { service, quantity: delta }];
      }
      return prev;
    });
  };

  const totalCost = selectedExtras.reduce((sum, item) => sum + item.service.price * item.quantity, 0);
  const totalItemsCount = selectedExtras.reduce((sum, item) => sum + item.quantity, 0);

  // Notify parent component when extras change
  useEffect(() => {
    if (onBaggageUpdate) {
      const mappedExtras: BaggageItem[] = [];
      selectedExtras.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          mappedExtras.push({
            id: `${item.service.id}-${i}-${Date.now()}`,
            type: 'extra',
            weight: 0,
            price: item.service.price,
            description: item.service.title
          });
        }
      });
      onBaggageUpdate(mappedExtras, totalCost);
    }
  }, [selectedExtras, totalCost]);

  if (variant === 'compact') {
    return (
      <div className="bg-transparent space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <Card className="card-elevated bg-surface-secondary/50 border-none">
            <CardContent className="p-3 text-center">
              <div className="text-h4 text-kongo-black font-bold">{totalItemsCount}</div>
              <div className="text-caption text-secondary uppercase tracking-tighter">Services</div>
            </CardContent>
          </Card>
          <Card className="card-elevated bg-kongo-lime/10 border-none">
            <CardContent className="p-3 text-center">
              <div className="text-h4 text-kongo-lime-dark font-black">
                {totalCost.toLocaleString()} 
              </div>
              <div className="text-caption text-kongo-lime-dark uppercase tracking-tighter">Frais CDF</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <Package className="w-6 h-6 text-kongo-lime-dark" />
              <span className="text-body font-semibold text-kongo-lime-dark">
                SERVICES SUPPLÉMENTAIRES
              </span>
            </motion.div>
            
            <h1 className="text-h1 text-kongo-black mb-4">
              Personnalisez votre <span className="text-kongo-lime">voyage</span>
            </h1>
            
            <p className="text-body-large text-secondary max-w-2xl mx-auto">
              Ajoutez des services supplémentaires tels que des repas gastronomiques ou des bagages excédentaires pour un voyage idéal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {extraServices.length === 0 ? (
              <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">Aucun service disponible</h3>
                <p>Cette agence ne propose pas de services supplémentaires pour ce trajet.</p>
              </div>
            ) : (
              extraServices.map(service => {
                const selectedItem = selectedExtras.find(s => s.service.id === service.id);
                const quantity = selectedItem ? selectedItem.quantity : 0;
                const isSelected = quantity > 0;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={service.id} 
                    className={`flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${isSelected ? 'border-kongo-lime bg-kongo-lime/5 shadow-md transform -translate-y-1' : 'border-gray-200 hover:border-kongo-lime/50 bg-white hover:shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-extrabold text-kongo-black text-lg pr-4">{service.title}</span>
                      {isSelected && <CheckCircle className="w-6 h-6 shrink-0 text-kongo-lime" />}
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-6 flex-grow leading-relaxed">{service.description}</p>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-base font-black text-kongo-lime-dark">
                         {service.price.toLocaleString()} CDF
                      </span>
                      
                      <div className="flex items-center space-x-3 bg-gray-50 rounded-full border border-gray-200 p-1">
                        <Button 
                          variant="ghost" 
                          className="w-10 h-10 p-0 rounded-full text-gray-500 hover:text-kongo-lime hover:bg-kongo-lime/10"
                          onClick={() => updateQuantity(service, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="w-5 h-5" />
                        </Button>
                        <span className="w-6 text-center font-bold text-lg text-kongo-black">
                          {quantity}
                        </span>
                        <Button 
                          variant="ghost" 
                          className="w-10 h-10 p-0 rounded-full text-kongo-lime hover:bg-kongo-lime/10"
                          onClick={() => updateQuantity(service, 1)}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-xl mb-12">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-500 font-bold mb-1">Total Services</p>
                <p className="text-2xl font-black text-kongo-black">{totalItemsCount}</p>
              </div>
              <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
              <div className="hidden md:block">
                <p className="text-sm text-gray-500 font-bold mb-1">Montant Total</p>
                <p className="text-2xl font-black text-kongo-lime-dark">{totalCost.toLocaleString()} CDF</p>
              </div>
            </div>

            <div className="flex gap-4">
              {onBack && (
                <Button variant="outline" className="h-12 px-6 md:px-8 rounded-full font-bold" onClick={onBack}>
                  Retour
                </Button>
              )}
              {onContinue && (
                <Button className="h-12 px-6 md:px-8 rounded-full font-bold bg-kongo-lime text-white hover:bg-kongo-lime-dark gap-2" onClick={onContinue}>
                  Continuer <ArrowRight className="w-5 h-5 hidden md:block" />
                </Button>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
