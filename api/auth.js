
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
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi"
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: "Format username tidak valid"
      });
    }

    // Cari data anggota berdasarkan username
    const { data: member, error: memberError } =
      await adminSupabase
        .from("members")
        .select(
          "auth_user_id, full_name, username, role, is_active"
        )
        .eq("username", cleanUsername)
        .single();

    if (memberError || !member) {
      console.error("MEMBER LOOKUP ERROR:", memberError?.message);

      return res.status(401).json({
        success: false,
        message: "Username atau password salah"
      });
    }

    if (
      !member.is_active ||
      !["admin", "member"].includes(member.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Akun tidak aktif atau tidak memiliki akses"
      });
    }

    // Ambil email dari akun Auth
    const { data: userData, error: userError } =
      await adminSupabase.auth.admin.getUserById(
        member.auth_user_id
      );

    if (userError || !userData.user?.email) {
      console.error("AUTH USER ERROR:", userError?.message);

      return res.status(401).json({
        success: false,
        message: "Akun autentikasi tidak ditemukan"
      });
    }

    // Login menggunakan email asli
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password
      });

    if (error || !data.user || !data.session) {
      console.error(
        "SUPABASE LOGIN ERROR:",
        error?.message
      );

      return res.status(401).json({
        success: false,
        message: "Login gagal. Periksa Runtime Logs Vercel."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      user: data.user,
      member: {
        full_name: member.full_name,
        username: member.username,
        role: member.role,
        is_active: member.is_active
      },
      session: data.session
    });

  } catch (error) {
    console.error("LOGIN SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });
  }
}
