const { api, getAdminToken, TEST_TAG } = require("./helpers");

// IMPORTANT : /api/auth/updatepassword change le mot de passe du compte
// actuellement connecté. On crée donc un compte staff jetable dédié à ce
// test, pour ne JAMAIS modifier le mot de passe du vrai compte admin seedé
// (ce qui casserait l'accès admin pour le reste de la suite de tests).
describe("Déconnexion et changement de mot de passe (/api/auth)", () => {
  const staffEmail = `${TEST_TAG.toLowerCase()}-pwdtest@example.com`;
  const initialPassword = "MotDePasseInitial123";
  const newPassword = "NouveauMotDePasse456";
  let staffId = null;
  let staffToken = null;

  beforeAll(async () => {
    const adminToken = await getAdminToken();
    if (!adminToken) return;

    const res = await api()
      .post("/api/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: staffEmail,
        password: initialPassword,
        role: "staff",
        firstName: `${TEST_TAG}-PwdTest`,
        lastName: "Test",
      });
    if (res.status === 201) staffId = res.body.data.id;
  });

  it("le compte staff jetable peut se connecter avec son mot de passe initial", async () => {
    if (!staffId) return;
    const res = await api()
      .post("/api/auth/login")
      .send({ email: staffEmail, password: initialPassword });

    expect(res.status).toBe(200);
    staffToken = res.body.token;
  });

  it("refuse la déconnexion sans authentification", async () => {
    const res = await api().post("/api/auth/logout");
    expect(res.status).toBe(401);
  });

  it("un utilisateur connecté peut se déconnecter", async () => {
    if (!staffToken) return;
    const res = await api()
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("refuse un changement de mot de passe sans les champs requis", async () => {
    if (!staffToken) return;
    const res = await api()
      .put("/api/auth/updatepassword")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ currentPassword: initialPassword });
    expect(res.status).toBe(400);
  });

  it("refuse un changement de mot de passe si l'ancien est incorrect", async () => {
    if (!staffToken) return;
    const res = await api()
      .put("/api/auth/updatepassword")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ currentPassword: "MauvaisMotDePasse", newPassword });
    expect(res.status).toBe(401);
  });

  it("change le mot de passe avec les bons identifiants", async () => {
    if (!staffToken) return;
    const res = await api()
      .put("/api/auth/updatepassword")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ currentPassword: initialPassword, newPassword });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  it("le nouveau mot de passe fonctionne bien pour se reconnecter", async () => {
    if (!staffId) return;
    const res = await api()
      .post("/api/auth/login")
      .send({ email: staffEmail, password: newPassword });

    expect(res.status).toBe(200);
  });

  // Nettoyage : suppression du compte staff jetable
  afterAll(async () => {
    const adminToken = await getAdminToken();
    if (!adminToken || !staffId) return;
    await api()
      .delete(`/api/users/${staffId}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });
});
