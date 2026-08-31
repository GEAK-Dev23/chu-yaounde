const { api, getAdminToken, TEST_TAG } = require("./helpers");

// Les 3 routes (internships, trainings, contests) partagent la même
// structure CRUD : GET public, GET admin/all, POST/PUT/PATCH/DELETE admin.
// On factorise le test pour les trois.
function runCrudSuite(label, basePath, extraFields = {}) {
  describe(`CRUD admin — ${label} (${basePath})`, () => {
    let itemId = null;

    it("refuse la création sans authentification admin", async () => {
      const res = await api().post(basePath).send({ title: "Sans droits" });
      expect(res.status).toBe(401);
    });

    it(`l'admin peut créer un(e) ${label.toLowerCase()}`, async () => {
      const token = await getAdminToken();
      if (!token) return;

      const res = await api()
        .post(basePath)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: `${TEST_TAG} ${label} Test`,
          description: "Description générée automatiquement pour les tests.",
          active: true,
          ...extraFields,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      itemId = res.body.data._id;
    });

    it("apparaît dans la liste publique (active:true)", async () => {
      if (!itemId) return;
      const res = await api().get(basePath);
      const found = JSON.stringify(res.body.data).includes(TEST_TAG);
      expect(found).toBe(true);
    });

    it("l'admin peut modifier l'élément", async () => {
      if (!itemId) return;
      const token = await getAdminToken();
      if (!token) return;

      const res = await api()
        .put(`${basePath}/${itemId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: `${TEST_TAG} ${label} Modifié` });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain("Modifié");
    });

    it("le PATCH /:id/toggle bascule le statut actif", async () => {
      if (!itemId) return;
      const token = await getAdminToken();
      if (!token) return;

      const res = await api()
        .patch(`${basePath}/${itemId}/toggle`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(false);
    });

    it("l'élément désactivé n'apparaît plus dans la liste publique", async () => {
      if (!itemId) return;
      const res = await api().get(basePath);
      const found = JSON.stringify(res.body.data).includes(TEST_TAG);
      expect(found).toBe(false);
    });

    it("mais reste visible dans la liste admin", async () => {
      if (!itemId) return;
      const token = await getAdminToken();
      if (!token) return;

      const res = await api()
        .get(`${basePath}/admin/all`)
        .set("Authorization", `Bearer ${token}`);

      const found = JSON.stringify(res.body.data).includes(TEST_TAG);
      expect(found).toBe(true);
    });

    it("l'admin peut supprimer l'élément", async () => {
      if (!itemId) return;
      const token = await getAdminToken();
      if (!token) return;

      const res = await api()
        .delete(`${basePath}/${itemId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
}

runCrudSuite("Stage", "/api/internships");
runCrudSuite("Concours", "/api/contests");
runCrudSuite("Formation", "/api/trainings", { category: "Médecine" });
