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
  database: "anime",
  password: "Sqlisweird112@",
  port: "5433",
});
db.connect();

let isGenerated = false;
let existingAnime;
let existingPicture;
let currentAnimeId;
let error;
let existingTrailer;
let existingDescription;
let existingTitles;
let existingLink;
let users = [];
let currentUserId = false;

//////GET REQUEST
app.get("/", async (req, res) => {
  // server starting with false user id
  // CREATE OR LOGIN
  if (currentUserId === false) {
    const result = await db.query("SELECT id, username FROM users");
    users = result.rows;
    console.log(`CHECKS IF USERS EXISTS TO LOOP FOR MATCH`);
    console.log(users);
    res.render("index.ejs", {
      userId: currentUserId,
    });
  } else if (currentUserId !== false) {
    try {
      console.log(isGenerated);
      const result = await db.query(
        "SELECT anime_id, user_id FROM anime_list JOIN users ON users.id = user_id WHERE user_id = $1",
        [currentUserId]
      );
      if (isGenerated === true) {
        res.render("index.ejs", {
          picture: existingPicture,
          trailer: existingTrailer,
          url: existingLink,
          description: existingDescription,
          title: existingTitles,
          animeId: currentAnimeId,
          isGenerated: isGenerated,
        });
        isGenerated = false;
      } else {
        console.log(result.rows);
        res.render("index.ejs");
      }
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  }
});

// post request to get value/ID then send HTTP request to get anime via API with specific ID
app.post("/my-anime-list", async (req, res) => {
  currentAnimeId = parseInt(req.body.animeInput);
  let existingTitlesFiltered = [];
  let titles = [];
  let info = [];
  try {
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime/${currentAnimeId}/full`
    );
    const response1 = await axios.get(
      `https://api.jikan.moe/v4/anime/${currentAnimeId}/pictures`
    );

    existingAnime = response.data.data;
    existingTrailer = existingAnime.trailer.embed_url;
    existingDescription = existingAnime.synopsis;
    existingLink = existingAnime.url;
    titles = existingAnime.titles;
    titles.forEach((title) => {
      if (title.type === "Default") {
        existingTitlesFiltered.push(title.title);
      }
    });
    existingTitles = existingTitlesFiltered;
    existingPicture = existingAnime.images.jpg;
    isGenerated = true;
    res.redirect("/");
  } catch (err) {
    error = `The anime with id ${currentAnimeId} does not exist`;
    console.log(error);
    console.log("Error doesn't exist");
    res.redirect("/");
  }
});

app.post("/add-anime", async (req, res) => {
  if (req.body.animeId === "false") {
    res.render("/");
  } else {
    await db.query(
      "INSER INTO anime_list (anime_id, user_id) VALUES ($1, $2)",
      [currentAnimeId, currentUserId]
    );
  }
  console.log(req.body);
});

app.post("/username", async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    const password = req.body.password;
    const userExist = await users.find((user) => user.username === username);
    if (userExist === undefined) {
      console.log("CREATE ACCOUNT IF USERNAME DOESN'T EXIST");
      const id = await db.query(
        "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
        [username, password]
      );
      currentUserId = parseInt(id.rows[0].id);
    } else {
      console.log("CHECK FOR PASS");
      console.log(password);
      console.log(username);
      const result = await db.query(
        "SELECT id FROM users WHERE password = $1 AND username = $2",
        [password, username]
      );

      const checkId = result.rows;
      console.log(checkId.length);
      if (checkId.length < 1) {
        console.log("WRONG PASSWORD");
        error = "Password you've entered for this username is incorrect";
      } else {
        console.log("GOOD PASSWORD");
        currentUserId = userExist.id;
        console.log(currentUserId);
      }
    }
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
  //currentUserId;
});

// RUN THE SERVER
app.listen(port, () => {
  console.log(`Server is live on port:${port}`);
});
