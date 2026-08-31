const { api } = require("./helpers");

describe("Disponibilité du serveur", () => {
  it("GET /health doit répondre success:true", async () => {
    const res = await api().get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET / doit servir le frontend (index.html)", async () => {
    const res = await api().get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("GET /api/route-inexistante doit renvoyer un 404 JSON", async () => {
    const res = await api().get("/api/route-qui-nexiste-pas");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("GET /admin-panel doit servir le panel admin", async () => {
    const res = await api().get("/admin-panel/");
    expect(res.status).toBe(200);
  });
});
