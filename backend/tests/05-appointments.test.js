const { api, getAdminToken, TEST_TAG } = require("./helpers");

// Construit une date au format ISO (YYYY-MM-DD) pour demain,
// afin de toujours passer la validation "date future ou aujourd'hui".
function demainISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// Un créneau horaire (HH:MM) unique par run, dérivé du timestamp du run.
// Sans ça, une heure codée en dur (ex: "09:30") entre en collision avec
// un rendez-vous laissé par un run précédent sur le même médecin/jour/heure
// (le modèle ne permet pas de supprimer un rendez-vous, seulement de
// l'annuler — et si ce nettoyage échoue une seule fois, le créneau reste
// "pending" pour toujours et bloque tous les runs suivants).
function creneauUnique() {
  const minutesDepuisMinuit = Date.now() % (9 * 60); // étalé sur 0 à 539 min
  const heure = 8 + Math.floor(minutesDepuisMinuit / 60); // plage 8h-16h
  const minute = minutesDepuisMinuit % 60;
  return `${String(heure).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

describe("Rendez-vous (/api/appointments)", () => {
  let service = null; // service réel récupéré via l'API, nécessaire pour créer un RDV valide
  const createdIds = [];

  beforeAll(async () => {
    const res = await api().get("/api/services?available=true");
    if (
      res.status === 200 &&
      Array.isArray(res.body.data) &&
      res.body.data.length > 0
    ) {
      // On cherche un service qui a au moins un membre du personnel assigné
      service =
        res.body.data.find((s) => s.staff && s.staff.length > 0) ||
        res.body.data[0];
    }
  });

  it("GET /slots/available répond (même sans paramètres)", async () => {
    const res = await api().get("/api/appointments/slots/available");
    expect([200, 400]).toContain(res.status);
  });

  it("refuse un rendez-vous incomplet", async () => {
    const res = await api()
      .post("/api/appointments")
      .send({
        patient: { firstName: "Test" },
      });
    expect(res.status).toBe(400);
  });

  it("crée un rendez-vous valide si un service est disponible en base", async () => {
    if (!service || !service.slug) {
      console.warn(
        "⚠️  Aucun service disponible en base (avez-vous lancé le seed des services ?) : test ignoré.",
      );
      return;
    }

    const doctor = (service.staff && service.staff[0]) || {
      id: "doc-test",
      name: "Dr. Test",
    };

    const res = await api()
      .post("/api/appointments")
      .send({
        patient: {
          firstName: `${TEST_TAG}-Paul`,
          lastName: "Essomba",
          email: "paul.test@example.com",
          phone: "+237650000001",
          birthDate: "1995-05-20",
        },
        service: service.slug,
        doctor: { id: doctor.id || "doc-test", name: doctor.name },
        appointmentDate: demainISO(),
        appointmentTime: creneauUnique(),
        reason: "Consultation de routine (test automatisé)",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdIds.push(res.body.data._id);
  });

  it("refuse l'accès à la liste des rendez-vous sans être admin", async () => {
    const res = await api().get("/api/appointments");
    expect(res.status).toBe(401);
  });

  it("l'admin retrouve le rendez-vous créé par le test", async () => {
    if (createdIds.length === 0) return; // rien à vérifier si le test précédent a été ignoré
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get("/api/appointments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(true);
  });

  // Nettoyage : on annule (le modèle ne permet pas de supprimer, seulement d'annuler)
  afterAll(async () => {
    const token = await getAdminToken();
    if (!token || createdIds.length === 0) return;
    for (const id of createdIds) {
      await api()
        .delete(`/api/appointments/${id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Nettoyage automatique post-tests" });
    }
  });
});
