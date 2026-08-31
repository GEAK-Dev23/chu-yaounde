const { api, getAdminToken, TEST_TAG } = require("./helpers");

// IMPORTANT : on crée toujours l'actualité avec published:false. Si
// published:true, la route déclenche un envoi d'email à TOUS les abonnés
// newsletter actifs (voir routes/news.js) — inacceptable pour un test
// automatisé qui tourne à chaque exécution.
describe("CRUD admin des actualités (/api/news)", () => {
  let newsId = null;

  it("refuse la création avec un contenu trop court", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .post("/api/news")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Titre test", content: "court" });

    expect(res.status).toBe(400);
  });

  it("l'admin peut créer une actualité (non publiée)", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .post("/api/news")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: `${TEST_TAG} Actualité Test`,
        content:
          "Contenu de test généré automatiquement, suffisamment long pour passer la validation.",
        category: "actualite",
        published: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.published).toBe(false);
    newsId = res.body.data._id;
  });

  it("une actualité non publiée n'apparaît PAS dans la liste publique", async () => {
    if (!newsId) return;
    const res = await api().get("/api/news");
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(false);
  });

  it("l'actualité apparaît bien dans la liste admin (published ou non)", async () => {
    if (!newsId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get("/api/news/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(true);
  });

  it("l'admin peut consulter le détail de l'actualité", async () => {
    if (!newsId) return;
    const res = await api().get(`/api/news/${newsId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(newsId);
  });

  it("l'admin peut modifier l'actualité (toujours non publiée)", async () => {
    if (!newsId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .put(`/api/news/${newsId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: `${TEST_TAG} Actualité Modifiée` });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toContain("Modifiée");
  });

  it("refuse la modification sans authentification admin", async () => {
    if (!newsId) return;
    const res = await api()
      .put(`/api/news/${newsId}`)
      .send({ title: "Tentative sans droits" });
    expect(res.status).toBe(401);
  });

  it("l'admin peut supprimer l'actualité", async () => {
    if (!newsId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .delete(`/api/news/${newsId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
