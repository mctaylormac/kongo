/**
 * AgencyChat — Interface de messagerie d'agence avec sélection des contacts
 * - Permet à l'Admin Agence ('agency') de contacter le Superuser OU les membres de son agence (chef, caissier).
 * - Permet au Chef et au Caissier de contacter uniquement les membres de leur agence (sans accès au Superuser).
 */
import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2, Search, Building2, Users } from "@/lib/icons";
import { ShieldCheck, User, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { AdminChatBox } from "../ui/AdminChatBox";

interface Contact {
  id: string;
  name: string;
  role: "superuser" | "agency" | "chef" | "cashier";
  unread_count?: number;
}

export function AgencyChat() {
  const { userRole, agencyId: contextAgencyId, setAgencyId } = useAppState();
  const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(contextAgencyId);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const activeAgencyId = currentAgencyId || contextAgencyId;

  // ── Charger l'agence & la liste des contacts ────────────────────────────────
  const loadAgencyAndContacts = useCallback(async () => {
    setLoading(true);
    let targetAgencyId = contextAgencyId;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Si pas d'agency_id dans le contexte, chercher dans profiles
    if (!targetAgencyId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.agency_id) {
        targetAgencyId = profile.agency_id;
        setAgencyId(profile.agency_id);
      }
    }

    setCurrentAgencyId(targetAgencyId);

    if (targetAgencyId) {
      // 1. Nom agence
      const { data: agencyData } = await supabase
        .from("agencies")
        .select("name")
        .eq("id", targetAgencyId)
        .maybeSingle();
      if (agencyData?.name) setAgencyName(agencyData.name);

      const contactList: Contact[] = [];

      // 2. Si le rôle est 'agency' (Admin Agence), ajouter l'Administration Centrale (Superuser)
      if (userRole === "superuser" || userRole === "agency") {
        // Compter les messages non lus du superuser
        const { count: superuserUnread } = await supabase
          .from("admin_chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("agency_id", targetAgencyId)
          .eq("sender_role", "superuser")
          .eq("is_read", false);

        contactList.push({
          id: "superuser-contact",
          name: "Administration Central (Superuser)",
          role: "superuser",
          unread_count: superuserUnread || 0,
        });
      }

      // 3. Charger les membres de l'agence (autres comptes agency, chef, cashier)
      const { data: members } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("agency_id", targetAgencyId)
        .neq("id", user.id)
        .in("role", ["agency", "chef", "cashier"])
        .order("full_name");

      if (members) {
        for (const member of members) {
          const { count: unread } = await supabase
            .from("admin_chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("agency_id", targetAgencyId)
            .eq("sender_id", member.id)
            .eq("is_read", false);

          contactList.push({
            id: member.id,
            name: member.full_name || getRoleLabel(member.role),
            role: member.role as any,
            unread_count: unread || 0,
          });
        }
      }

      setContacts(contactList);

      // Sélectionner par défaut le premier contact s'il n'y en a pas encore
      if (contactList.length > 0 && !selectedContact) {
        setSelectedContact(contactList[0]);
      }
    }

    setLoading(false);
  }, [contextAgencyId, userRole, setAgencyId]);

  useEffect(() => {
    loadAgencyAndContacts();
  }, [loadAgencyAndContacts]);

  // ── Écoute Realtime pour la mise à jour des contacts et badges ─────────────
  useEffect(() => {
    if (!activeAgencyId) return;
    const channel = supabase
      .channel(`agency-contacts-${activeAgencyId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "admin_chat_messages",
        filter: `agency_id=eq.${activeAgencyId}`,
      }, () => {
        loadAgencyAndContacts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeAgencyId, loadAgencyAndContacts]);

  function getRoleLabel(role: string): string {
    switch (role) {
      case "superuser": return "Admin Central";
      case "agency": return "Admin Agence";
      case "chef": return "Chef d'Escale";
      case "cashier": return "Caissier";
      default: return role;
    }
  }

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case "superuser": return "bg-[#5CB338]/10 text-[#5CB338] border-[#5CB338]/20";
      case "agency": return "bg-blue-50 text-blue-600 border-blue-200";
      case "chef": return "bg-amber-50 text-amber-600 border-amber-200";
      case "cashier": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      default: return "bg-gray-50 text-gray-600";
    }
  }

  // Filtrer la liste des contacts par recherche
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getRoleLabel(c.role).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Cas : pas d'agence liée ───────────────────────────────────────────────
  if (!loading && !activeAgencyId) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight">
            💬 Messagerie d'Agence
          </h1>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <MessageSquare className="w-10 h-10 text-[#86868B]/40 mb-3" />
          <h2 className="text-[15px] font-semibold text-[#86868B] mb-1">
            Aucune agence associée
          </h2>
          <p className="text-[13px] text-[#86868B]/70">
            Votre compte n'est pas encore lié à une agence partenaire.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight">
            💬 Messagerie d'Agence
          </h1>
          <p className="text-[12px] text-[#86868B] mt-0.5">
            {agencyName ? `${agencyName} — ` : ""}
            Échangez avec votre équipe et les responsables d'agence en toute sécurité.
          </p>
        </div>
      </div>

      {/* Main Grid 2 colonnes */}
      {loading ? (
        <div className="flex-1 bg-white rounded-2xl border border-black/5 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#86868B]" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
          {/* ── Colonne Gauche : Contacts d'Agence ── */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden shadow-sm">
            {/* Barre de recherche */}
            <div className="p-3.5 border-b border-black/5 bg-[#F5F5F7]/70">
              <div className="relative">
                <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-black/10 rounded-xl pl-9 pr-3 py-2 text-[13px] placeholder:text-[#86868B] focus:outline-none focus:border-[#1D1D1F] transition-all"
                />
              </div>
            </div>

            {/* Liste des contacts */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: "thin" }}>
              {filteredContacts.length === 0 ? (
                <div className="py-10 text-center text-[#86868B] text-xs">
                  Aucun membre trouvé
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  const isSuperuser = contact.role === "superuser";
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                        isSelected
                          ? "bg-[#1D1D1F] text-white shadow-sm"
                          : "hover:bg-[#F5F5F7] text-[#1D1D1F]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white/15 text-white"
                          : isSuperuser
                          ? "bg-[#5CB338]/10 text-[#5CB338]"
                          : "bg-[#F5F5F7] text-[#86868B]"
                      }`}>
                        {isSuperuser ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-[13px] font-semibold truncate ${isSelected ? "text-white" : "text-[#1D1D1F]"}`}>
                            {contact.name}
                          </p>
                          {contact.unread_count && contact.unread_count > 0 ? (
                            <span className="w-5 h-5 bg-[#FF3B30] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                              {contact.unread_count > 99 ? "99+" : contact.unread_count}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-md border ${
                            isSelected ? "bg-white/10 text-white/90 border-white/20" : getRoleBadgeColor(contact.role)
                          }`}>
                            {getRoleLabel(contact.role)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Colonne Droite : Chat ── */}
          <div className="col-span-12 md:col-span-8 min-h-0">
            {selectedContact ? (
              <AdminChatBox
                agencyId={activeAgencyId ?? undefined}
                targetUserId={selectedContact.role === "superuser" ? undefined : selectedContact.id}
                targetRole={selectedContact.role}
                targetName={selectedContact.name}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm h-full flex flex-col items-center justify-center text-center p-8 text-[#86868B]">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Sélectionnez un contact pour démarrer la discussion.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
