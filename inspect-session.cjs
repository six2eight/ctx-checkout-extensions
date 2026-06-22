const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.session.findMany({}).then(async (sessions) => {
  if (!sessions.length) { console.log("NO SESSIONS in DB"); process.exit(0); }
  for (const s of sessions) {
    console.log("shop:", s.shop);
    console.log("scope:", s.scope);
    console.log("expires:", s.expires);
    const tok = s.accessToken;
    console.log("accessToken:", tok ? tok.slice(0, 8) + "..." + tok.slice(-4) : "NULL/EMPTY");

    if (tok) {
      // Make a direct fetch to Admin API — bypass all wrappers
      const res = await fetch(`https://${s.shop}/admin/api/2024-10/shop.json`, {
        headers: { "X-Shopify-Access-Token": tok },
      });
      const body = await res.text();
      console.log("Direct API status:", res.status);
      console.log("Direct API body (first 300):", body.slice(0, 300));
    }
  }
  process.exit(0);
});
