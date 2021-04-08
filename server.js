'use strict';

const express = require('express'); // npm i express

require('dotenv').config(); 

const cors = require('cors'); // npm i cors

const app = express();

const superagent = require('superagent');

const PORT = process.env.PORT || 3030;

app.use(cors());

// Routes
app.get('/', homeRouteHandler);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/parks',parksHandler);
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
            res.send(locationData);
        })
        .catch(error => {
            res.send(error);
        })
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



function notFoundHandler(req, res) {
    res.status(404).send('Not Found');
}


app.listen(PORT,()=>{
    console.log(`Listening on PORT ${PORT}`)
})