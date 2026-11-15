
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi"
      });
    }

    const email = `${username.trim().toLowerCase()}@anggota.local`;

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login berhasil",
      user: data.user,
      session: data.session
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });
  }
}
