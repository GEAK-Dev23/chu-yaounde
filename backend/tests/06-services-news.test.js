const { api } = require("./helpers");

describe("Services (/api/services)", () => {
  it("liste les services publiquement, sans authentification", async () => {
    const res = await api().get("/api/services");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/services/featured répond une liste (peut être vide)", async () => {
    const res = await api().get("/api/services/featured");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/services/:id avec un id invalide renvoie 400", async () => {
    const res = await api().get("/api/services/pas-un-id-mongo");
    expect(res.status).toBe(400);
  });

  it("refuse la création d'un service sans authentification admin", async () => {
    const res = await api()
      .post("/api/services")
      .send({ name: "Service créé sans droit" });
    expect(res.status).toBe(401);
  });
});

describe("Actualités (/api/news)", () => {
  it("liste les actualités publiées publiquement", async () => {
    const res = await api().get("/api/news");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/news/latest répond une liste", async () => {
    const res = await api().get("/api/news/latest");
    expect(res.status).toBe(200);
  });

  it("GET /api/news/search sans paramètre gère le cas gracieusement", async () => {
    const res = await api().get("/api/news/search");
    expect([200, 400]).toContain(res.status);
  });

  it("refuse la création d'une actualité sans authentification admin", async () => {
    const res = await api()
      .post("/api/news")
      .send({ title: "Titre test", content: "Contenu de test suffisant." });
    expect(res.status).toBe(401);
  });

  it("refuse l'accès à /api/news/admin/all sans être admin", async () => {
    const res = await api().get("/api/news/admin/all");
    expect(res.status).toBe(401);
  });
});
