const { api, getAdminToken, TEST_TAG } = require("./helpers");

describe("Actions admin sur la newsletter (/api/newsletter)", () => {
  const testEmail = `${TEST_TAG.toLowerCase()}-newsletter-admin@example.com`;
  let subscriberId = null;

  beforeAll(async () => {
    await api().post("/api/newsletter/subscribe").send({ email: testEmail });
    const token = await getAdminToken();
    if (!token) return;
    const res = await api()
      .get("/api/newsletter")
      .set("Authorization", `Bearer ${token}`);
    if (res.status === 200) {
      const sub = (res.body.data || []).find((s) => s.email === testEmail);
      if (sub) subscriberId = sub._id;
    }
  });

  it("refuse le PATCH toggle sans authentification admin", async () => {
    if (!subscriberId) return;
    const res = await api().patch(`/api/newsletter/${subscriberId}/toggle`);
    expect(res.status).toBe(401);
  });

  it("l'admin peut désactiver un abonné via PATCH toggle", async () => {
    if (!subscriberId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .patch(`/api/newsletter/${subscriberId}/toggle`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it("l'admin peut supprimer définitivement un abonné", async () => {
    if (!subscriberId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .delete(`/api/newsletter/${subscriberId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
