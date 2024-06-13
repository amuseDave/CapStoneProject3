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
let animeList;
let currentUser = [];

//////GET REQUEST
app.get("/", async (req, res) => {
  //1 step
  // Server starting with false user id
  // CREATE ACC OR LOGIN
  //
  if (currentUserId === false) {
    const result = await db.query("SELECT id, username FROM users");
    users = result.rows;
    console.log(`CHECKS IF USERS EXISTS TO LOOP FOR MATCH`);
    console.log(users);
    res.render("index.ejs", {
      userId: currentUserId,
      error: error,
    });
    error = "";
  }
  // 2 step
  // USER LOGGED IN AND SET THEIR CURRENT ID
  // ID CAN ACCESS THEIR DATA
  //
  else if (currentUserId !== false) {
    const filteringAnime = [];
    try {
      // 3 step
      // Get their data with user id
      console.log("Checks if anime is generated for saving:");
      console.log(isGenerated);
      const result = await db.query(
        "SELECT anime_id FROM anime_list JOIN users ON users.id = user_id WHERE user_id = $1 ORDER BY anime_list.id DESC",
        [currentUserId]
      );
      //FILTERING CURRENT USER ANIME
      //
      result.rows.forEach((row) => {
        filteringAnime.push(row.anime_id);
      });
      animeList = filteringAnime;
      console.log("CURRENT USER ANIME LIST IDs");
      console.log(animeList);
      //
      //FILTERING FULL DATA LIST ANIME OF CURRENT USER
      //3.5 GET THEIR ANIME LIST
      console.log("Getting their anime list");

      const filteringAnimeData = await Promise.all(
        animeList.map(async (favAnimeId) => {
          const response = await axios.get(
            `https://api.jikan.moe/v4/anime/${favAnimeId}/full`
          );
          const animeData = response.data.data;
          const animeLink = animeData.url;
          const animeTitles = animeData.titles;
          const animePicture = animeData.images.jpg.large_image_url;
          const animeTitle = animeTitles.find(
            (title) => title.type === "Default"
          );

          return {
            userID: currentUserId,
            animeID: favAnimeId,
            title: animeTitle.title,
            link: animeLink,
            image: animePicture,
          };
        })
      );

      // Now filteringAnimeData contains all the fetched data
      console.log("FILTERRED ANIME LIST FOR DISPLAYING");
      console.log(filteringAnimeData);
      //
      //

      // 4-5 step if it is generated display it
      // and + their anime list
      if (isGenerated === true) {
        res.render("index.ejs", {
          picture: existingPicture,
          trailer: existingTrailer,
          url: existingLink,
          description: existingDescription,
          title: existingTitles,
          animeId: currentAnimeId,
          isGenerated: isGenerated,
          favAnimes: filteringAnimeData,
          user: currentUser,
          error: error,
        });
        isGenerated = false;
        console.log("FILTERRED ANIME LIST FOR DISPLAYING");
        console.log(filteringAnimeData);
      }
      // 4-5 step if it is not generated
      // display their current anime list only
      else {
        console.log("FILTERRED ANIME LIST FOR DISPLAYING");
        console.log(filteringAnimeData);
        res.render("index.ejs", {
          favAnimes: filteringAnimeData,
          user: currentUser,
          error: error,
        });
      }
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  }
});

// post request to get value/ID of anime and display to add or no
app.post("/my-anime-list", async (req, res) => {
  currentAnimeId = parseInt(req.body.animeInput);
  let existingTitlesFiltered = [];
  let titles = [];
  let info = [];
  try {
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime/${currentAnimeId}/full`
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
    error = `The anime with id ${currentAnimeId} does not exist, OR RECEIVED TOO MANY REQUEST`;
    console.log(error);
    isGenerated = false;
    res.redirect("/");
  }
});

app.post("/add-anime", async (req, res) => {
  if (req.body.animeId === "false") {
    res.redirect("/");
  } else {
    await db.query(
      "INSERT INTO anime_list (anime_id, user_id) VALUES ($1, $2)",
      [currentAnimeId, currentUserId]
    );
    res.redirect("/");
  }
});

app.post("/username", async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    currentUser = req.body.username;
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
        console.log("CURRENT USER ID");
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
