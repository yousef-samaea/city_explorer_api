'use strict';

const express = require('express'); // npm i express
require('dotenv').config(); 

const cors = require('cors'); // npm i cors

const server = express();

const PORT = process.env.PORT || 5000;

server.use(cors());

function Location(locData) {

  
    this.search_query = 'irbid';
    this.formatted_query =  locData[0].display_name;
    this.latitude = locData[0].lat;
    this.longitude = locData[0].lon;

}

function Weather(weatData) {

  
    this.forecast = weatData.weather.description;
    this.time = weatData.datetime
}



server.get('/',(req,res)=>{
    res.send('you server is working')
})




server.get('/location',(req,res)=>{

    let locationdat = require('./data/location.json');

    let locationData = new Location (locationdat);
 
    res.status(200).send(locationData);
})


server.get('/weather',(req,res)=>{

    let weatherda = require('./data/weather.json');
    console.log(weatherda)
    let newarr = [];
    weatherda.data.forEach(item => {
        let obj = new Weather(item)
        newarr.push(obj)
    })
    res.status(200).send(newarr);
})

server.get('*',(req,res)=>{
 
    let errObj = {
        status: 500,
        responseText: "Sorry, something went wrong"
    }

    res.status(500).send(errObj);
})
















server.listen(PORT,()=>{
    console.log(`Listening on PORT ${PORT}`)
})