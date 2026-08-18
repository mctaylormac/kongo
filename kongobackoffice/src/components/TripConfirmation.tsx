import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { KonGOLogo } from "./KonGOLogo";
import DigitalTicket from "./ui/DigitalTicket";
import {
  CheckCircle2,
  Download,
  Share2,
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  QrCode,
  Smartphone,
  Home,
  Shield,
  Ticket,
  Copy,
  Info,
  Users,
  Star,
  Bus,
  ArrowRight,
  ChevronRight,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { QRCodeSVG } from "qrcode.react";


interface TripConfirmationProps {
  bookingData: any;
  searchParams?: any;
  selectedTrip?: any;
  selectedSeats?: any[];
  onNewSearch: () => void;
  onViewDashboard: () => void;
  preferences: any;
}

export function TripConfirmation({
  bookingData,
  searchParams,
  selectedTrip,
  selectedSeats,
  onNewSearch,
  onViewDashboard,
  preferences
}: TripConfirmationProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  

  // Enhanced booking reference generation
  const bookingReference = bookingData?.transactionId || bookingData?.booking_code || `KGO${Date.now().toString().slice(-8)}`;

  // Complete booking data with all necessary info
  const completeBookingData = {
    bookingReference,
    bookingDate: bookingData?.processedAt || bookingData?.created_at || new Date().toISOString(),
    trip: selectedTrip || bookingData?.trip || {
      from: searchParams?.from || bookingData?.trip?.from || "Ville de depart",
      to: searchParams?.to || bookingData?.trip?.to || "Ville d'arrivee",
      departure: selectedTrip?.departure || bookingData?.trip?.departure || "08:00",
      duration: selectedTrip?.duration || bookingData?.trip?.duration || "16h",
      date: searchParams?.date || bookingData?.trip?.date || new Date().toISOString().split('T')[0],
      operator: selectedTrip?.agencies?.name || bookingData?.trip?.operator || "KonGO Express"
    },
    seats: selectedSeats && selectedSeats.length > 0 ? selectedSeats : (bookingData?.seats || [
      { row: "0", column: "0", type: "standard", price: bookingData?.amount || bookingData?.total_price || 0 }
    ]),
    passenger: {
      firstName: bookingData?.firstName || bookingData?.full_name?.split(' ')[0] || "Voyageur",
      lastName: bookingData?.lastName || bookingData?.full_name?.split(' ').slice(1).join(' ') || "KonGO",
      email: bookingData?.email || "contact@kongo-transport.cd",
      phone: bookingData?.phone || bookingData?.phoneNumber || bookingData?.phone_number || "+243 123 456 789"
    },
    payment: {
      method: bookingData?.method || bookingData?.paymentMethod || bookingData?.payment_method || "paiement",
      amount: bookingData?.amount || bookingData?.totalPrice || bookingData?.total_price || 0,
      currency: bookingData?.currency || "CDF",
      fees: bookingData?.fees || 0,
      discount: bookingData?.discount || 0,
      transactionId: bookingData?.transactionId || bookingReference,
      status: bookingData?.status || "completed",
      processedAt: bookingData?.processedAt || bookingData?.created_at || new Date().toISOString()
    },
    baggage: bookingData?.baggage || bookingData?.baggageInfo || null
  };

  // Generate QR Code data - Optimized for ticket reference
  const qrCodeData = `TICKET-${bookingReference}`;


  useEffect(() => {
    // Simulate ticket generation and confirmation sending
    const generateTicket = setTimeout(() => {
      setTicketGenerated(true);
      toast.success("Billet numerique genere", {
        description: "Votre QR code est pret a l'utilisation"
      });
    }, 1000);

    const sendConfirmation = setTimeout(() => {
      setConfirmationSent(true);
      toast.success("Confirmation envoyee", {
        description: "Verifiez votre email et SMS"
      });
    }, 2500);

    return () => {
      clearTimeout(generateTicket);
      clearTimeout(sendConfirmation);
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: completeBookingData.payment.currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDownloadTicket = async () => {
    setIsDownloading(true);

    try {
      toast.loading("Generation du billet PDF...", { id: 'pdf-gen' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const doc = new jsPDF();
      let currentY = 0;

      // En-tete noir
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(190, 255, 0);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("BILLET DE VOYAGE KONGO", 105, 22, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text(`Ref: ${bookingReference}`, 105, 34, { align: "center" });

      // Separateur
      doc.setDrawColor(190, 255, 0);
      doc.setLineWidth(1);
      doc.line(10, 45, 200, 45);

      // Details du voyage
      currentY = 55;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("VOYAGE", 10, currentY);
      doc.text("PASSAGER", 115, currentY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      currentY += 10;
      doc.text(`De: ${completeBookingData.trip.from}`, 10, currentY);
      doc.text(`${completeBookingData.passenger.firstName} ${completeBookingData.passenger.lastName}`, 115, currentY);
      currentY += 8;
      doc.text(`A: ${completeBookingData.trip.to}`, 10, currentY);
      doc.text(`Tel: ${completeBookingData.passenger.phone}`, 115, currentY);
      currentY += 8;
      doc.text(`Date: ${completeBookingData.trip.date}`, 10, currentY);
      doc.text(`Email: ${completeBookingData.passenger.email}`, 115, currentY);
      currentY += 8;
      doc.text(`Depart: ${completeBookingData.trip.departure}`, 10, currentY);
      currentY += 8;
      doc.text(`Duree: ${completeBookingData.trip.duration}`, 10, currentY);

      // Sieges & Paiement
      currentY += 14;
      doc.setDrawColor(200, 200, 200);
      doc.line(10, currentY, 200, currentY);
      currentY += 8;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SIEGES", 10, currentY);
      doc.text("PAIEMENT", 115, currentY);

      currentY += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const seatLabels = completeBookingData.seats.map((s: any) => `${s.row}${s.column}`).join(', ') || 'Non assigne';
      doc.text(seatLabels, 10, currentY);
      doc.text(`Total: ${formatPrice(completeBookingData.payment.amount)}`, 115, currentY);
      currentY += 8;
      doc.text(`Methode: ${completeBookingData.payment.method}`, 115, currentY);
      currentY += 8;
      doc.text("Statut: PAYE", 115, currentY);

      // --- Section BAGAGES si presents ---
      const baggage = completeBookingData.baggage;
      if (baggage && (baggage.items?.length > 0 || baggage.totalWeight)) {
        currentY += 14;
        doc.line(10, currentY, 200, currentY);
        currentY += 8;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 100, 0);
        doc.text("BAGAGES ENREGISTRES", 10, currentY);
        doc.setTextColor(0, 0, 0);

        currentY += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        if (baggage.totalWeight) {
          doc.text(`Poids total: ${baggage.totalWeight} kg`, 10, currentY);
          currentY += 7;
        }
        if (baggage.totalFee) {
          doc.text(`Frais bagages: ${formatPrice(baggage.totalFee)}`, 10, currentY);
          currentY += 7;
        }
        if (baggage.items && baggage.items.length > 0) {
          doc.text("Detail des bagages:", 10, currentY);
          currentY += 6;
          baggage.items.forEach((item: any, idx: number) => {
            const desc = `  ${idx + 1}. ${item.type || 'Bagage'} - ${item.weight || '?'} kg${item.description ? ` (${item.description})` : ''}`;
            doc.text(desc, 10, currentY);
            currentY += 6;
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }
          });
        }

        // Note reglements bagages
        doc.setFillColor(240, 255, 240);
        doc.rect(10, currentY, 190, 16, 'F');
        doc.setFontSize(9);
        doc.setTextColor(0, 100, 0);
        doc.text("Presentez-vous au comptoir avec vos bagages 45 mn avant le depart.", 14, currentY + 7);
        doc.text("Tout excedent de poids sera facture sur place.", 14, currentY + 13);
        doc.setTextColor(0, 0, 0);
        currentY += 22;
      }

      // Note QR code
      currentY = Math.max(currentY + 10, 210);
      doc.setFillColor(245, 245, 245);
      doc.rect(10, currentY, 190, 24, 'F');
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Scannez le QR code sur votre application KonGO pour l'embarquement.", 105, currentY + 9, { align: "center" });
      doc.text(`Code de verification: ${bookingReference}`, 105, currentY + 17, { align: "center" });

      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Merci d'avoir choisi KonGO. Veuillez vous presenter 30 minutes avant l'heure de depart avec une piece d'identite.", 10, 283);
      doc.text("KonGO Support 24/7: +243 123 456 789 | www.kongo-transport.cd", 10, 288);

      doc.save(`Billet-KonGO-${bookingReference}.pdf`);

      toast.success("Billet PDF telecharge", {
        id: 'pdf-gen',
        description: `Fichier: Billet-KonGO-${bookingReference}.pdf`
      });
    } catch (error) {
      toast.error("Erreur lors du telechargement", { id: 'pdf-gen' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareTicket = async () => {
    const shareData = {
      title: 'Mon billet KonGO',
      text: `Voyage KonGO: ${completeBookingData.trip.from} -> ${completeBookingData.trip.to}\n${completeBookingData.trip.date} a ${completeBookingData.trip.departure}\nSieges: ${completeBookingData.seats.map((s: any) => `${s.row}${s.column}`).join(', ')}\nRef: ${bookingReference}`,
      url: `https://kongo-verify.com/${bookingReference}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Billet partage");
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          copyTicketInfo();
        }
      }
    } else {
      copyTicketInfo();
    }
  };

  const copyTicketInfo = () => {
    const ticketInfo = `BILLET KONGO
Reference: ${bookingReference}
Voyage: ${completeBookingData.trip.from} -> ${completeBookingData.trip.to}
Date: ${completeBookingData.trip.date}
Depart: ${completeBookingData.trip.departure}
Sieges: ${completeBookingData.seats.map((s: any) => `${s.row}${s.column}`).join(', ')}
Passager: ${completeBookingData.passenger.firstName} ${completeBookingData.passenger.lastName}
Total: ${formatPrice(completeBookingData.payment.amount)}
Verification: https://kongo-verify.com/${bookingReference}

KonGO - Transport RDC
Support: +243 123 456 789`;

    navigator.clipboard.writeText(ticketInfo);
    toast.success("Informations copiees");
  };

  const handleAddToCalendar = () => {
    const [hours, minutes] = completeBookingData.trip.departure.split(':');
    const [year, month, day] = completeBookingData.trip.date.split('-');

    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    const durationHours = parseInt(completeBookingData.trip.duration.replace('h', ''));
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Voyage KonGO: ${completeBookingData.trip.from} -> ${completeBookingData.trip.to}`)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&location=${encodeURIComponent(`Gare routiere, ${completeBookingData.trip.from}`)}`;

    window.open(calendarUrl, '_blank');
    toast.success("Evenement ajoute au calendrier");
  };


  return (
    <div className="min-h-screen bg-gradient-kongo-subtle">
      <div className="container-professional py-8 space-y-8">

        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-success rounded-full flex items-center justify-center mx-auto shadow-lg"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-display-2 text-kongo-black font-bold leading-tight">
              Reservation confirmee !
            </h1>
            <p className="text-body-large text-secondary max-w-2xl mx-auto">
              Votre voyage avec KonGO est confirme. Billet numerique et QR code generes avec succes.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center justify-center space-x-2 flex-wrap"
            >
              <Badge className="status-success px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Paiement confirme
              </Badge>
              {confirmationSent && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Badge className="status-kongo px-4 py-2">
                    <Ticket className="w-4 h-4 mr-2" />
                    Billet genere
                  </Badge>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Digital Ticket */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="xl:col-span-2"
          >
            <DigitalTicket
              bookingReference={bookingReference}
              qrCodeData={qrCodeData}
              trip={{
                from: completeBookingData.trip.from,
                to: completeBookingData.trip.to,
                departure: completeBookingData.trip.departure,
                operator: completeBookingData.trip.operator,
                duration: completeBookingData.trip.duration
              }}
              passenger={{
                name: `${completeBookingData.passenger.firstName} ${completeBookingData.passenger.lastName}`,
                phone: completeBookingData.passenger.phone,
                email: completeBookingData.passenger.email
              }}
              seats={completeBookingData.seats.map((s: any) => ({
                label: `${s.row}${s.column}`,
                type: s.type
              }))}
              payment={{
                amount: completeBookingData.payment.amount,
                method: completeBookingData.payment.method,
                date: completeBookingData.bookingDate,
                status: 'completed'
              }}
            />

            {/* Important Information */}
            <Card className="card-elevated mt-6">
              <CardHeader>
                <CardTitle className="text-h5 text-kongo-black flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  Informations importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-surface-kongo-lime-light p-4 rounded-lg border border-kongo-lime/30">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-kongo-lime-dark mt-0.5" />
                        <div>
                          <div className="text-body-small font-medium text-kongo-lime-dark mb-1">
                            Arrivee recommandee
                          </div>
                          <div className="text-body-small text-kongo-lime-dark">
                            Presentez-vous 30 minutes avant le depart avec une piece d'identite valide
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-tertiary p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                        <div>
                          <div className="text-body-small font-medium text-kongo-black mb-1">
                            Point de depart
                          </div>
                          <div className="text-body-small text-secondary">
                            Gare routiere centrale - {completeBookingData.trip.from}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-surface-secondary p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Smartphone className="w-5 h-5 text-secondary mt-0.5" />
                        <div>
                          <div className="text-body-small font-medium text-kongo-black mb-1">
                            Billet numerique
                          </div>
                          <div className="text-body-small text-secondary">
                            Presentez ce billet sur votre telephone ou imprimez-le
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-secondary p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Phone className="w-5 h-5 text-secondary mt-0.5" />
                        <div>
                          <div className="text-body-small font-medium text-kongo-black mb-1">
                            Support 24/7
                          </div>
                          <div className="text-body-small text-secondary">
                            +243 123 456 789 pour toute assistance
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Ticket Actions */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-h5 text-kongo-black font-black uppercase tracking-tight">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleDownloadTicket} 
                  disabled={isDownloading}
                  className="w-full h-14 bg-kongo-black hover:bg-kongo-black-light text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isDownloading ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> Generation...</>
                  ) : (
                    <><Download className="w-5 h-5 text-kongo-lime" /> Telecharger PDF</>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleShareTicket} className="h-14 bg-surface-secondary hover:bg-surface-tertiary text-kongo-black border-none rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                    <Share2 className="w-4 h-4 mr-2 text-secondary" /> Partager
                  </Button>
                  <Button onClick={handleAddToCalendar} className="h-14 bg-surface-secondary hover:bg-surface-tertiary text-kongo-black border-none rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                    <Calendar className="w-4 h-4 mr-2 text-secondary" /> Calendrier
                  </Button>
                </div>

                <Separator className="my-2" />

                <div className="space-y-3">
                  <Button onClick={onViewDashboard} className="w-full h-12 bg-transparent hover:bg-surface-secondary text-secondary hover:text-kongo-black border border-surface-tertiary rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all">
                    <User className="w-4 h-4 mr-2" /> Mes reservations
                  </Button>
                  <Button onClick={onNewSearch} className="w-full h-14 bg-kongo-lime hover:bg-kongo-lime-dark text-kongo-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-kongo-lime/20 transition-all hover:scale-[1.02]">
                    <Home className="w-4 h-4 mr-2" /> Nouvelle recherche
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="bg-surface-kongo-lime-light border-kongo-lime/30 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-kongo-lime rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-6 h-6 text-kongo-black" />
                </div>
                <div>
                  <div className="text-body font-medium text-kongo-lime-dark mb-2 uppercase font-black tracking-widest text-[10px]">
                    Support 24/7
                  </div>
                  <div className="text-[10px] text-kongo-lime-dark mb-4 font-bold">
                    UNE QUESTION ? NOTRE EQUIPE EST LA POUR VOUS AIDER
                  </div>
                  <Button
                    onClick={() => window.open('tel:+243123456789', '_self')}
                    className="w-full bg-white text-kongo-black hover:bg-white/90 border-none rounded-xl font-black text-[10px] uppercase"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    +243 123 456 789
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
