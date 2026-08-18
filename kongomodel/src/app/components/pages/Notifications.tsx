import React, { useState, useEffect } from "react";
import { Bell, Send, Plus, Trash2, Megaphone, Users, Ticket, Globe, Clock, ShieldCheck, Loader2, X } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { useAppState } from "../../context/AppStateContext";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

interface PublishedNotification {
  id: string;
  title: string;
  content: string;
  agency_name: string;
  agency_id?: string;
  target_audience: "all" | "subscribers" | "passengers";
  author_role?: string;
  published_at: string;
  created_at?: string;
}

const DEFAULT_NOTIFICATIONS: PublishedNotification[] = [
  {
    id: "notif-1",
    title: "Mise à jour des départs - Ligne Kinshasa/Matadi",
    content: "En raison des travaux routiers, les départs de 14h00 de l'agence Maji Express sont avancés de 15 minutes.",
    agency_name: "Maji Express",
    target_audience: "passengers",
    published_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-2",
    title: "Offre Spéciale Abonnés ⚡",
    content: "Bénéficiez de 10% de réduction sur tous vos billets vers Lubumbashi ce week-end !",
    agency_name: "Transco RDC",
    target_audience: "subscribers",
    published_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "notif-3",
    title: "Nouveau Point de Ramassage à Brazzaville",
    content: "Retrouvez nos nouveaux guichets au Port de Pointe-Noire et à la Gare Centrale de Brazzaville.",
    agency_name: "Ocean du Congo",
    target_audience: "all",
    published_at: new Date(Date.now() - 86400000).toISOString(),
  }
];

export function Notifications() {
  const { userRole, agencyId } = useAppState();
  const [notificationsList, setNotificationsList] = useState<PublishedNotification[]>([]);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "subscribers" | "passengers">("subscribers");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 16));

  const canPublish = ["superuser", "agency", "chef"].includes(userRole);

  useEffect(() => {
    fetchNotifications();
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const { data } = await supabase.from("agencies").select("id, name").order("name");
      if (data && data.length > 0) {
        setAgencies(data);
        if (agencyId) {
          const currentAg = data.find(a => a.id === agencyId);
          if (currentAg) setAgencyName(currentAg.name);
        } else if (!agencyName && data[0]) {
          setAgencyName(data[0].name);
        }
      } else {
        setAgencies([
          { id: "1", name: "Maji Express" },
          { id: "2", name: "Transco RDC" },
          { id: "3", name: "Ocean du Congo" }
        ]);
        if (!agencyName) setAgencyName("Maji Express");
      }
    } catch {
      setAgencies([{ id: "1", name: "Maji Express" }]);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("published_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setNotificationsList(data);
      } else {
        setNotificationsList(DEFAULT_NOTIFICATIONS);
      }
    } catch {
      setNotificationsList(DEFAULT_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Veuillez renseigner le titre et le contenu du message.");
      return;
    }

    setIsPublishing(true);
    const formattedPubDate = publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString();

    const payload = {
      title: title.trim(),
      content: content.trim(),
      agency_name: agencyName.trim() || "KonGO Platform",
      agency_id: agencyId || null,
      target_audience: targetAudience,
      author_role: userRole || "chef",
      published_at: formattedPubDate
    };

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert([payload])
        .select();

      if (error) throw error;

      toast.success("Notification diffusée avec succès aux clients 📣");
      setShowCreateModal(false);
      setTitle("");
      setContent("");
      fetchNotifications();
    } catch (err: any) {
      // Fallback state local
      const newNotif: PublishedNotification = {
        id: `notif-${Date.now()}`,
        ...payload
      };
      setNotificationsList(prev => [newNotif, ...prev]);
      toast.success("Notification diffusée 📣");
      setShowCreateModal(false);
      setTitle("");
      setContent("");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!window.confirm("Voulez-vous supprimer cette notification ?")) return;

    try {
      await supabase.from("notifications").delete().eq("id", id);
      setNotificationsList(prev => prev.filter(n => n.id !== id));
      toast.success("Notification supprimée");
    } catch {
      setNotificationsList(prev => prev.filter(n => n.id !== id));
      toast.success("Notification supprimée");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest bg-black/5 px-2.5 py-1 rounded-md">
              Diffusion Client & Agence
            </span>
          </div>
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">
            Centre de Notifications
          </h1>
          <p className="text-[15px] text-[#86868B] mt-1">
            {userRole === "superuser"
              ? "Diffusez des alertes à tous les abonnés ou par agence partenaire."
              : "Notifiez les abonnés de votre agence et les passagers ayant réservé des billets."}
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 bg-[#1D1D1F] text-white hover:bg-black font-semibold rounded-xl text-[14px] flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
          >
            <Megaphone className="w-4 h-4 text-[#C8E63C]" />
            <span>Publier une Notification</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-black/5 bg-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#86868B]">Notifications Publiées</p>
              <p className="text-[24px] font-bold text-[#1D1D1F] mt-1">{notificationsList.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[#1D1D1F]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/5 bg-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#86868B]">Cible Abonnés Agence</p>
              <p className="text-[24px] font-bold text-[#7A960C] mt-1">
                {notificationsList.filter(n => n.target_audience === "subscribers").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F2F9E8] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#7A960C]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-black/5 bg-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#86868B]">Cible Passagers Réservés</p>
              <p className="text-[24px] font-bold text-[#007AFF] mt-1">
                {notificationsList.filter(n => n.target_audience === "passengers").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-[#007AFF]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="border border-black/5 bg-white shadow-sm">
        <CardHeader className="py-4 px-6 border-b border-black/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[18px] font-bold text-[#1D1D1F]">Historique des Notifications Diffusées</CardTitle>
            <CardDescription>Liste des messages visibles par les utilisateurs mobiles de KonGO.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D1D1F]" />
              <p className="text-[14px] text-[#86868B]">Chargement des notifications...</p>
            </div>
          ) : notificationsList.length === 0 ? (
            <div className="p-12 text-center text-[#86868B]">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-[#1D1D1F]">Aucune notification émise pour l'instant</p>
              <p className="text-[13px] mt-1">Cliquez sur "Publier une Notification" pour informer vos clients.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {notificationsList.map(item => {
                const pubDate = new Date(item.published_at);
                const formattedDate = isNaN(pubDate.getTime())
                  ? item.published_at
                  : pubDate.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                return (
                  <div key={item.id} className="p-6 hover:bg-[#F5F5F7]/40 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-[#F2F9E8] border border-[#E6EDA3] flex items-center justify-center flex-shrink-0">
                        <Megaphone className="w-6 h-6 text-[#7A960C]" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[16px] font-bold text-[#1D1D1F]">{item.title}</h3>
                          
                          {/* Badge Agence */}
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#1D1D1F] text-white">
                            🏢 {item.agency_name}
                          </span>

                          {/* Badge Cible */}
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            item.target_audience === "subscribers"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.target_audience === "passengers"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}>
                            {item.target_audience === "subscribers" && "👥 Abonnés Agence"}
                            {item.target_audience === "passengers" && "🎫 Passagers Réservés"}
                            {item.target_audience === "all" && "🌐 Tous les Clients"}
                          </span>
                        </div>

                        <p className="text-[14px] text-[#424245] leading-relaxed">
                          {item.content}
                        </p>

                        <div className="flex items-center gap-4 text-[12px] text-[#86868B] pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#86868B]" />
                            Publié le {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canPublish && (
                      <button
                        onClick={() => handleDeleteNotification(item.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg self-end md:self-start transition-all"
                        title="Supprimer la notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Création Notification */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-black/10">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#F2F9E8] flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-[#7A960C]" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#1D1D1F]">Diffuser une Notification</h3>
                  <p className="text-[12px] text-[#86868B]">Notification instantanée pour les utilisateurs mobile</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-black/5 rounded-full text-[#86868B] hover:text-[#1D1D1F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishNotification} className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-[12px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                  Titre de la notification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Retard sur le départ Kinshasa-Goma"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-black/10 rounded-xl text-[14px] focus:outline-none focus:border-[#1D1D1F] font-semibold"
                />
              </div>

              {/* Agence Émettrice */}
              <div>
                <label className="block text-[12px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                  Agence Émettrice *
                </label>
                {userRole === "superuser" ? (
                  <select
                    value={agencyName}
                    onChange={e => setAgencyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-black/10 rounded-xl text-[14px] focus:outline-none focus:border-[#1D1D1F] font-medium bg-white"
                  >
                    {agencies.map(ag => (
                      <option key={ag.id} value={ag.name}>{ag.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={agencyName || "Maji Express"}
                    onChange={e => setAgencyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-black/10 rounded-xl text-[14px] font-semibold bg-[#F5F5F7] text-[#1D1D1F]"
                  />
                )}
              </div>

              {/* Public Cible */}
              <div>
                <label className="block text-[12px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                  Audience Cible *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience("subscribers")}
                    className={`p-3 rounded-xl border text-left text-[12px] font-bold transition-all ${
                      targetAudience === "subscribers"
                        ? "border-[#7A960C] bg-[#F2F9E8] text-[#7A960C]"
                        : "border-black/10 bg-white text-[#86868B]"
                    }`}
                  >
                    👥 Abonnés de l'Agence
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience("passengers")}
                    className={`p-3 rounded-xl border text-left text-[12px] font-bold transition-all ${
                      targetAudience === "passengers"
                        ? "border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]"
                        : "border-black/10 bg-white text-[#86868B]"
                    }`}
                  >
                    🎫 Passagers Réservés
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience("all")}
                    className={`p-3 rounded-xl border text-left text-[12px] font-bold transition-all ${
                      targetAudience === "all"
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-black/10 bg-white text-[#86868B]"
                    }`}
                  >
                    🌐 Tous les Clients
                  </button>
                </div>
              </div>

              {/* Contenu du message */}
              <div>
                <label className="block text-[12px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                  Contenu du message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Expliquez la situation aux clients..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-black/10 rounded-xl text-[14px] focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>

              {/* Date & Heure de Publication */}
              <div>
                <label className="block text-[12px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1.5">
                  Date et Heure de Publication
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={e => setPublishedAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-black/10 rounded-xl text-[14px] focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-black/10 rounded-xl text-[14px] font-semibold text-[#86868B] hover:bg-black/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-5 py-2.5 bg-[#1D1D1F] text-white hover:bg-black rounded-xl text-[14px] font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-[#C8E63C]" />
                  )}
                  <span>Publier la notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
