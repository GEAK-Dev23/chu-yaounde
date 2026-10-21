/**
 * ================================================
 * ROUTES ACTUALITÉS - NEWS
 * ================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const News = require("../models/News");
const { protect, authorize } = require("../middleware/auth");
const { sendEmail } = require("../utils/notifications");
const Newsletter = require("../models/Newsletter");
const upload = require("../middleware/upload");
const {
  validateNews,
  validate,
  validateMongoId,
  validatePagination,
} = require("../middleware/validation");

/**
 * @route   GET /api/news/admin/all
 * @desc    Liste de TOUTES les actualités (publiées + brouillons) pour l'admin
 * @access  Private (admin)
 */
router.get("/admin/all", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      category,
      page = 1,
      limit = 20,
      sort = "-createdAt",
      status,
      search,
    } = req.query;
    const query = {};
    if (status === "published") {
      query.published = true;
    }
    if (status === "draft") {
      query.published = false;
    }
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (page - 1) * limit;
    const [news, total] = await Promise.all([
      News.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .populate("author", "firstName lastName"),
      News.countDocuments(query),
    ]);
    res.status(200).json({
      success: true,
      count: news.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: news,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erreur", error: error.message });
  }
});

/**
 * @route   GET /api/news
 * @desc    Liste des actualités
 * @access  Public
 */
router.get("/", validatePagination, validate, async (req, res) => {
  try {
    const {
      category,
      published = "true",
      page = 1,
      limit = 10,
      sort = "-publishedAt",
      q, // paramètre de recherche textuelle
    } = req.query;

    const query = {};

    // Seulement les articles publiés pour le public
    if (published === "true") {
      query.published = true;
    }

    if (category) query.category = category;

    // Recherche textuelle via ?q=
    if (q && q.trim() !== "") {
      query.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { content: { $regex: q.trim(), $options: "i" } },
        { excerpt: { $regex: q.trim(), $options: "i" } },
        { tags: { $in: [new RegExp(q.trim(), "i")] } },
        { authorName: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const news = await News.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate("author", "firstName lastName");

    const total = await News.countDocuments(query);

    res.status(200).json({
      success: true,
      count: news.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: news,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des actualités",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/news/latest
 * @desc    Dernières actualités publiées
 * @access  Public
 */
router.get("/latest", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const news = await News.find({
      published: true,
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate("author", "firstName lastName");

    res.status(200).json({
      success: true,
      count: news.length,
      data: news,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des actualités",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/news/:id
 * @desc    Détails d'une actualité
 * @access  Public
 */
/**
 * @route   GET /api/news/search
 * @desc    Rechercher dans les actualités
 * @access  Public
 */
router.get("/search", async (req, res) => {
  try {
    const { q, category, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Terme de recherche requis" });
    }

    const query = {
      published: true,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ],
    };

    if (category) query.category = category;

    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      News.find(query)
        .sort({ publishedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .populate("author", "firstName lastName"),
      News.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: news.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: news,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la recherche",
      error: error.message,
    });
  }
});

module.exports = router;
router.get("/:id", validateMongoId, validate, async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id).populate(
      "author",
      "firstName lastName",
    );

    if (!newsItem) {
      return res.status(404).json({
        success: false,
        message: "Actualité non trouvée",
      });
    }

    // Incrémenter les vues
    newsItem.views += 1;
    await newsItem.save();

    res.status(200).json({
      success: true,
      data: newsItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'actualité",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/news
 * @desc    Créer une actualité
 * @access  Private (admin)
 */
router.post(
  "/",
  protect,
  authorize("admin"),
  validateNews,
  validate,
  async (req, res) => {
    try {
      const { title, content, excerpt, category, tags, published, image } =
        req.body;

      const { authorName, pdf, featured, publishedAt: pubDate } = req.body;
      const newsItem = await News.create({
        title,
        content,
        excerpt,
        category: category || "actualite",
        tags: tags || [],
        published: published !== undefined ? published : false,
        publishedAt: published ? pubDate || Date.now() : null,
        author: req.user._id,
        authorName: authorName || null,
        image,
        pdf: pdf || null,
        featured: featured || false,
        eventStartDate: req.body.eventStartDate || null,
        eventEndDate: req.body.eventEndDate || null,
        eventLocation: req.body.eventLocation || null,
      });

      // Notifier les abonnés newsletter si l'article est publié
      if (newsItem.published) {
        setImmediate(async () => {
          try {
            const subscribers = await Newsletter.find({
              isActive: true,
            }).select("email nom");
            const articleUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/pages/actualites.html`;
            const htmlEmail = `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#003087;padding:24px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:22px;">CHU Yaoundé</h1>
                  <p style="color:#aac4e8;margin:4px 0 0;">Nouvelles actualités</p>
                </div>
                <div style="padding:24px;background:#fff;">
                  <h2 style="color:#003087;">${newsItem.title}</h2>
                  <p style="color:#555;line-height:1.6;">${newsItem.excerpt || newsItem.content.substring(0, 200)}...</p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${articleUrl}" style="background:#003087;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
                      Lire l'article complet
                    </a>
                  </div>
                </div>
                <div style="padding:16px;background:#f0f0f0;text-align:center;font-size:12px;color:#888;">
                  Vous recevez cet email car vous êtes abonné à la newsletter du CHU Yaoundé.
                </div>
              </div>`;
            await Promise.allSettled(
              subscribers.map((sub) =>
                sendEmail({
                  email: sub.email,
                  subject: `📰 Nouvelle publication : ${newsItem.title}`,
                  html: htmlEmail,
                  message: `Nouvelle publication : ${newsItem.title}\n\n${newsItem.excerpt || ""}\n\nLire sur : ${articleUrl}`,
                }),
              ),
            );
            console.log(
              `📧 Newsletter envoyée à ${subscribers.length} abonné(s)`,
            );
          } catch (e) {
            console.error("❌ Erreur envoi newsletter:", e.message);
          }
        });
      }

      res.status(201).json({
        success: true,
        message: "Actualité créée avec succès",
        data: newsItem,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création",
        error: error.message,
      });
    }
  },
);

/**
 * @route   PUT /api/news/:id
 * @desc    Modifier une actualité
 * @access  Private (admin)
 */
router.put(
  "/:id",
  validateMongoId,
  validate,
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const newsItem = await News.findById(req.params.id);

      if (!newsItem) {
        return res.status(404).json({
          success: false,
          message: "Actualité non trouvée",
        });
      }

      const allowedFields = [
        "title",
        "content",
        "excerpt",
        "category",
        "tags",
        "published",
        "image",
        "pdf",
        "authorName",
        "featured",
        "publishedAt",
        "eventStartDate",
        "eventEndDate",
        "eventLocation",
      ];

      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Si publication, définir la date
      if (updates.published && !newsItem.publishedAt) {
        updates.publishedAt = Date.now();
      }

      const updatedNews = await News.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });

      // Notifier si l'article vient d'être publié
      if (updates.published === true && !newsItem.published) {
        setImmediate(async () => {
          try {
            const subscribers = await Newsletter.find({
              isActive: true,
            }).select("email");
            const url = `${process.env.FRONTEND_URL || "http://localhost:5000"}/pages/actualites.html`;
            await Promise.allSettled(
              subscribers.map((sub) =>
                sendEmail({
                  email: sub.email,
                  subject: `📰 Nouvelle publication : ${updatedNews.title}`,
                  html: `<div style="font-family:Arial;padding:24px;"><h2 style="color:#003087;">${updatedNews.title}</h2><p>${updatedNews.excerpt || ""}</p><a href="${url}" style="background:#003087;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;">Lire</a></div>`,
                  message: `${updatedNews.title}\n${url}`,
                }),
              ),
            );
          } catch (e) {
            console.error("Newsletter err:", e.message);
          }
        });
      }

      res.status(200).json({
        success: true,
        message: "Actualité mise à jour",
        data: updatedNews,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour",
        error: error.message,
      });
    }
  },
);

/**
 * @route   DELETE /api/news/:id
 * @desc    Supprimer une actualité
 * @access  Private (admin)
 */
router.delete(
  "/:id",
  validateMongoId,
  validate,
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const newsItem = await News.findById(req.params.id);

      if (!newsItem) {
        return res.status(404).json({
          success: false,
          message: "Actualité non trouvée",
        });
      }

      await newsItem.deleteOne();

      res.status(200).json({
        success: true,
        message: "Actualité supprimée",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression",
        error: error.message,
      });
    }
  },
);

/**
 * @route   POST /api/news/upload-image
 * @desc    Uploader une image pour une actualité
 * @access  Private (admin)
 */
router.post(
  "/upload-image",
  protect,
  authorize("admin"),
  (req, res, next) => {
    req.uploadFolder = "news";
    next();
  },
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Aucune image reçue" });
    }

    res.status(200).json({
      success: true,
      message: "Image uploadée avec succès",
      url: req.file.path,
      filename: req.file.filename,
    });
  },
);

/**
 * @route   POST /api/news/upload-pdf
 * @desc    Uploader un PDF pour une actualité
 * @access  Private (admin)
 */
router.post(
  "/upload-pdf",
  protect,
  authorize("admin"),
  (req, res, next) => {
    req.uploadFolder = "news/pdf";
    next();
  },
  (req, res, next) => {
    const cloudinary = require("cloudinary").v2;
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    const multer = require("multer");
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "chu-yaounde/news/pdf",
        resource_type: "raw",
        allowed_formats: ["pdf"],
      },
    });
    const pdfUpload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Seuls les fichiers PDF sont acceptés"), false);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }).single("pdf");
    pdfUpload(req, res, next);
  },
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Aucun PDF reçu" });
    }
    res.status(200).json({
      success: true,
      message: "PDF uploadé avec succès",
      url: req.file.path,
      filename: req.file.filename,
    });
  },
);
