const { api } = require("./helpers");

// NOTE : POST /message appelle réellement l'API Groq (LLM). En cas d'échec
// (clé invalide, quota, réseau...), la route bascule automatiquement sur
// une réponse de secours (fallback) et répond quand même 200 — donc ce
// test reste fiable même sans connectivité Groq.
describe("Chatbot (/api/chatbot)", () => {
  const testSessionId = `test-session-${Date.now()}`;

  it("refuse un message vide", async () => {
    const res = await api().post("/api/chatbot/message").send({ message: "" });
    expect(res.status).toBe(400);
  });

  it("répond à un message simple (LLM ou fallback)", async () => {
    const res = await api().post("/api/chatbot/message").send({
      message: "Bonjour, quels sont vos horaires d'ouverture ?",
      sessionId: testSessionId,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.message).toBe("string");
    expect(res.body.data.message.length).toBeGreaterThan(0);
  });

  it("GET /suggestions renvoie une liste de suggestions", async () => {
    const res = await api().get("/api/chatbot/suggestions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("GET /history/:sessionId retrouve l'échange précédent", async () => {
    // Petite pause pour laisser le temps au log (non bloquant côté serveur) d'être écrit
    await new Promise((r) => setTimeout(r, 1000));

    const res = await api().get(`/api/chatbot/history/${testSessionId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /refresh-cache recharge le contexte sans erreur", async () => {
    const res = await api().post("/api/chatbot/refresh-cache");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
