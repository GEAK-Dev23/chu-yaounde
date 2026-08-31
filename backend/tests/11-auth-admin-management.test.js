const { api, getAdminToken, TEST_TAG } = require("./helpers");

// Ces tests créent un compte "staff" jetable pour tester le cycle complet
// (création par un admin → modification → suppression), sans jamais toucher
// au compte admin réel seedé par database/seed/admin-user.js.
describe("Gestion des comptes admin/staff (/api/auth/register + /api/users)", () => {
  const staffEmail = `${TEST_TAG.toLowerCase()}-staff@example.com`;
  const staffPassword = "TestAutoStaff1234";
  let staffId = null;

  it("refuse la création d'un compte sans authentification admin", async () => {
    const res = await api()
      .post("/api/auth/register")
      .send({ email: staffEmail, password: staffPassword });
    expect(res.status).toBe(401);
  });

  it("l'admin peut créer un nouveau compte staff", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: staffEmail,
        password: staffPassword,
        role: "staff",
        firstName: `${TEST_TAG}-Staff`,
        lastName: "Test",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    staffId = res.body.data.id;
  });

  it("refuse de créer un second compte avec le même email", async () => {
    const token = await getAdminToken();
    if (!token || !staffId) return;

    const res = await api()
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: staffEmail, password: staffPassword });

    expect(res.status).toBe(400);
  });

  it("refuse l'accès à la liste des utilisateurs sans être admin", async () => {
    const res = await api().get("/api/users");
    expect(res.status).toBe(401);
  });

  it("l'admin peut lister les utilisateurs et y retrouve le compte staff créé", async () => {
    const token = await getAdminToken();
    if (!token || !staffId) return;

    const res = await api()
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(true);
  });

  it("l'admin peut consulter le détail du compte staff", async () => {
    const token = await getAdminToken();
    if (!token || !staffId) return;

    const res = await api()
      .get(`/api/users/${staffId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(staffEmail);
  });

  it("l'admin peut modifier le compte staff", async () => {
    const token = await getAdminToken();
    if (!token || !staffId) return;

    const res = await api()
      .put(`/api/users/${staffId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ phone: "+237650000010" });

    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe("+237650000010");
  });

  it("l'admin peut supprimer le compte staff", async () => {
    const token = await getAdminToken();
    if (!token || !staffId) return;

    const res = await api()
      .delete(`/api/users/${staffId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
