
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAdmin(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) return null;

  const { data: authData, error } =
    await supabase.auth.getUser(token);

  if (error || !authData.user) return null;

  const { data: admin } = await adminSupabase
    .from("members")
    .select("role, is_active")
    .eq("auth_user_id", authData.user.id)
    .single();

  if (!admin || admin.role !== "admin" || !admin.is_active) {
    return null;
  }

  return authData.user;
}

export default async function handler(req, res) {
  try {
    const admin = await verifyAdmin(req);

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak atau sesi tidak valid"
      });
    }

    // GET: Menampilkan daftar anggota
    if (req.method === "GET") {
      const { data: members, error } = await adminSupabase
        .from("members")
        .select("full_name, username, is_active")
        .eq("role", "member")
        .order("full_name", { ascending: true });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        members
      });
    }

    // POST: Membuat akun anggota
    if (req.method === "POST") {
      const { full_name, username, password } = req.body;

      if (
        typeof full_name !== "string" ||
        typeof username !== "string" ||
        typeof password !== "string" ||
        !full_name.trim() ||
        !username.trim() ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message: "Semua data wajib diisi"
        });
      }

      if (full_name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Nama maksimal 100 karakter"
        });
      }

      if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
        return res.status(400).json({
          success: false,
          message: "Format username tidak valid"
        });
      }

      if (password.length < 8 || password.length > 72) {
        return res.status(400).json({
          success: false,
          message: "Password harus 8-72 karakter"
        });
      }

      const cleanUsername = username.toLowerCase();
      const email = `${cleanUsername}@anggota.local`;

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
          full_name: full_name.trim(),
          username: cleanUsername,
          role: "member",
          is_active: true
        });

      if (insertError) {
        await adminSupabase.auth.admin.deleteUser(
          newUser.user.id
        );

        throw insertError;
      }

      return res.status(201).json({
        success: true,
        message: "Akun anggota berhasil dibuat"
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });

  } catch (error) {
    console.error("Members API error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });
  }
}
