/**
 * SuperuserChat — Page chat du superuser KONGO
 * Liste toutes les agences avec badge messages non-lus,
 * et ouvre AdminChatBox pour l'agence sélectionnée.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Building2,
  Loader2,
} from "@/lib/icons";
import { supabase } from "@/lib/supabase";
import { AdminChatBox } from "../ui/AdminChatBox";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgencyChat {
  id: string;
  name: string;
  logo_url?: string | null;
  unread_count: number;
  last_message?: string | null;
  last_message_time?: string | null;
}

// ─── Helper formatage date ────────────────────────────────────────────────────

function formatTime(d?: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function SuperuserChat() {
  const [agencies, setAgencies] = useState<AgencyChat[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<AgencyChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ── Chargement des agences avec infos de chat ─────────────────────────────
  const loadAgencies = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    const { data: allAgencies } = await supabase
      .from("agencies")
      .select("id, name, logo_url")
      .order("name");

    if (allAgencies) {
      const enriched = await Promise.all(
        allAgencies.map(async (a) => {
          const [lastMsgRes, unreadRes] = await Promise.all([
            supabase
              .from("admin_chat_messages")
              .select("message, attachment_name, created_at")
              .eq("agency_id", a.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("admin_chat_messages")
              .select("*", { count: "exact", head: true })
              .eq("agency_id", a.id)
              .eq("is_read", false)
              .eq("sender_role", "agency"),
          ]);

          return {
            ...a,
            unread_count: unreadRes.count || 0,
            last_message:
              lastMsgRes.data?.message ||
              (lastMsgRes.data?.attachment_name
                ? `📎 ${lastMsgRes.data.attachment_name}`
                : null),
            last_message_time: lastMsgRes.data?.created_at || null,
          };
        })
      );

      // Trier : non-lus d'abord, puis par dernière activité
      enriched.sort((a, b) => {
        if (a.unread_count && !b.unread_count) return -1;
        if (!a.unread_count && b.unread_count) return 1;
        if (a.last_message_time && b.last_message_time)
          return (
            new Date(b.last_message_time).getTime() -
            new Date(a.last_message_time).getTime()
          );
        if (a.last_message_time) return -1;
        return 1;
      });

      setAgencies(enriched);
    }
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  // ── Realtime : rechargement liste quand un message arrive ─────────────────
  useEffect(() => {
    const channel = supabase
      .channel("superuser-chat-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_chat_messages" },
        () => {
          loadAgencies(false);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadAgencies]);

  const filtered = agencies.filter(
    (a) => !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header page */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight">
          💬 Chat Agences
        </h1>
        <p className="text-[13px] text-[#86868B] mt-0.5">
          Conversations avec les administrateurs d'agence — fichiers et images supportés.
        </p>
      </div>

      {/* Layout 2 colonnes */}
      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* ── Liste agences ── */}
        <div className="w-[300px] shrink-0 bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col overflow-hidden">
          {/* Barre recherche */}
          <div className="p-3 border-b border-black/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une agence…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F5F5F7] border-0 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] outline-none"
              />
            </div>
          </div>

          {/* Liste */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#E5E5EA transparent" }}
          >
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-[#86868B]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="w-8 h-8 text-[#86868B]/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-[#86868B]">Aucune agence trouvée</p>
              </div>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAgency(a)}
                  className={`w-full flex items-center gap-3 p-3.5 transition-all border-b border-black/[0.04] text-left ${
                    selectedAgency?.id === a.id
                      ? "bg-[#1D1D1F] border-l-2 border-l-[#1D1D1F]"
                      : "hover:bg-[#F5F5F7]"
                  }`}
                >
                  {/* Logo / initiale */}
                  {a.logo_url ? (
                    <img
                      src={a.logo_url}
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                      alt=""
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] border border-black/5 flex items-center justify-center shrink-0">
                      <span
                        className={`text-[13px] font-semibold ${
                          selectedAgency?.id === a.id ? "text-white" : "text-[#1D1D1F]"
                        }`}
                      >
                        {a.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-[12px] font-semibold truncate ${
                          selectedAgency?.id === a.id ? "text-white" : "text-[#1D1D1F]"
                        }`}
                      >
                        {a.name}
                      </h4>
                      {a.last_message_time && (
                        <span
                          className={`text-[9px] font-medium shrink-0 ml-2 ${
                            selectedAgency?.id === a.id ? "text-white/60" : "text-[#86868B]"
                          }`}
                        >
                          {formatTime(a.last_message_time)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p
                        className={`text-[11px] truncate ${
                          selectedAgency?.id === a.id ? "text-white/70" : "text-[#86868B]"
                        }`}
                      >
                        {a.last_message || "Aucun message"}
                      </p>
                      {a.unread_count > 0 && (
                        <span className="ml-2 min-w-[18px] h-[18px] bg-[#5CB338] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shrink-0">
                          {a.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Zone chat ── */}
        <div className="flex-1 min-w-0 min-h-0 relative">
          {selectedAgency ? (
            <AdminChatBox
              agencyId={selectedAgency.id}
              agencyName={selectedAgency.name}
            />
          ) : (
            <div className="h-full bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] border border-black/5 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-[#86868B]" />
              </div>
              <p className="text-[13px] font-semibold text-[#86868B]">
                Sélectionnez une agence
              </p>
              <p className="text-[11px] text-[#86868B]/70 mt-1">
                pour démarrer ou continuer une conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
