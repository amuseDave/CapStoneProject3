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

let currentUserId = 1;
//////GET REQUEST
app.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT anime_list.id, anime_id, user_id FROM anime_list JOIN users ON users.id = user_id WHERE user_id = $1",
      [currentUserId]
    );
    if (isGenerated) {
      console.log(existingPicture);
      console.log(existingTrailer);
      console.log(existingLink);
      console.log(existingDescription);
      console.log(existingTitles);
      isGenerated = false;
      res.render("index.ejs", {
        picture: existingPicture,
        trailer: existingTrailer,
        url: existingLink,
        description: existingDescription,
        title: existingTitles,
      });
    } else {
      res.render("index.ejs");
    }
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

// post request to get value/ID then send HTTP request to get anime via API with specific ID
app.post("/my-anime-list", async (req, res) => {
  currentAnimeId = parseInt(req.body.animeInput);
  let imagesArray = [];
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

// RUN THE SERVER
app.listen(port, () => {
  console.log(`Server is live on port:${port}`);
});
