const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "your-rds-endpoint.amazonaws.com",
  user: "admin",
  password: "yourpassword",
  database: "users_db"
});

app.post("/signup", async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (first_name, last_name, email, phone, password) VALUES (?, ?, ?, ?, ?)",
    [firstName, lastName, email, phone, hashedPassword],
    (err) => {
      if (err) return res.status(500).send({ message: "User already exists or DB error." });
      res.send({ message: "User created" });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(400).send({ message: "Invalid email" });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).send({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id }, "secretkey", { expiresIn: "1h" });
    res.send({ message: "Login successful", token });
  });
});

app.listen(5000, () => console.log("Server running on port 5000"));
