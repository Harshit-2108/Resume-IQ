const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('templates'));
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

const db = new sqlite3.Database('db.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT,
    email TEXT,
    resume_path TEXT,
    message TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    resume_path TEXT,
    message TEXT
  )`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'resume.html'));
});

app.post('/signup_submit', (req, res) => {
  const { name, email, password } = req.body;
  db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, password], (err) => {
    if (err) return res.send('Signup failed. Try a different email.');
    res.redirect('/login.html');
  });
});

app.post('/login_submit', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
    if (row) {
      res.redirect('/resume.html');
    } else {
      res.send('Invalid login credentials.');
    }
  });
});

app.post('/apply_submit', upload.single('resume'), (req, res) => {
  const { fullName, email, message } = req.body;
  const resumePath = req.file.filename;
  db.run(`INSERT INTO applications (full_name, email, resume_path, message) VALUES (?, ?, ?, ?)`, [fullName, email, resumePath, message], (err) => {
    res.redirect('/confirmation.html');
  });
});

app.post('/upload_resume', upload.single('resume'), (req, res) => {
  const { name, email, message } = req.body;
  const resumePath = req.file.filename;
  db.run(`INSERT INTO resumes (name, email, resume_path, message) VALUES (?, ?, ?, ?)`, [name, email, resumePath, message], (err) => {
    res.redirect('/confirmation.html');
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
