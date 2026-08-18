import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { TicketTemplate } from "../ui/TicketTemplate";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  ShieldCheck,
  X,
} from "../../../lib/icons";

type ScanState = "idle" | "loading" | "valid" | "invalid" | "already_boarded";

interface ValidatedTicket {
  bookingCode: string;
  passengerName: string;
  passengerPhone: string;
  tripOrigin: string;
  tripDestination: string;
  departureTime: string;
  seats: string[];
  extras: string[];
  totalAmount: number;
  currency: string;
  agencyName: string;
  paymentMethod: string;
  status: string;
}

const STATE_CONFIG: Record<
  ScanState,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  idle: {
    label: "En attente de scan",
    color: "text-[#86868B]",
    bg: "bg-[#F2F2F7]",
    icon: <Search className="w-6 h-6 text-[#86868B]" />,
  },
  loading: {
    label: "Vérification en cours...",
    color: "text-[#007AFF]",
    bg: "bg-[#007AFF]/10",
    icon: <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" />,
  },
  valid: {
    label: "✓ BILLET VALIDE — EMBARQUEMENT AUTORISÉ",
    color: "text-[#34C759]",
    bg: "bg-[#34C759]/10",
    icon: <CheckCircle2 className="w-6 h-6 text-[#34C759]" />,
  },
  invalid: {
    label: "✗ BILLET INTROUVABLE OU INVALIDE",
    color: "text-[#FF3B30]",
    bg: "bg-[#FF3B30]/10",
    icon: <AlertCircle className="w-6 h-6 text-[#FF3B30]" />,
  },
  already_boarded: {
    label: "⚠ BILLET DÉJÀ UTILISÉ",
    color: "text-[#FF9500]",
    bg: "bg-[#FF9500]/10",
    icon: <AlertCircle className="w-6 h-6 text-[#FF9500]" />,
  },
};

export function Scanner() {
  const { userRole } = useAppState();
  const [inputCode, setInputCode] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [validatedTicket, setValidatedTicket] = useState<ValidatedTicket | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ code: string; state: ScanState; time: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount for USB barcode scanner hardware
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resetScan = () => {
    setScanState("idle");
    setValidatedTicket(null);
    setInputCode("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const validateCode = async (rawCode: string) => {
    // Strip the TICKET- prefix if present (from QR payload)
    const code = rawCode.trim().replace(/^TICKET-/i, "");
    if (!code) return;

    setScanState("loading");
    setValidatedTicket(null);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles!bookings_user_id_profiles_fkey(full_name, phone_number),
          trips(
            *,
            origin:locations!origin_location_id(name),
            dest:locations!destination_location_id(name),
            agencies(name)
          )
        `)
        .or(`booking_code.eq.${code},id.eq.${code}`)
        .single();

      if (error || !data) {
        setScanState("invalid");
        addHistory(code, "invalid");
        return;
      }

      if (data.boarded_at) {
        setScanState("already_boarded");
        addHistory(code, "already_boarded");
        buildTicketPreview(data);
        return;
      }

      // Mark as boarded
      await supabase
        .from("bookings")
        .update({ boarded_at: new Date().toISOString() })
        .eq("id", data.id);

      setScanState("valid");
      addHistory(code, "valid");
      buildTicketPreview(data);
    } catch (err) {
      setScanState("invalid");
      addHistory(code, "invalid");
    }
  };

  const buildTicketPreview = (data: any) => {
    setValidatedTicket({
      bookingCode: data.booking_code || data.id.substring(0, 8),
      passengerName: data.profiles?.full_name || "Inconnu",
      passengerPhone: data.profiles?.phone_number || "---",
      tripOrigin: data.trips?.origin?.name || "---",
      tripDestination: data.trips?.dest?.name || "---",
      departureTime: data.trips?.departure_time
        ? new Date(data.trips.departure_time).toLocaleString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "---",
      seats: Array.isArray(data.seats) ? data.seats.sort() : [],
      extras:
        data.extra_services?.length > 0
          ? data.extra_services.map((e: any) => `${e.title} x${e.quantity}`)
          : [],
      totalAmount: data.total_price || 0,
      currency: data.currency || "CDF",
      agencyName: data.trips?.agencies?.name || "KonGO Express",
      paymentMethod: data.payment_method || "cash",
      status: data.status,
    });
  };

  const addHistory = (code: string, state: ScanState) => {
    setScanHistory((prev) =>
      [
        {
          code,
          state,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
        ...prev,
      ].slice(0, 20)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      validateCode(inputCode);
    }
  };

  const stateConfig = STATE_CONFIG[scanState];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">
            Validation Billets
          </h1>
          <p className="text-[15px] text-[#86868B] mt-1">
            Scanner le QR code ou saisir manuellement le code de réservation
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#34C759]/10 rounded-full border border-[#34C759]/20">
          <ShieldCheck className="w-4 h-4 text-[#34C759]" />
          <span className="text-[12px] font-black uppercase tracking-widest text-[#34C759]">
            Terminal Actif
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Scanner Panel (left) ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Status indicator */}
          <div className={`p-5 rounded-2xl ${stateConfig.bg} flex items-center gap-4 transition-all duration-300`}>
            {stateConfig.icon}
            <p className={`text-[13px] font-black uppercase tracking-wide ${stateConfig.color}`}>
              {stateConfig.label}
            </p>
          </div>

          {/* Input box */}
          <div className="bg-white rounded-2xl border-2 border-black/8 p-6 space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#86868B]">
              Code ou Réf. Billet
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
              <input
                ref={inputRef}
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="KG-XXXXXX ou TICKET-..."
                className="w-full h-14 pl-12 pr-4 bg-[#F2F2F7] border-0 rounded-xl text-[16px] font-bold text-[#1D1D1F] placeholder:text-[#C7C7CC] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/15 transition-all"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => validateCode(inputCode)}
                disabled={scanState === "loading" || !inputCode.trim()}
                className="h-12 bg-[#1D1D1F] text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {scanState === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                Valider
              </button>
              <button
                onClick={resetScan}
                className="h-12 bg-[#F2F2F7] text-[#1D1D1F] rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-black/10 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
            <p className="text-[11px] text-[#C7C7CC] text-center font-medium">
              Appuyez sur <kbd className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#86868B] font-mono">Entrée</kbd> pour valider — compatible lecteur USB
            </p>
          </div>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
              <div className="px-5 py-4 border-b border-black/5">
                <p className="text-[12px] font-black uppercase tracking-widest text-[#86868B]">
                  Historique des scans
                </p>
              </div>
              <div className="divide-y divide-black/5 max-h-64 overflow-y-auto">
                {scanHistory.map((entry, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {entry.state === "valid" ? (
                        <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
                      ) : entry.state === "already_boarded" ? (
                        <AlertCircle className="w-4 h-4 text-[#FF9500] shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-[#FF3B30] shrink-0" />
                      )}
                      <span className="text-[13px] font-bold text-[#1D1D1F] font-mono tracking-wider">
                        {entry.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#86868B] font-mono shrink-0">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Ticket Preview (right) ───────────────────────────── */}
        <div className="lg:col-span-3">
          {validatedTicket ? (
            <div className="space-y-4">
              {/* State banner */}
              <div
                className={`p-4 rounded-2xl ${stateConfig.bg} flex items-center gap-4`}
              >
                {stateConfig.icon}
                <div>
                  <p className={`text-[13px] font-black uppercase tracking-wide ${stateConfig.color}`}>
                    {stateConfig.label}
                  </p>
                  {scanState === "already_boarded" && (
                    <p className="text-[11px] text-[#FF9500] font-medium mt-0.5">
                      Ce billet a déjà été scanné. Vérifiez l'identité du passager.
                    </p>
                  )}
                </div>
              </div>

              <TicketTemplate
                bookingCode={validatedTicket.bookingCode}
                passengerName={validatedTicket.passengerName}
                passengerPhone={validatedTicket.passengerPhone}
                tripOrigin={validatedTicket.tripOrigin}
                tripDestination={validatedTicket.tripDestination}
                departureTime={validatedTicket.departureTime}
                seats={validatedTicket.seats}
                extras={validatedTicket.extras}
                totalAmount={validatedTicket.totalAmount}
                currency={validatedTicket.currency}
                agencyName={validatedTicket.agencyName}
                paymentMethod={validatedTicket.paymentMethod}
              />
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-white rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center gap-4 text-center p-10">
              <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-[#C7C7CC]" />
              </div>
              <div>
                <p className="text-[17px] font-semibold text-[#1D1D1F]">
                  Aucun billet scanné
                </p>
                <p className="text-[14px] text-[#86868B] mt-1 max-w-xs">
                  Le billet validé apparaîtra ici. Scannez le QR code ou saisissez manuellement le code de réservation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
