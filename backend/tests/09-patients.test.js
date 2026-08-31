const { api, TEST_TAG } = require("./helpers");

// NOTE : il n'existe pas de route DELETE pour /api/patients dans ce backend.
// Le compte patient créé ici restera donc en base après les tests, mais son
// email est clairement préfixé par TEST_TAG pour être repéré et supprimé
// manuellement si besoin (collection "patients" / panel admin).
//
// Le téléphone doit aussi être unique par run : /api/patients/register
// refuse un doublon sur EMAIL **OU** TÉLÉPHONE, donc un numéro codé en dur
// entrerait en conflit avec les patients créés par les runs précédents
// (jamais supprimés faute de route DELETE).
describe("Espace patient (/api/patients)", () => {
  const testEmail = `${TEST_TAG.toLowerCase()}-patient@example.com`;
  const testPassword = "TestAuto1234";
  const uniqueSuffix = TEST_TAG.replace(/\D/g, "").slice(-8); // chiffres du timestamp
  const testPhone = `+23769${uniqueSuffix}`;
  const duplicateTestPhone = `+23768${uniqueSuffix}`;
  let patientToken = null;

  it("refuse une inscription incomplète", async () => {
    const res = await api()
      .post("/api/patients/register")
      .send({ firstName: "Incomplet" });
    expect(res.status).toBe(400);
  });

  it("inscrit un nouveau patient avec des données valides", async () => {
    const res = await api()
      .post("/api/patients/register")
      .send({
        firstName: `${TEST_TAG}-Sophie`,
        lastName: "Kamga",
        dateOfBirth: "1998-03-12",
        gender: "F",
        phone: testPhone,
        email: testEmail,
        address: "Yaoundé, Cameroun",
        password: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    patientToken = res.body.token;
  });

  it("refuse une seconde inscription avec le même email", async () => {
    const res = await api().post("/api/patients/register").send({
      firstName: "Doublon",
      lastName: "Test",
      dateOfBirth: "1998-03-12",
      gender: "F",
      phone: duplicateTestPhone,
      email: testEmail,
      address: "Yaoundé",
      password: testPassword,
    });
    expect(res.status).toBe(400);
  });

  it("connecte le patient avec les bons identifiants", async () => {
    const res = await api()
      .post("/api/patients/login")
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    patientToken = res.body.token;
  });

  it("refuse la connexion avec un mauvais mot de passe", async () => {
    const res = await api()
      .post("/api/patients/login")
      .send({ email: testEmail, password: "MauvaisMotDePasse" });
    expect(res.status).toBe(401);
  });

  it("refuse GET /profile sans token patient", async () => {
    const res = await api().get("/api/patients/profile");
    expect(res.status).toBe(401);
  });

  it("le patient peut consulter son propre profil avec son token", async () => {
    if (!patientToken) return;
    const res = await api()
      .get("/api/patients/profile")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.patient.email).toBe(testEmail.toLowerCase());
  });

  it("le patient peut consulter ses rendez-vous (liste vide au départ)", async () => {
    if (!patientToken) return;
    const res = await api()
      .get("/api/patients/appointments")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
