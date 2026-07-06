/**
 * TCSS 460
 * 7/5/2026
 * Assignment 2
 *
 * app.js, the entrypoint and route handling for the web app.
 *
 * @author Eyhab Al-Masri
 * @author Landon Wardle
 *
 * @version 1.0
 */

const express = require("express");
const path = require("path");

// Starter data file.

// at least 5 criteria, and at least 5 alternatives.
const decisionData = require("./data/decision-data.json");
const { normalizeWeights, weightGames } = require("./src/scoring");

const app = express();
const PORT = 4000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Home page
app.get("/", function (req, res) {
  res.render("index", {
    title: "Home",
    activePage: "home",
    appName: decisionData.appName
  });
});

// About / information page
app.get("/about", function (req, res) {
  res.render("about", {
    title: "About",
    activePage: "about",
    data: decisionData
  });
});

// Recommender form page
app.get("/tool", function (req, res) {
  res.render("tool", {
    title: "Recommender Tool",
    activePage: "tool",
    data: decisionData
  });
});

// Results route
app.post("/tool/results", function (req, res) {
  // TODO: Render the results page with the ranked alternatives.

  const weights = {};

  for (const [key, value] of Object.entries(req.body)) {
      if (key !== "method") {
        weights[key] = value;
      }
  }

  const normalizedWeights = normalizeWeights(weights);
  const rankedResults = weightGames(decisionData.alternatives, normalizedWeights, req.body.method);

  res.render("results", {
    title: "Results",
    activePage: "tool",
    data: decisionData,
    formData: req.body,
    selectedMethod: req.body.method,
    normalizedWeights: normalizedWeights,
    rankedResults: rankedResults,
  });
});

// 404 page
app.use(function (req, res) {
  res.status(404).render("404", {
    title: "Page Not Found",
    activePage: ""
  });
});

app.listen(PORT, function () {
  console.log("Assignment 2 starter app running at http://localhost:" + PORT);
});
