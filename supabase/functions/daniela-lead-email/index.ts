const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "pedro.acn@consultant.com";
const FROM_EMAIL = "Daniela <hello@searcheraa.com>";

function adminHtml(name: string, email: string, phone: string, time: string) {
  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;">
  <h2 style="color:#1e293b;margin:0 0 8px;">🔔 New Daniela Lead</h2>
  <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Someone just started chatting with Daniela.</p>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:80px;">Name</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;">${name}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Email</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td></tr>
    <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Phone</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;">${phone}</td></tr>
    <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Time</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${time}</td></tr>
  </table>
</div>`;
}

function leadHtml(name: string) {
  return `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#1e293b;font-size:24px;margin:0 0 4px;">Thanks for chatting, ${name}! 🎉</h1>
    <p style="color:#64748b;font-size:15px;margin:0;">Great connecting with you.</p>
  </div>
  <p style="color:#334155;font-size:15px;line-height:1.7;">
    Daniela here! It was awesome chatting with you about growing your organic traffic.
    I wanted to follow up with a few things that might help:
  </p>
  <ul style="color:#334155;font-size:14px;line-height:1.8;padding-left:20px;">
    <li><strong>AI-powered SEO audits</strong> — get a full picture of your site's health</li>
    <li><strong>AEO optimization</strong> — make sure AI search engines cite your brand</li>
    <li><strong>Content that ranks</strong> — we generate, optimize & publish for you</li>
  </ul>
  <div style="text-align:center;margin:28px 0 16px;">
    <a href="https://searcheraa.com" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#14b8a6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;">
      Explore Searchera →
    </a>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">
    You're receiving this because you chatted with Daniela on Searchera.<br/>
    We won't spam you — promise! 💙
  </p>
</div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, phone } = await req.json();
    if (!name || !email || !phone) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toLocaleString("en-GB", { timeZone: "Europe/Lisbon" });

    // Send both emails in parallel
    const [adminRes, leadRes] = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [ADMIN_EMAIL],
          subject: `🔔 New lead: ${name}`,
          html: adminHtml(name, email, phone, now),
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: `Great chatting with you, ${name}! 🚀`,
          html: leadHtml(name),
        }),
      }),
    ]);

    const adminOk = adminRes.ok;
    const leadOk = leadRes.ok;
    if (!adminOk) console.error("Admin email failed:", await adminRes.text());
    if (!leadOk) console.error("Lead email failed:", await leadRes.text());

    return new Response(JSON.stringify({ admin: adminOk, lead: leadOk }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("daniela-lead-email error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
