// middleware/upload.js
// Uses Cloudinary for storage in production, local disk in dev.
const multer      = require("multer");
const path        = require("path");

const isProd = process.env.NODE_ENV === "production";

let storage;

if (isProd) {
  const cloudinary       = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: { folder: "founderhub", allowed_formats: ["jpg","jpeg","png","webp"], transformation: [{ width: 400, height: 400, crop: "fill" }] },
  });
} else {
  storage = multer.diskStorage({
    destination: "uploads/",
    filename: (_, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5MB
  fileFilter: (_, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype))
      return cb(null, true);
    cb(new Error("Only JPEG, PNG and WebP images are allowed"));
  },
});

module.exports = upload;