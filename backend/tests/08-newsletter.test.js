const { api, getAdminToken, TEST_TAG } = require("./helpers");

describe("Newsletter (/api/newsletter)", () => {
  const testEmail = `${TEST_TAG.toLowerCase()}-newsletter@example.com`;

  it("refuse un abonnement sans email", async () => {
    const res = await api().post("/api/newsletter/subscribe").send({});
    expect(res.status).toBe(400);
  });

  it("accepte un nouvel abonnement", async () => {
    const res = await api()
      .post("/api/newsletter/subscribe")
      .send({ email: testEmail, nom: "Test Automatisé" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("refuse un second abonnement avec le même email (déjà abonné)", async () => {
    const res = await api()
      .post("/api/newsletter/subscribe")
      .send({ email: testEmail });
    expect(res.status).toBe(400);
  });

  it("refuse l'accès à la liste des abonnés sans être admin", async () => {
    const res = await api().get("/api/newsletter");
    expect(res.status).toBe(401);
  });

  // Nettoyage : on se désabonne (au lieu de laisser un faux email actif en base)
  afterAll(async () => {
    await api().post("/api/newsletter/unsubscribe").send({ email: testEmail });
  });
});
