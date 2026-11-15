
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Belum login"
      });
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        message: "Sesi tidak valid"
      });
    }

    const { data: member, error } = await adminSupabase
      .from("members")
      .select("full_name, username, role, is_active")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (error || !member || !member.is_active) {
      return res.status(403).json({
        success: false,
        message: "Akun tidak aktif atau tidak ditemukan"
      });
    }

    return res.status(200).json({
      success: true,
      member
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Kesalahan server"
    });
  }
}
