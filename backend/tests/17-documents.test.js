const { api, getAdminToken, TEST_TAG } = require("./helpers");

describe("Documents (/api/documents)", () => {
  let documentId = null;

  it("refuse la création sans authentification", async () => {
    const res = await api()
      .post("/api/documents")
      .send({ title: "Sans droits" });
    expect(res.status).toBe(401);
  });

  it("un admin peut créer un document (métadonnées, sans upload de fichier réel)", async () => {
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .post("/api/documents")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: `${TEST_TAG} Document Test`,
        description: "Document créé automatiquement pour les tests.",
        category: "rapport",
        fileUrl: "/uploads/documents/test-fake.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    documentId = res.body.data._id;
  });

  it("l'admin retrouve le document dans la liste", async () => {
    if (!documentId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get("/api/documents")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = JSON.stringify(res.body.data).includes(TEST_TAG);
    expect(found).toBe(true);
  });

  it("l'admin peut consulter le détail du document", async () => {
    if (!documentId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(documentId);
  });

  it("l'admin peut supprimer le document", async () => {
    if (!documentId) return;
    const token = await getAdminToken();
    if (!token) return;

    const res = await api()
      .delete(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
