const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use("/feedback", express.static("feedback"));

app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "pages", "feedback.html");
  res.sendFile(filePath);
});

app.get("/exists", (req, res) => {
  const filePath = path.join(__dirname, "pages", "exists.html");
  res.sendFile(filePath);
});

app.post("/create", async (req, res) => {
  try {
    const title = req.body.title;
    const content = req.body.text;

    const adjTitle = title.toLowerCase();

    const tempFilePath = path.join(__dirname, "temp", adjTitle + ".txt");
    const finalFilePath = path.join(__dirname, "feedback", adjTitle + ".txt");

    await fs.writeFile(tempFilePath, content);

    try {
      await fs.access(finalFilePath);
      return res.redirect("/exists");
    } catch {
      await fs.copyFile(tempFilePath, finalFilePath);
      await fs.unlink(tempFilePath);
      return res.redirect("/");
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

const PORT = process.env.PORT || 80;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});