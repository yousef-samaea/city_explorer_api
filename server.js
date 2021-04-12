'use strict';

const express = require('express'); // npm i express

require('dotenv').config(); 

const cors = require('cors'); // npm i cors

const app = express();

const pg = require('pg');

const superagent = require('superagent');

const PORT = process.env.PORT || 3030;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(cors());

// Routes
app.get('/', homeRouteHandler);
app.get('/showlocation', locationTableHandler);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/parks',parksHandler);
app.get('/movies', moviesHandler);
app.get('*', notFoundHandler);


function homeRouteHandler(request, response) {
    response.status(200).send('you server is working good');
}


//functions
function locationHandler(req, res) {
    let cityName = req.query.city;
    console.log(cityName)
    let key = process.env.LOCATION_KEY;
    let LocURL = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

    superagent.get(LocURL)
        .then(geoData => {

            let gData = geoData.body;
            const locationData = new Location(cityName, gData);
      let SQL = `SELECT * FROM locations WHERE search_query=$1`; // Amman //check 
      let cityValue = [cityName]; //arr always 
      client.query(SQL, cityValue).then(result => {   //to sened to server
        if (result.rowCount) {
          res.send(result.rows[0]);
        }
        else {
          let search_query= locationData.search_query;
          let formatted_query = locationData.formatted_query;
          let latitude = locationData.latitude;
          let longitude = locationData.longitude;
          SQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
          let safeValues = [search_query,formatted_query,latitude,longitude];
          client.query(SQL,safeValues)
            .then(result=>{
              res.send(result.rows[0]);
            });
        }
      });
        })
        .catch(error => {
            res.send(error);
        })
}


function locationTableHandler (req,res){
  let SQL = `SELECT * FROM locations;`;
  client.query(SQL)
    .then (result=>{
      res.send(result.rows);
    })
    .catch(error=>{
      res.send(error);
    });
}



function weatherHandler(req, res) {
    let newData =[];
    let weatherda = req.query.search_query;
console.log(weatherda)
    let key = process.env.WEATHER_KEY;
    let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${weatherda}&key=${key}`;

    superagent.get(weatherURL) 
    .then(weatherdata => {

    
    let newData = weatherdata.body.data.map(item => {
      return new Weather(item)
   
    })
    res.status(200).send(newData);
})
.catch(error => {
    res.send(error);
  });


}

function parksHandler(req, res) {
  let parksArray = [];

    let parkName = req.query.search_query;
console.log(parkName)
    let key = process.env.PARK_KEY;
    let parksURL = `https://developer.nps.gov/api/v1/parks?q=${parkName}&limit=10&api_key=${key}`;
    superagent.get(parksURL)
      .then(parkData => {

        parkData.body.data.map (val => {
          const parksD = new Park (val);
          parksArray.push(parksD);

        });
        res.send(parksArray);

      })
  
      .catch(error => {
        console.log('inside superagent');
        console.log('Error in getting data from nps.gov server');
        console.error(error);
        res.send(error);
      });
    console.log('after superagent');
  }

  function moviesHandler(req, res) {
    let mArr =[];
    let mKey = process.env.MOVIES_KEY;
    let mURL = `https://api.themoviedb.org/3/discover/movie?api_key=${mKey}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false`;
    superagent.get(mURL)
      .then(geoData => {
        let geoD = geoData.body.results;
        geoD.map (movieValue => {
          const moviesData = new Movie(movieValue);
          mArr.push(moviesData);
        });
        res.send(mArr);
      })
      .catch(error => {
        res.send(error);
      });
    console.log('after superagent');
  }


//Constructors
function Location(cityName, geoData) {
    this.search_query = cityName;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}

function Weather(weatData) { 

    this.forecast = weatData.weather.description;
    this.time = weatData.datetime
}


function Park (parksD) {
    this.name = parksD.fullName;
    this.address = `${parksD.addresses[0].line1},
    ${parksD.addresses[0].city},
    ${parksD.addresses[0].stateCode},
    ${parksD.addresses[0].postalCode}`;
    this.fee = parksD.fees;
    this.description = parksD.description;
    this.url = parksD.url;
  }

  function Movie (movieData){
    this.title = movieData.original_title;
    this.overview = movieData.overview;
    this.average_votes = movieData.vote_average;
    this.total_votes = movieData.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500${movieData.poster_path}`;
    this.popularity = movieData.popularity;
    this.released_on = movieData.release_date;
  }


function notFoundHandler(req, res) {
    res.status(404).send('Not Found');
}


client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  });
