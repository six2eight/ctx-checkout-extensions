const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.session.deleteMany({}).then((r) => {
  console.log("deleted sessions:", r.count);
  process.exit(0);
});
