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
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu"
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

    const { data: admin } = await adminSupabase
      .from("members")
      .select("role, is_active")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (!admin || admin.role !== "admin" || !admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak"
      });
    }

    const { full_name, username, password } = req.body;

    if (!full_name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Semua data wajib diisi"
      });
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Format username tidak valid"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 8 karakter"
      });
    }

    const email = `${username.toLowerCase()}@anggota.local`;

    const { data: newUser, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (createError) {
      return res.status(400).json({
        success: false,
        message: createError.message
      });
    }

    const { error: insertError } = await adminSupabase
      .from("members")
      .insert({
        auth_user_id: newUser.user.id,
        full_name,
        username: username.toLowerCase(),
        role: "member",
        is_active: true
      });

    if (insertError) {
      await adminSupabase.auth.admin.deleteUser(
        newUser.user.id
      );

      return res.status(400).json({
        success: false,
        message: insertError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: "Akun anggota berhasil dibuat"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });
  }
}
