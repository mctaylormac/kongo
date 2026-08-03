import React from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Bus, Ticket, Users, User, CreditCard, MapPin } from 'lucide-react';

interface BookingDetailModalProps {
    booking: any;
    isOpen: boolean;
    onClose: () => void;
}

export function BookingDetailModal({ booking, isOpen, onClose }: BookingDetailModalProps) {
    if (!booking) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden p-0 border-none bg-surface-secondary shadow-2xl-strong flex flex-col">
                <div className="flex flex-col h-full">
                    {/* Header Fixe */}
                    <div className="bg-kongo-black p-6 sm:p-8 text-on-black relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Ticket className="w-32 h-32 rotate-12" />
                        </div>
                        
                        <DialogHeader className="mb-4 relative z-10">
                            <div className="flex items-center gap-3 mb-1">
                                <Badge className="bg-kongo-lime text-kongo-black border-none font-black text-[10px] uppercase h-5">
                                    {booking.payment_status === 'completed' || booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                                </Badge>
                                <span className="text-secondary/60 text-xs font-bold uppercase tracking-widest">
                                    Ref: {booking.booking_code || booking.booking_reference}
                                </span>
                            </div>
                            <DialogTitle className="text-h4 font-black text-on-black">Fiche de Réservation</DialogTitle>
                        </DialogHeader>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="text-left">
                                <p className="text-h4 font-black uppercase tracking-tight text-on-black">
                                    {booking.trips?.origin?.name || 'Départ'}
                                </p>
                                <p className="text-[10px] text-secondary opacity-50 uppercase tracking-widest mt-1">Origine</p>
                            </div>

                            <div className="flex-1 px-6 relative opacity-50">
                                <div className="h-[1px] bg-secondary/30 w-full dashed-line"></div>
                                <Bus className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-kongo-lime" />
                            </div>

                            <div className="text-right">
                                <p className="text-h4 font-black uppercase tracking-tight text-on-black">
                                    {booking.trips?.destination?.name || 'Arrivée'}
                                </p>
                                <p className="text-[10px] text-secondary opacity-50 uppercase tracking-widest mt-1">Destination</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenu Défilant */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-white custom-scrollbar">
                        {/* Client */}
                        <section>
                            <h4 className="text-caption font-black uppercase text-secondary/60 tracking-widest mb-4 flex items-center gap-2">
                                <User className="w-4 h-4" /> Acheteur
                            </h4>
                            <div className="bg-surface-secondary/50 p-5 rounded-2xl border border-border-primary/5 flex items-center justify-between">
                                <div>
                                    <p className="text-body-large font-black text-kongo-black uppercase">{booking.profiles?.full_name}</p>
                                    <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter opacity-70">Contact: {booking.profiles?.phone_number || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-secondary/60 uppercase font-black tracking-widest mb-1">Date d'achat</p>
                                    <p className="text-body-small font-bold text-kongo-black">
                                        {new Date(booking.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Passagers */}
                        <section>
                            <h4 className="text-caption font-black uppercase text-secondary/60 tracking-widest mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Passagers ({booking.passenger_count || 1})</span>
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {(booking.passenger_details || []).length > 0 ? (
                                    booking.passenger_details.map((pass: any, idx: number) => (
                                        <div key={idx} className="p-3 rounded-xl border border-border-primary/5 bg-white shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-kongo-lime/10 flex items-center justify-center text-kongo-lime-dark font-black text-[9px]">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-kongo-black uppercase text-[10px]">{pass.full_name}</p>
                                                    <p className="text-[8px] text-secondary uppercase font-bold">{pass.category_name || 'Standard'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-right">
                                                {pass.price && <span className="text-[10px] font-bold">{formatPrice(pass.price)}</span>}
                                                <span className="bg-kongo-black text-on-black px-2 py-0.5 rounded text-[10px] font-black">{pass.seat_label}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 text-center py-4 text-tertiary text-xs italic bg-surface-secondary/30 rounded-xl">
                                        Pas de détails passagers.
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Finance & Bagages */}
                        <section className="grid sm:grid-cols-2 gap-8 pt-6 border-t border-border-primary/10">
                            <div className="space-y-4">
                                <h4 className="text-caption font-black uppercase text-secondary/60 tracking-widest mb-2 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Paiement
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-body-small text-secondary">Base</span>
                                        <span className="text-body-small font-bold text-kongo-black">
                                            {formatPrice(booking.total_price - (booking.baggage_fee || 0))}
                                        </span>
                                    </div>
                                    {booking.baggage_fee > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-body-small text-secondary">Excédent</span>
                                            <span className="text-body-small font-bold text-kongo-lime-dark">+{formatPrice(booking.baggage_fee)}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-h5 font-black text-kongo-black uppercase">TOTAL</span>
                                        <span className="text-h5 font-black text-kongo-black">{formatPrice(booking.total_price)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-caption font-black uppercase text-secondary/60 tracking-widest mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Expédition
                                </h4>
                                <div className="bg-surface-secondary/50 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-secondary/70">
                                        <span>Articles</span>
                                        <span>{booking.baggage_info?.length || 0}</span>
                                    </div>
                                    {booking.baggage_info?.map((bag: any, bIdx: number) => (
                                        <div key={bIdx} className="text-[10px] p-2 bg-white rounded-lg border border-border-primary/5 flex justify-between">
                                            <span className="text-secondary truncate max-w-[80px]">{bag.description}</span>
                                            <span className="font-black text-kongo-black">{bag.weight}kg</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer Fixe */}
                    <div className="p-4 bg-surface-secondary border-t border-border-primary/10 shrink-0">
                        <Button 
                            className="w-full btn-primary h-12 uppercase tracking-widest font-black text-xs"
                            onClick={onClose}
                        >
                            Fermer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
