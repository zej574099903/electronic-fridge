const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Incoming] ${req.method} ${req.url}`);
  next();
});

// Enable CORS with explicit DELETE/OPTIONS support
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname || '.jpg'));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve the uploads folder as a static directory
app.use('/uploads', express.static(uploadDir));

// Welcome route
app.get('/', (req, res) => {
  res.send({ 
    status: 'online', 
    message: 'Electronic Fridge Image Server is running!',
    uploadEndpoint: '/upload',
    staticEndpoint: '/uploads'
  });
});

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'No file uploaded.' });
  }

  // Construct the full URL
  // NOTE: In production/actual use, this URL would use the machine's local IP
  const fileUrl = `/uploads/${req.file.filename}`;
  
  console.log(`[Server] Image received: ${req.file.filename}`);
  
  res.send({ 
    message: 'Upload successful', 
    filename: req.file.filename,
    url: fileUrl 
  });
});

// Delete route
app.delete('/delete/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  // Security check: ensure the file is within the uploadDir
  if (!filePath.startsWith(uploadDir)) {
    return res.status(403).send({ error: 'Access denied.' });
  }

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`[Server] Delete failed: File not found - ${filename}`);
      return res.status(404).send({ error: 'File not found.' });
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`[Server] Error deleting file:`, err);
        return res.status(500).send({ error: 'Internal server error.' });
      }
      console.log(`[Server] Image deleted: ${filename}`);
      res.send({ message: 'File deleted successfully' });
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('---------------------------------------------');
  console.log(`Frost Image Server is running!`);
  console.log(`Local Access:  http://localhost:${PORT}`);
  console.log(`Network Access: http://<YOUR_IP>:${PORT}`);
  console.log('---------------------------------------------');
});
