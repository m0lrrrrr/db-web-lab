const path = require("node:path");
const express = require("express");
const mongoose = require("mongoose");

const mongoUrl = process.env.MONGO_URL;
if (!mongoUrl) {
  console.error("MONGO_URL is not set. Start the server with: npm run start:mongo");
  process.exit(1);
}

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be an integer between 1 and 65535");
  process.exit(1);
}

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "age must be a whole number"
    }
  },
  city: { type: String, trim: true, default: "" },
  course: { type: String, trim: true, default: "" }
}, { collection: "students" });

const Student = mongoose.model("Student", studentSchema);
const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().lean();
    res.json(students);
  } catch (error) {
    console.error("Failed to load students:", error);
    res.status(500).json({ success: false, message: "Оюутнуудыг уншихад алдаа гарлаа" });
  }
});

app.post("/api/students", async (req, res) => {
  const { name, age, city = "", course = "" } = req.body || {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Нэр оруулна уу"
    });
  }
  if (!Number.isInteger(age) || age < 0) {
    return res.status(400).json({
      success: false,
      message: "Нас бүхэл тоо байх ёстой"
    });
  }
  if (typeof city !== "string" || typeof course !== "string") {
    return res.status(400).json({
      success: false,
      message: "Хот болон хичээл текст байх ёстой"
    });
  }

  try {
    const student = await Student.create({
      name: name.trim(),
      age,
      city: city.trim(),
      course: course.trim()
    });
    res.status(201).json(student);
  } catch (error) {
    console.error("Failed to add student:", error);
    res.status(500).json({ success: false, message: "Оюутан нэмэхэд алдаа гарлаа" });
  }
});

mongoose.connect(mongoUrl)
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`MongoDB connected; student app is available at http://localhost:${port}`);
    });
    server.on("error", (error) => {
      console.error(`HTTP server failed to start on port ${port}:`, error.message);
      process.exitCode = 1;
      mongoose.disconnect().catch((disconnectError) => {
        console.error("Failed to close MongoDB connection:", disconnectError.message);
      });
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  });