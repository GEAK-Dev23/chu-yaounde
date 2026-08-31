const { api, getAdminToken, TEST_TAG } = require("./helpers");

function demainISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// Créneau unique par run, comme dans 05-appointments.test.js, pour ne
// jamais entrer en collision avec un rendez-vous laissé par un run précédent.
function creneauUnique() {
  const minutesDepuisMinuit = (Date.now() + 60000) % (9 * 60); // décalé d'1 min vs 05-appointments
  const heure = 8 + Math.floor(minutesDepuisMinuit / 60);
  const minute = minutesDepuisMinuit % 60;
  return `${String(heure).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

describe("Actions admin sur les rendez-vous (/api/appointments)", () => {
  let service = null;
  let appointmentId = null;

  beforeAll(async () => {
    const res = await api().get("/api/services?available=true");
    if (
      res.status === 200 &&
      Array.isArray(res.body.data) &&
      res.body.data.length > 0
    ) {
      service =
        res.body.data.find((s) => s.staff && s.staff.length > 0) ||
        res.body.data[0];
    }
    if (!service || !service.slug) return;

    const doctor = (service.staff && service.staff[0]) || {
      id: "doc-test",
      name: "Dr. Test",
    };

    const createRes = await api()
      .post("/api/appointments")
      .send({
        patient: {
          firstName: `${TEST_TAG}-Admin-Action`,
          lastName: "Test",
          email: "admin-action.test@example.com",
          phone: "+237650000002",
          birthDate: "1990-01-01",
        },
        service: service.slug,
        doctor: { id: doctor.id || "doc-test", name: doctor.name },
        appointmentDate: demainISO(),
        appointmentTime: creneauUnique(),
        reason: "Consultation (test admin actions)",
      });
    if (createRes.status === 201) appointmentId = createRes.body.data._id;
  });

  it("refuse de consulter un rendez-vous sans authentification", async () => {
    if (!appointmentId) return;
    const res = await api().get(`/api/appointments/${appointmentId}`);
    expect(res.status).toBe(401);
  });

  it("l'admin peut consulter le détail du rendez-vous", async () => {
    if (!appointmentId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get(`/api/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(appointmentId);
  });

  it("l'admin peut modifier le motif du rendez-vous", async () => {
    if (!appointmentId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .put(`/api/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Motif modifié par le test admin" });

    expect(res.status).toBe(200);
    expect(res.body.data.reason).toBe("Motif modifié par le test admin");
  });

  it("le staff peut confirmer le rendez-vous (PUT /:id/confirm)", async () => {
    if (!appointmentId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .put(`/api/appointments/${appointmentId}/confirm`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("confirmed");
  });

  it("l'admin peut annuler le rendez-vous via PATCH /:id/cancel", async () => {
    if (!appointmentId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .patch(`/api/appointments/${appointmentId}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Annulé par le test automatisé" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  it("refuse de modifier un rendez-vous déjà annulé", async () => {
    if (!appointmentId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .put(`/api/appointments/${appointmentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Nouvelle tentative" });

    expect(res.status).toBe(400);
  });

  it("l'admin peut consulter les statistiques des rendez-vous", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get("/api/appointments/stats/overview")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("total");
  });
});
