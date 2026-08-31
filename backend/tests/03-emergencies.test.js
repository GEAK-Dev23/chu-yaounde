const { api, getAdminToken, TEST_TAG } = require("./helpers");

describe("Urgences (/api/emergencies)", () => {
  const createdIds = [];

  it("refuse une urgence incomplète (validation)", async () => {
    const res = await api().post("/api/emergencies").send({
      firstName: "Jean", // il manque lastName, age, gender, phone, symptoms...
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it("refuse un type d'urgence invalide", async () => {
    const res = await api()
      .post("/api/emergencies")
      .send({
        firstName: `${TEST_TAG}-Jean`,
        lastName: "Dupont",
        age: 34,
        gender: "M",
        phone: "+237650000000",
        symptoms: "Douleurs thoraciques et essoufflement.",
        emergencyType: "type_qui_nexiste_pas",
        severity: 4,
      });
    expect(res.status).toBe(400);
  });

  it("refuse une gravité (severity) hors de la plage 1-5", async () => {
    const res = await api()
      .post("/api/emergencies")
      .send({
        firstName: `${TEST_TAG}-Jean`,
        lastName: "Dupont",
        age: 34,
        gender: "M",
        phone: "+237650000000",
        symptoms: "Douleurs thoraciques et essoufflement.",
        emergencyType: "cardiac",
        severity: 9,
      });
    expect(res.status).toBe(400);
  });

  it("crée un signalement d'urgence valide (sans authentification requise)", async () => {
    const res = await api()
      .post("/api/emergencies")
      .send({
        firstName: `${TEST_TAG}-Jean`,
        lastName: "Dupont",
        age: 34,
        gender: "M",
        phone: "+237650000000",
        symptoms:
          "Douleurs thoraciques intenses et essoufflement (cas de test automatisé).",
        emergencyType: "cardiac",
        severity: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("_id");
    // La priorité doit avoir été auto-calculée à partir de severity=4
    expect(res.body.data.priority).toBe("very_urgent");
    createdIds.push(res.body.data._id);
  });

  it("refuse l'accès à la liste des urgences sans être admin", async () => {
    const res = await api().get("/api/emergencies");
    expect(res.status).toBe(401);
  });

  it("l'admin peut lister les urgences et y retrouve celle créée par le test", async () => {
    const token = await getAdminToken();
    if (!token) {
      console.warn(
        "⚠️  Connexion admin impossible : ce test est ignoré (voir 02-auth.test.js).",
      );
      return;
    }

    const res = await api()
      .get("/api/emergencies")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(true);
  });

  // Nettoyage : on supprime les urgences créées par ce fichier de test
  afterAll(async () => {
    const token = await getAdminToken();
    if (!token || createdIds.length === 0) return;

    for (const id of createdIds) {
      await api()
        .delete(`/api/emergencies/${id}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });
});
