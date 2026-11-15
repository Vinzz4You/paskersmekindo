
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAuth = createClient(
  supabaseUrl,
  supabaseAnonKey
);

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu"
      });
    }

    const token = authHeader.split(" ")[1];

    // Validasi token login
    const { data: userData, error: authError } =
      await supabaseAuth.auth.getUser(token);

    if (authError || !userData.user) {
      return res.status(401).json({
        success: false,
        message: "Sesi login tidak valid"
      });
    }

    // Periksa status dan role anggota
    const { data: member, error: memberError } =
      await supabaseAdmin
        .from("members")
        .select("id, full_name, username, role, is_active")
        .eq("auth_user_id", userData.user.id)
        .single();

    if (
      memberError ||
      !member ||
      !member.is_active ||
      member.role !== "member"
    ) {
      return res.status(403).json({
        success: false,
        message: "Akses khusus anggota aktif"
      });
    }

    // Ambil materi setelah akses berhasil diverifikasi
    const { data: materials, error: materialsError } =
      await supabaseAdmin
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });

    if (materialsError) {
      throw materialsError;
    }

    return res.status(200).json({
      success: true,
      member: {
        name: member.full_name,
        username: member.username
      },
      materials
    });

  } catch (error) {
    console.error("Materials API Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server"
    });
  }
}
