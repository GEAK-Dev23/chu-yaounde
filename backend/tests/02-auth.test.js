const { api, ADMIN_EMAIL, ADMIN_PASSWORD } = require("./helpers");

describe("Authentification admin (/api/auth)", () => {
  it("refuse la connexion sans email ni mot de passe", async () => {
    const res = await api().post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse la connexion avec de mauvais identifiants", async () => {
    const res = await api()
      .post("/api/auth/login")
      .send({ email: "inconnu@test.com", password: "MauvaisMotDePasse123" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("connecte l'admin seedé avec les bons identifiants et renvoie un token", async () => {
    const res = await api()
      .post("/api/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(10);
  });

  it("refuse GET /api/auth/me sans token", async () => {
    const res = await api().get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("accepte GET /api/auth/me avec un token admin valide", async () => {
    const login = await api()
      .post("/api/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const token = login.body.token;

    const res = await api()
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(ADMIN_EMAIL.toLowerCase());
  });

  it("refuse un token invalide/forgé", async () => {
    const res = await api()
      .get("/api/auth/me")
      .set("Authorization", "Bearer un.faux.token");
    expect(res.status).toBe(401);
  });
});
