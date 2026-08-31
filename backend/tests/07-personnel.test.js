const { api, getAdminToken, TEST_TAG } = require("./helpers");

describe("Personnel (/api/personnel)", () => {
  const createdIds = [];

  it("liste le personnel publiquement, sans authentification", async () => {
    const res = await api().get("/api/personnel");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("refuse la création d'un membre sans authentification admin", async () => {
    const res = await api()
      .post("/api/personnel")
      .send({ name: "Sans droits", poste: "Test" });
    expect(res.status).toBe(401);
  });

  it("l'admin peut créer un membre du personnel", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .post("/api/personnel")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `${TEST_TAG}-Membre`, poste: "Infirmier (test)" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdIds.push(res.body.data.id);
  });

  it("le membre créé apparaît bien dans la liste publique", async () => {
    if (createdIds.length === 0) return;
    const res = await api().get("/api/personnel");
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(true);
  });

  it("l'admin peut modifier un membre du personnel", async () => {
    if (createdIds.length === 0) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .put(`/api/personnel/${createdIds[0]}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ poste: "Infirmier chef (test, modifié)" });

    expect(res.status).toBe(200);
    expect(res.body.data.poste).toContain("modifié");
  });

  afterAll(async () => {
    const token = await getAdminToken();
    if (!token || createdIds.length === 0) return;
    for (const id of createdIds) {
      await api()
        .delete(`/api/personnel/${id}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });
});
