
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
  try {
    // Hanya GET dan POST yang diizinkan
    if (!["GET", "POST"].includes(req.method)) {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }

    // Periksa token login
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

    // Periksa apakah pengguna adalah admin aktif
    const { data: admin, error: adminError } =
      await adminSupabase
        .from("members")
        .select("role, is_active")
        .eq("auth_user_id", authData.user.id)
        .single();

    if (
      adminError ||
      !admin ||
      admin.role !== "admin" ||
      !admin.is_active
    ) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak"
      });
    }

    // GET: Ambil daftar anggota
    if (req.method === "GET") {
      const { data: members, error } =
        await adminSupabase
          .from("members")
          .select("id, full_name, username, role, is_active")
          .eq("role", "member")
          .order("full_name", { ascending: true });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        members
      });
    }

    // POST: Tambahkan anggota baru
    if (req.method === "POST") {
      const { full_name, username, password } = req.body || {};

      if (
        typeof full_name !== "string" ||
        typeof username !== "string" ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Data anggota tidak valid"
        });
      }

      const cleanName = full_name.trim();
      const cleanUsername = username.trim().toLowerCase();

      if (!cleanName || cleanName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Nama wajib diisi dan maksimal 100 karakter"
        });
      }

      if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanUsername)) {
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

      const email = `${cleanUsername}@anggota.local`;

      // Buat akun autentikasi
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

      // Simpan profil anggota
      const { error: insertError } =
        await adminSupabase
          .from("members")
          .insert({
            auth_user_id: newUser.user.id,
            full_name: cleanName,
            username: cleanUsername,
            role: "member",
            is_active: true
          });

      // Batalkan pembuatan akun jika penyimpanan profil gagal
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
    }

  } catch (error) {
    console.error("Members API Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server"
    });
  }
}
