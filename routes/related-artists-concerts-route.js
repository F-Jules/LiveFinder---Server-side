const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/similar-artist", (req, res, next) => {
  // console.log("Hello World");
  const url =
    "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term";
  const accessToken = "Bearer " + req.user.spotifyAccesToken;
  const apiKey = process.env.SONGKICK_API_KEY;

  axios
    .get(url, { headers: { Authorization: accessToken } })

    .then(response => {
      // console.log(response.data);
      const artistIds = [];
      response.data.items.forEach(oneArtist => {
        artistIds.push(oneArtist.id);
      });
      // console.log(artistIds);
      const allIndex = artistIds.map(oneId => {
        return axios
          .get(`https://api.spotify.com/v1/artists/${oneId}/related-artists`, {
            headers: { Authorization: accessToken }
          })
          .catch(err => {
            next(err);
          });
      });
      // console.log(allIndex);
      const relatedArtistsName = [];

      Promise.all(allIndex).then(results => {
        // console.log(results[0].data);
        results.forEach(oneSimilarName => {
          // console.log(oneSimilarName.data.artists.name);
          oneSimilarName.data.artists.map(oneArtistName => {
            // console.log(oneArtistName.name);
            relatedArtistsName.push(oneArtistName.name);
          });
        });
        const fullConcertArray = [];
        const location = req.ip === "::1" ? "clientip" : req.ip;

        const eventIndex = relatedArtistsName.map(oneQuery => {
          const formattedName = encodeURIComponent(oneQuery);
          const url = `https://api.songkick.com/api/3.0/events.json?apikey=${apiKey}&artist_name=${formattedName}&location=${location}`;

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