const express = require("express");
const router = express.Router();
const axios = require("axios");

const getLocationFromReq = require("../lib/get-location-from-req.js");

router.post("/yolo", (req, res, next) => {
  console.log(req.body.lat);
  const { lat, long } = req.body;
  return res.status(200).send("ok");
});

router.get("/similar-artist", (req, res, next) => {
  const url =
    "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term";
  const accessToken = "Bearer " + req.user.spotifyAccesToken;
  const apiKey = process.env.SONGKICK_API_KEY;
  const location = getLocationFromReq(req, "/similar-artist");

  axios
    .get(url, { headers: { Authorization: accessToken } })

    .then(response => {
      const artistIds = [];
      response.data.items.forEach(oneArtist => {
        artistIds.push(oneArtist.id);
      });
      const allIndex = artistIds.map(oneId => {
        return axios
          .get(`https://api.spotify.com/v1/artists/${oneId}/related-artists`, {
            headers: { Authorization: accessToken }
          })
          .catch(err => {
            next(err);
          });
      });
      const relatedArtistsName = [];
      const infoArtists = [];

      Promise.all(allIndex).then(results => {
        infoArtists.push(results[0].data);
        results.forEach(oneSimilarName => {
          oneSimilarName.data.artists.map(oneArtistName => {
            relatedArtistsName.push(oneArtistName.name);
          });
        });
        const fullConcertArray = [];

        const eventIndex = relatedArtistsName.map(oneQuery => {
          const formattedName = encodeURIComponent(oneQuery);

          const url = `https://api.songkick.com/api/3.0/events.json?apikey=${apiKey}&artist_name=${formattedName}&location=geo:48.866667,2.333333`;

          return axios.get(url);
        });

        Promise.all(eventIndex)
          .then(resultArray => {
            resultArray.forEach(oneResponse => {
              if (oneResponse.data.resultsPage.totalEntries !== 0) {
                fullConcertArray.push(oneResponse.data);
              }
            });
            res.json(fullConcertArray);
          })
          .catch(err => next(err));
      });
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
