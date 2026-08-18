// Edge Function : Suppression définitive du compte utilisateur
// Utilise le service_role pour avoir les droits admin sur auth.users
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Récupérer le token JWT de l'utilisateur depuis le header Authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Non autorisé : token manquant" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userToken = authHeader.replace("Bearer ", "");

    // 2. Client standard pour vérifier le JWT et identifier l'utilisateur
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${userToken}` } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Non autorisé : utilisateur invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Lire la raison optionnelle depuis le body
    let reason: string | null = null;
    try {
      const body = await req.json();
      reason = body?.reason ?? null;
    } catch { /* body optionnel */ }

    // 4. Client admin (service_role) — nécessaire pour supprimer depuis auth.users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 5. Journaliser la demande de suppression (traçabilité RGPD)
    await supabaseAdmin.from("account_deletion_requests").insert({
      user_id: user.id,
      email: user.email ?? "",
      reason,
      status: "processed",
      processed_at: new Date().toISOString(),
    });

    // 6. Supprimer les données liées (cascades FK devraient le faire, mais on force)
    await supabaseAdmin.from("bookings").delete().eq("user_id", user.id);
    await supabaseAdmin.from("agency_reviews").delete().eq("user_id", user.id);

    // 7. Supprimer le profil (si table profiles existe)
    await supabaseAdmin.from("profiles").delete().eq("id", user.id);

    // 8. Supprimer le compte auth — OPÉRATION IRRÉVERSIBLE
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Compte supprimé définitivement." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("delete-user-account error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
