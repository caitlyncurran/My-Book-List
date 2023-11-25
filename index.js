import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import {password} from "./password.js";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booklist",
  password: password,
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let order = "ORDER BY rating DESC";

async function getList(order) {
  const result =
    await db.query(`SELECT title, author, reviews.isbn, date, rating, description 
        FROM books JOIN reviews ON books.isbn = reviews.isbn
        ${order}`);
  return result.rows;
}

app.get("/", async (req, res) => {
  const books = await getList(order);
  res.render("index.ejs", { books });
});

app.post("/add", async (req, res) => {
  res.render("new.ejs");
});

app.post("/new", async (req, res) => {
  const title = req.body.title;
  const author = req.body.author;
  const isbn = req.body.isbn;
  const rating = req.body.rating;
  const description = req.body.description;
  let date = new Date().toISOString().slice(0, 10);
  if (req.body.password === password) {
    try {
      await db.query(
        "INSERT INTO books (title, author, isbn) VALUES ($1, $2, $3)",
        [title, author, isbn]
      );
      await db.query(
        "INSERT INTO reviews (isbn, date, rating, description) VALUES ($1, $2, $3, $4)",
        [isbn, date, rating, description]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log("Password was incorrect.");
    res.redirect("/");
  }
});

app.post("/edit", async (req, res) => {
  const updatedRating = req.body.updatedRating;
  const updatedDescription = req.body.updatedDescription;
  const isbn = req.body.isbn;

  if (req.body.password === password) {
    try {
      await db.query(
        "UPDATE reviews SET (rating, description) = ($1, $2) WHERE isbn = ($3)",
        [updatedRating, updatedDescription, isbn]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log("Password was incorrect.");
    res.redirect("/");
  }
});

app.post("/delete", async (req, res) => {
  const isbn = req.body.deleteIsbn;

  if (req.body.password === password) {
    try {
      await db.query("DELETE FROM reviews WHERE isbn = ($1)", [isbn]);
      await db.query("DELETE FROM books WHERE isbn = ($1)", [isbn]);
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log("Password was incorrect.");
    res.redirect("/");
  }
});

app.post("/title", async (req, res) => {
  order = "ORDER BY title ASC";
  res.redirect("/");
});

app.post("/rating", async (req, res) => {
  order = "ORDER BY rating DESC";
  res.redirect("/");
});

app.post("/newest", async (req, res) => {
  order = "ORDER BY date DESC";
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

// for db - two tables: 1. title, author, isbn 2. isbn, date, rating, description. join tables at isbn
// img src - https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg
// using isbn 13
