const { api, getAdminToken, TEST_TAG } = require("./helpers");

describe("CRUD admin des services (/api/services)", () => {
  let serviceId = null;

  it("refuse la création avec un nom manquant", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .post("/api/services")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Un service sans nom, ça ne doit pas passer." });

    expect(res.status).toBe(400);
  });

  it("l'admin peut créer un nouveau service", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .post("/api/services")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: `${TEST_TAG} Service Test`,
        description: "Service créé automatiquement pour les tests.",
        department: "Test",
        available: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    serviceId = res.body.data._id;
  });

  it("le service créé apparaît dans la liste publique", async () => {
    if (!serviceId) return;
    const res = await api().get("/api/services");
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(true);
  });

  it("l'admin peut modifier le service", async () => {
    if (!serviceId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .put(`/api/services/${serviceId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ available: false });

    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(false);
  });

  it("refuse la modification sans authentification admin", async () => {
    if (!serviceId) return;
    const res = await api()
      .put(`/api/services/${serviceId}`)
      .send({ available: true });
    expect(res.status).toBe(401);
  });

  it("l'admin peut supprimer le service", async () => {
    if (!serviceId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .delete(`/api/services/${serviceId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
