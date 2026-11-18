// LIVET en Cloudflare: sirve la web (carpeta web/) y el enlace del calendario /cal/<token>.ics.
// Se publica solo: cada push a main que no diga [skip ci] lo despliega Cloudflare (Workers Builds).
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname.startsWith("/cal/")) {
      const t = u.pathname.slice(5).replace(/\.ics$/, "");
      if (!/^[0-9a-f]{48}$/.test(t)) return new Response("Enlace inválido", { status: 404 });
      const r = await fetch("https://cwizubypvbscpyfebrlc.supabase.co/functions/v1/cal?t=" + t);
      return new Response(r.body, { status: r.status, headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "no-cache, max-age=0", "content-disposition": 'inline; filename="LIVET.ics"' } });
    }
    return env.ASSETS.fetch(req);
  }
};
