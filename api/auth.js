
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
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
        message: "Username dan password wajib diisi"
      });
    }

    const { data: member, error: memberError } =
      await supabaseAdmin
        .from("members")
        .select("auth_user_id, full_name, username, role, is_active")
        .ilike("username", username.trim())
        .maybeSingle();

    if (
      memberError ||
      !member ||
      !member.is_active ||
      !member.auth_user_id
    ) {
      return res.status(401).json({
        message: "Username atau password salah"
      });
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(
        member.auth_user_id
      );

    if (authError || !authData.user?.email) {
      return res.status(401).json({
        message: "Akun tidak dapat digunakan"
      });
    }

    const { data: loginData, error: loginError } =
      await supabaseAuth.auth.signInWithPassword({
        email: authData.user.email,
        password
      });

    if (loginError) {
      return res.status(401).json({
        message: "Username atau password salah"
      });
    }

    return res.status(200).json({
      message: "Login berhasil",
      session: loginData.session,
      member: {
        full_name: member.full_name,
        username: member.username,
        role: member.role
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: "Terjadi kesalahan pada server"
    });
  }
}
