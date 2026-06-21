const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_COMPROBANTE_MIMES = [...ALLOWED_IMAGE_MIMES, 'application/pdf'];

const storage = multer.memoryStorage();

function makeUpload(allowedMimes) {
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(
          `Tipo de archivo no permitido: ${file.mimetype}. Se aceptan: ${allowedMimes.join(', ')}`
        ));
      }
    },
  });
}

// Para imágenes de productos y categorías — sin PDF
const upload = makeUpload(ALLOWED_IMAGE_MIMES);

// Para comprobantes de pago (Yape/Plin) — imágenes + PDF
const uploadComprobante = makeUpload(ALLOWED_COMPROBANTE_MIMES);

// Envuelve cualquier multer single-field para devolver 400 JSON en vez de propagar el error
function wrapMulter(multerFn) {
  return (req, res, next) => {
    multerFn(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  };
}

function uploadToCloudinary(buffer, folder = 'rali-cosmetics') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = { upload, uploadComprobante, wrapMulter, uploadToCloudinary };
