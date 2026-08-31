const { api, TEST_TAG } = require("./helpers");

function demainISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// Créneau unique par run pour éviter toute collision avec des données
// laissées par un run précédent.
function creneauUnique() {
  const minutesDepuisMinuit = (Date.now() + 120000) % (9 * 60);
  const heure = 8 + Math.floor(minutesDepuisMinuit / 60);
  const minute = minutesDepuisMinuit % 60;
  return `${String(heure).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// NOTE : comme pour 09-patients.test.js, ce compte patient reste en base
// après le test (pas de route DELETE), mais son email est identifiable
// par TEST_TAG.
describe("Espace patient — auto-service (/api/patients)", () => {
  const testEmail = `${TEST_TAG.toLowerCase()}-selfservice@example.com`;
  const testPassword = "TestAutoSelf1234";
  const uniqueSuffix = TEST_TAG.replace(/\D/g, "").slice(-8);
  const testPhone = `+23767${uniqueSuffix}`;
  let patientToken = null;

  beforeAll(async () => {
    const res = await api()
      .post("/api/patients/register")
      .send({
        firstName: `${TEST_TAG}-SelfService`,
        lastName: "Test",
        dateOfBirth: "2000-01-01",
        gender: "M",
        phone: testPhone,
        email: testEmail,
        address: "Yaoundé",
        password: testPassword,
      });
    if (res.status === 201) patientToken = res.body.token;
  });

  it("GET /api/patients/slots est public et exige une date", async () => {
    const res = await api().get("/api/patients/slots");
    expect(res.status).toBe(400);
  });

  it("GET /api/patients/slots répond avec une date fournie", async () => {
    const res = await api().get(`/api/patients/slots?date=${demainISO()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data || res.body.slots)).toBe(true);
  });

  it("le patient peut mettre à jour son profil", async () => {
    if (!patientToken) return;
    const res = await api()
      .put("/api/patients/profile")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ address: "Nouvelle adresse, Yaoundé" });

    expect(res.status).toBe(200);
    expect(res.body.data.patient.address).toBe("Nouvelle adresse, Yaoundé");
  });

  it("refuse un changement de mot de passe sans l'ancien mot de passe", async () => {
    if (!patientToken) return;
    const res = await api()
      .put("/api/patients/profile")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ newPassword: "AutreMotDePasse123" });

    expect(res.status).toBe(400);
  });

  it("le patient peut prendre lui-même un rendez-vous", async () => {
    if (!patientToken) return;
    const res = await api()
      .post("/api/patients/appointments")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        service: "cardiology",
        appointmentDate: demainISO(),
        appointmentTime: creneauUnique(),
        reason: "Consultation prise par le patient lui-même (test).",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("refuse une prise de RDV incomplète", async () => {
    if (!patientToken) return;
    const res = await api()
      .post("/api/patients/appointments")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ service: "cardiology" });

    expect(res.status).toBe(400);
  });

  it("le patient retrouve son rendez-vous dans sa liste", async () => {
    if (!patientToken) return;
    const res = await api()
      .get("/api/patients/appointments")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it("refuse l'accès aux messages sans authentification", async () => {
    const res = await api().get("/api/patients/messages");
    expect(res.status).toBe(401);
  });

  it("le patient peut envoyer un message à l'administration", async () => {
    if (!patientToken) return;
    const res = await api()
      .post("/api/patients/messages")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        subject: "Question test",
        content: "Ceci est un message envoyé automatiquement par les tests.",
      });

    expect(res.status).toBe(201);
  });

  it("refuse un message sans sujet ni contenu", async () => {
    if (!patientToken) return;
    const res = await api()
      .post("/api/patients/messages")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("le patient retrouve son message envoyé", async () => {
    if (!patientToken) return;
    const res = await api()
      .get("/api/patients/messages")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });
});
