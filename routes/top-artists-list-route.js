const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/top-artists-list", (req, res, next) => {
  const url = "https://api.spotify.com/v1/me/top/artists?limit=5";
  const accessToken = "Bearer " + req.user.spotifyAccesToken;

  axios
    .get(url, { headers: { Authorization: accessToken } })
    .then(response => {
      res.json(response.data);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
