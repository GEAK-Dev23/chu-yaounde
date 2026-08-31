const { api, getAdminToken, TEST_TAG } = require("./helpers");

describe("Réponse admin à un message de contact (/api/contacts/:id/reply)", () => {
  let contactId = null;

  beforeAll(async () => {
    const res = await api()
      .post("/api/contacts")
      .send({
        firstName: `${TEST_TAG}-Reply`,
        lastName: "Test",
        email: "reply-test@example.com",
        subject: "information",
        message: "Message créé automatiquement pour tester la réponse admin.",
        gdprConsent: true,
      });
    if (res.status === 201) contactId = res.body.data._id;
  });

  it("refuse de répondre sans authentification admin", async () => {
    if (!contactId) return;
    const res = await api()
      .put(`/api/contacts/${contactId}/reply`)
      .send({ reply: "Tentative sans droits" });
    expect(res.status).toBe(401);
  });

  it("refuse une réponse vide", async () => {
    if (!contactId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .put(`/api/contacts/${contactId}/reply`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("l'admin peut répondre au message", async () => {
    if (!contactId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .put(`/api/contacts/${contactId}/reply`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reply: "Merci pour votre message, voici notre réponse test." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("replied");
  });

  afterAll(async () => {
    const token = await getAdminToken();
    if (!token || !contactId) return;
    await api()
      .delete(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`);
  });
});
