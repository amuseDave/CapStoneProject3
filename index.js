import pg from "pg";
import axios from "axios";
import express from "express";
import bodyParser from "body-parser";

// SETUP DataBase, bodyParser/req.body access, public folder, port
const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "Sqlisweird112@",
  port: "5433",
});
db.connect();

//////GET REQUEST
app.get("/", (req, res) => {
  res.render("index.ejs");
});

// RUN THE SERVER
app.listen(port, () => {
  console.log(`Server is live on port:${port}`);
});
