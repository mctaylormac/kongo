/**
 * AdminChatBox — Composant de chat partagé entre superuser et admin d'agence KONGO
 * Inspiré du chat KINTU, adapté aux conventions KONGO (profiles, agencies, rôles)
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
// Icônes disponibles dans le barrel icons.ts du projet
import { FileText, Download, Loader2, MessageSquare, ChevronDown } from "@/lib/icons";
// Icônes non présentes dans icons.ts : import direct lucide-react
import { Send, Paperclip, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  agency_id: string;
  sender_id: string;
  sender_role: "agency" | "superuser" | "chef" | "cashier";
  sender_name: string;
  recipient_id: string | null;
  recipient_role: "superuser" | "agency" | "chef" | "cashier" | "agency_internal" | null;
  message: string | null;
  attachment_url: string | null;
  attachment_type: "image" | "document" | null;
  is_read: boolean;
  created_at: string;
  attachment_name: string | null;
}

interface AdminChatBoxProps {
  /** ID de l'agence cible. Pour l'admin d'agence, omis (déduit du profil). */
  agencyId?: string;
  /** Nom de l'agence affiché dans le header (superuser uniquement). */
  agencyName?: string;
  /** ID de l'utilisateur destinataire (pour chat avec membre d'agence spécifique) */
  targetUserId?: string;
  /** Rôle de la cible : 'superuser', 'agency', 'chef', 'cashier' */
  targetRole?: "superuser" | "agency" | "chef" | "cashier" | "agency_internal";
  /** Nom du destinataire affiché dans le header */
  targetName?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const hm = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return hm;
  if (d.toDateString() === yesterday.toDateString()) return `Hier ${hm}`;
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} ${hm}`;
}

function getRoleBadge(role: string) {
  switch (role) {
    case "superuser":
      return <span className="ml-1.5 text-[#5CB338] font-bold">• Admin Central</span>;
    case "agency":
      return <span className="ml-1.5 text-blue-600 font-bold">• Admin Agence</span>;
    case "chef":
      return <span className="ml-1.5 text-amber-600 font-bold">• Chef d'Escale</span>;
    case "cashier":
      return <span className="ml-1.5 text-emerald-600 font-bold">• Caissier</span>;
    default:
      return null;
  }
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function AdminChatBox({ agencyId: propAgencyId, agencyName, targetUserId, targetRole, targetName }: AdminChatBoxProps) {
  const { userRole, agencyId: contextAgencyId, setAgencyId } = useAppState();

  const [resolvedAgencyId, setResolvedAgencyId] = useState<string | null>(propAgencyId ?? contextAgencyId ?? null);
  const senderRole = (userRole === "superuser" ? "superuser" : (userRole || "agency")) as "agency" | "superuser" | "chef" | "cashier";

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [senderName, setSenderName] = useState<string>("Utilisateur");

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Résolution dynamique de l'agency_id & de l'utilisateur ─────────────────
  useEffect(() => {
    const resolveAgencyAndUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      if (propAgencyId) {
        setResolvedAgencyId(propAgencyId);
        return;
      }
      if (contextAgencyId) {
        setResolvedAgencyId(contextAgencyId);
        return;
      }

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("agency_id")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.agency_id) {
          setResolvedAgencyId(profile.agency_id);
          setAgencyId(profile.agency_id);
        }
      }
    };
    resolveAgencyAndUser();
  }, [propAgencyId, contextAgencyId, setAgencyId]);

  const effectiveAgencyId = resolvedAgencyId;

  // ── Fetch nom de l'expéditeur ────────────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.full_name) setSenderName(data.full_name);
      else setSenderName(senderRole === "superuser" ? "Administration KONGO" : "Membre Agence");
    };
    loadProfile();
  }, [senderRole]);

  // ── Scroll bas ───────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // ── Chargement messages ──────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!effectiveAgencyId) {
      setLoading(false);
      return;
    }
    let query = supabase
      .from("admin_chat_messages")
      .select("*")
      .eq("agency_id", effectiveAgencyId)
      .order("created_at", { ascending: true })
      .limit(400);

    // Pour le superuser ou quand on discute spécifiquement avec le Superuser
    if (userRole === "superuser" || targetRole === "superuser") {
      query = query.or("sender_role.eq.superuser,recipient_role.eq.superuser");
    }
    // Pour chef et cashier (ne jamais voir les échanges superuser)
    else if (["chef", "cashier"].includes(userRole)) {
      query = query.neq("sender_role", "superuser").or("recipient_role.is.null,recipient_role.neq.superuser");
      if (targetUserId && currentUserId) {
        query = query.or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId}),recipient_id.is.null`);
      }
    }
    // Pour l'admin agence qui discute avec un membre spécifique de l'agence
    else if (targetUserId && currentUserId) {
      query = query.or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId}),and(sender_role.eq.agency,recipient_role.neq.superuser),recipient_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("AdminChatBox fetchMessages error:", error);
      toast.error(`Erreur chargement messages: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data) {
      setMessages(data as ChatMessage[]);
      // Marquer les messages des autres membres comme lus
      if (currentUserId) {
        const unreadIds = data
          .filter((m) => !m.is_read && m.sender_id !== currentUserId)
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("admin_chat_messages")
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      }
    }
    setLoading(false);
    setTimeout(scrollToBottom, 80);
  }, [effectiveAgencyId, userRole, targetRole, targetUserId, currentUserId, scrollToBottom]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Realtime Instantané ───────────────────────────────────────────────────
  useEffect(() => {
    if (!effectiveAgencyId) return;

    const channel = supabase
      .channel(`admin-chat-${effectiveAgencyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_chat_messages",
          filter: `agency_id=eq.${effectiveAgencyId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as ChatMessage;
            // Chef et caissier ne voient pas les messages superuser
            if (["chef", "cashier"].includes(userRole) && (newMsg.sender_role === "superuser" || newMsg.recipient_role === "superuser")) {
              return;
            }
            // Superuser ne voit pas les messages entre membres d'agence
            if (userRole === "superuser" && newMsg.sender_role !== "superuser" && newMsg.recipient_role !== "superuser") {
              return;
            }

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 50);

            if (currentUserId && newMsg.sender_id !== currentUserId) {
              supabase
                .from("admin_chat_messages")
                .update({ is_read: true })
                .eq("id", newMsg.id)
                .then();
            }
          } else {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveAgencyId, userRole, currentUserId, fetchMessages, scrollToBottom]);

  // ── Envoi message ────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !effectiveAgencyId) {
      if (!effectiveAgencyId) toast.error("Aucune agence associée pour envoyer le message.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Utilisateur non connecté.");
      return;
    }
    setSending(true);

    const calculatedRecipientRole = targetRole || (senderRole === "superuser" ? "agency" : "agency_internal");

    const { error } = await supabase.from("admin_chat_messages").insert({
      agency_id: effectiveAgencyId,
      sender_id: user.id,
      sender_role: senderRole,
      sender_name: senderName,
      recipient_id: targetUserId || null,
      recipient_role: calculatedRecipientRole,
      message: newMessage.trim(),
    });
    if (error) {
      toast.error(`Erreur d'envoi: ${error.message}`);
      console.error("Chat send error:", error);
    } else {
      setNewMessage("");
      await fetchMessages();
    }
    setSending(false);
  };

  // ── Upload fichier ───────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveAgencyId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    const isImage = file.type.startsWith("image/");
    const path = `${effectiveAgencyId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("kongo-chat-attachments")
      .upload(path, file);

    if (uploadError) {
      toast.error("Erreur lors de l'upload du fichier");
      console.error(uploadError);
    } else {
      const { data: urlData } = supabase.storage
        .from("kongo-chat-attachments")
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("admin_chat_messages").insert({
        agency_id: effectiveAgencyId,
        sender_id: user.id,
        sender_role: senderRole,
        sender_name: senderName,
        message: null,
        attachment_url: urlData.publicUrl,
        attachment_type: isImage ? "image" : "document",
        attachment_name: file.name,
      });
      if (insertError) {
        toast.error("Erreur lors de l'envoi de la pièce jointe");
      } else {
        await fetchMessages();
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Keyboard shortcut ────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  // ── Cas sans agence ──────────────────────────────────────────────────────
  if (!effectiveAgencyId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-[#86868B]">
        <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Aucune agence sélectionnée.</p>
        <p className="text-xs mt-1 opacity-60">
          {senderRole === "superuser"
            ? "Sélectionnez une agence pour démarrer le chat."
            : "Votre compte n'est pas lié à une agence."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-black/5 bg-[#F5F5F7]/70 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight truncate">
            {senderRole === "superuser"
              ? `Chat avec ${agencyName || "l'agence"}`
              : "Canal de discussion Agence & Administration"}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-[#5CB338]" />
            <span className="text-[10px] font-semibold text-[#86868B] uppercase tracking-widest">
              Canal sécurisé
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5CB338]/10 border border-[#5CB338]/20">
          <span className="w-1.5 h-1.5 bg-[#5CB338] rounded-full" />
          <span className="text-[10px] font-bold text-[#5CB338] uppercase tracking-wider">En ligne</span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 relative"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#E5E5EA transparent" }}
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[#86868B]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F5F7] border border-black/5 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#86868B]" />
            </div>
            <p className="text-sm font-medium text-[#86868B]">Aucun message</p>
            <p className="text-xs text-[#86868B]/70 text-center max-w-[220px]">
              {senderRole === "superuser"
                ? "Envoyez un message à cette agence."
                : "Démarrez une discussion avec votre équipe et l'administration."}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUserId ? msg.sender_id === currentUserId : msg.sender_role === senderRole;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[72%]">
                  {/* Nom expéditeur & rôle */}
                  <p
                    className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${
                      isMe ? "text-right text-[#86868B]" : "text-[#86868B]"
                    }`}
                  >
                    {msg.sender_name}
                    {getRoleBadge(msg.sender_role)}
                  </p>

                  {/* Bulle */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isMe
                        ? "bg-[#1D1D1F] text-white rounded-br-md"
                        : "bg-[#F5F5F7] text-[#1D1D1F] border border-black/5 rounded-bl-md"
                    }`}
                  >
                    {msg.message && (
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    )}

                    {/* Image */}
                    {msg.attachment_type === "image" && msg.attachment_url && (
                      <div className="mt-1">
                        <img
                          src={msg.attachment_url}
                          alt={msg.attachment_name || "Image"}
                          className="max-w-full rounded-xl max-h-[200px] object-cover cursor-pointer"
                          onClick={() => window.open(msg.attachment_url!, "_blank")}
                        />
                        {msg.attachment_name && (
                          <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-[#86868B]"}`}>
                            {msg.attachment_name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Document */}
                    {msg.attachment_type === "document" && msg.attachment_url && (
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 mt-1 p-2 rounded-lg transition-colors ${
                          isMe
                            ? "bg-white/10 hover:bg-white/20"
                            : "bg-black/5 hover:bg-black/10"
                        }`}
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium truncate flex-1">
                          {msg.attachment_name || "Document"}
                        </span>
                        <Download className="w-3.5 h-3.5 shrink-0 opacity-50" />
                      </a>
                    )}
                  </div>

                  {/* Horodatage */}
                  <p
                    className={`text-[9px] font-medium text-[#86868B]/60 mt-1 ${
                      isMe ? "text-right" : ""
                    }`}
                  >
                    {formatTime(msg.created_at)}
                    {isMe && msg.is_read && (
                      <span className="ml-1 text-[#5CB338]">✓ lu</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bouton scroll bas */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-md hover:bg-[#F5F5F7] transition-colors z-10"
        >
          <ChevronDown className="w-4 h-4 text-[#1D1D1F]" />
        </button>
      )}

      {/* ── Zone saisie ── */}
      <div className="px-4 py-3 border-t border-black/5 bg-[#F5F5F7]/40">
        {uploading && (
          <div className="flex items-center gap-2 text-xs font-medium text-[#86868B] mb-2 px-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Envoi du fichier en cours…
          </div>
        )}
        <div className="flex items-end gap-2">
          {/* Fichier */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 rounded-xl bg-black/5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/10 transition-colors shrink-0 disabled:opacity-30"
            title="Joindre un fichier ou une image"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>

          {/* Texte */}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message…"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-black/5 text-[13px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:border-[#1D1D1F]/20 resize-none max-h-[120px] transition-colors"
            style={{ minHeight: "42px" }}
          />

          {/* Envoyer */}
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-2.5 rounded-xl bg-[#1D1D1F] text-white hover:bg-[#3A3A3C] transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
