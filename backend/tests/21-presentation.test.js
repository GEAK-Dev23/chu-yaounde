const { api } = require("./helpers");

describe("Présentation (/api/presentation)", () => {
  it("GET /data renvoie les données de présentation", async () => {
    const res = await api().get("/api/presentation/data");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("hero");
  });

  it("GET /leadership renvoie les informations de direction", async () => {
    const res = await api().get("/api/presentation/leadership");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("director");
  });
});
