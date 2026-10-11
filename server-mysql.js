const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "", // MySQL-д нууц үг тохируулсан бол хашилтын дотор бичнэ
  database: "school_db"
});

app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.name, s.age, s.city, c.title AS course
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      ORDER BY s.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Серверийн алдаа" });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const { name, age, city } = req.body || {};
    if (!name || !Number.isInteger(age)) {
      return res.status(400).json({
        success: false,
        message: "name болон age шаардлагатай"
      });
    }

    const [result] = await pool.query(
      "INSERT INTO students (name, age, city) VALUES (?, ?, ?)",
      [name, age, city || null]
    );
    res.status(201).json({ id: result.insertId, name, age, city });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Серверийн алдаа" });
  }
});

app.listen(3000, () => console.log("http://localhost:3000"));