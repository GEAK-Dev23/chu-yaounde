const { api, getAdminToken } = require("./helpers");

describe("Espace étudiants (stages, formations, concours)", () => {
  it("GET /api/internships est public et renvoie une liste", async () => {
    const res = await api().get("/api/internships");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/trainings est public et renvoie une liste", async () => {
    const res = await api().get("/api/trainings");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/contests est public et renvoie une liste", async () => {
    const res = await api().get("/api/contests");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("refuse la création d'un stage sans authentification admin", async () => {
    const res = await api()
      .post("/api/internships")
      .send({ title: "Stage test" });
    expect(res.status).toBe(401);
  });
});

describe("Documents (/api/documents)", () => {
  it("refuse l'accès à la liste des documents sans authentification", async () => {
    const res = await api().get("/api/documents");
    expect(res.status).toBe(401);
  });
});

describe("Tableau de bord admin (/api/admin)", () => {
  it("refuse l'accès au dashboard sans authentification", async () => {
    const res = await api().get("/api/admin/dashboard");
    expect(res.status).toBe(401);
  });

  it("l'admin peut accéder à son tableau de bord", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("l'admin peut consulter les statistiques globales", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get("/api/admin/stats/overview")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
