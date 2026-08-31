const { api, getAdminToken, TEST_TAG } = require("./helpers");

describe("Formulaire de contact (/api/contacts)", () => {
  const createdIds = [];

  it("refuse un message incomplet", async () => {
    const res = await api().post("/api/contacts").send({
      firstName: "Marie",
    });
    expect(res.status).toBe(400);
  });

  it("refuse un message trop court (moins de 10 caractères)", async () => {
    const res = await api()
      .post("/api/contacts")
      .send({
        firstName: `${TEST_TAG}-Marie`,
        lastName: "Ateba",
        email: "marie.test@example.com",
        subject: "information",
        message: "court",
        gdprConsent: true,
      });
    expect(res.status).toBe(400);
  });

  it("refuse un sujet (subject) qui n'est pas une valeur autorisée", async () => {
    const res = await api()
      .post("/api/contacts")
      .send({
        firstName: `${TEST_TAG}-Marie`,
        lastName: "Ateba",
        email: "marie.test@example.com",
        subject: "sujet-invalide",
        message: "Un message suffisamment long pour passer la validation.",
        gdprConsent: true,
      });
    expect(res.status).toBe(400);
  });

  it("refuse un message sans consentement RGPD (gdprConsent)", async () => {
    const res = await api()
      .post("/api/contacts")
      .send({
        firstName: `${TEST_TAG}-Marie`,
        lastName: "Ateba",
        email: "marie.test@example.com",
        subject: "information",
        message: "Un message suffisamment long pour passer la validation.",
        gdprConsent: false,
      });
    expect(res.status).toBe(400);
  });

  it("crée un message de contact valide", async () => {
    const res = await api()
      .post("/api/contacts")
      .send({
        firstName: `${TEST_TAG}-Marie`,
        lastName: "Ateba",
        email: "marie.test@example.com",
        subject: "information",
        message:
          "Ceci est un message envoyé automatiquement par la suite de tests pour vérifier le formulaire de contact.",
        gdprConsent: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdIds.push(res.body.data._id);
  });

  it("refuse l'accès à la liste des messages sans être admin", async () => {
    const res = await api().get("/api/contacts");
    expect(res.status).toBe(401);
  });

  it("l'admin peut voir le message créé par le test", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get("/api/contacts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(true);
  });

  afterAll(async () => {
    const token = await getAdminToken();
    if (!token || createdIds.length === 0) return;
    for (const id of createdIds) {
      await api()
        .delete(`/api/contacts/${id}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });
});
