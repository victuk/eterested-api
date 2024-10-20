import axios from "axios";

const key = process.env.GOOGLE_LOCATION_API_KEY;

async function getLatitudeAndLongitudeFromAddress(address:string) {
    const encodedAddress = encodeURIComponent(address);
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${key}`);
    
    return response.data.results[0].geometry.location; // returns {lat, lng}
}

async function getDistanceFromLongitudeAndLatitudePairs(lat1: number, lng1: number, lat2: number, lng2: number) {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${lat1},${lng1}&destinations=${lat2},${lng2}&key=${key}`);

    console.log(JSON.stringify(response.data));

    return {
        distance: response.data.rows[0].elements[0].distance.text,
        duration: response.data.rows[0].elements[0].duration.text
    };
}

function serviceAndDeliveryFee(durationInMinutes: string) {
    const duration = durationInMinutes.split(" ");

    var time;

    if(durationInMinutes.includes("hour")) {
        time = convertToMinutes(duration);
    } else {
        time = parseFloat(durationInMinutes.split(" ")[0]);
    }

    const timeToInteger = time;

    let deliveryFee = 0;

    let shoppingFee = 200;

    if(timeToInteger <= 5) {
        deliveryFee = 600;
    } else if(timeToInteger >= 6 && timeToInteger <= 10) {
        deliveryFee = 650;
    } else if(timeToInteger >= 11 && timeToInteger <= 15) {
        deliveryFee = 700;
    } else if(timeToInteger >= 16 && timeToInteger <= 20) {
        deliveryFee = 750;
    } else if(timeToInteger >= 21 && timeToInteger <=  25) {
        deliveryFee = 800;
    } else if(timeToInteger >= 26 && timeToInteger <=  30) {
        deliveryFee = 850;
    } else if(timeToInteger >= 31 && timeToInteger <=  35) {
        deliveryFee = 900;
    } else if(timeToInteger >= 36 && timeToInteger <=  40) {
        deliveryFee = 950;
    } else if(timeToInteger >= 41 && timeToInteger <=  45) {
        deliveryFee = 1000;
    } else if(timeToInteger >= 46 && timeToInteger <=  50) {
        deliveryFee = 1050;
    } else if(timeToInteger >= 51 && timeToInteger <=  55) {
        deliveryFee = 1100;
    } else if(timeToInteger >= 56 && timeToInteger <=  60) {
        deliveryFee = 1150;
    } else {
        deliveryFee = 1200;
    }

    return {
        shoppingFee,
        deliveryFee
    }

}


function convertToMinutes(timeParts: Array<string>) {
  
    let hours = 0;
    let minutes = 0;
  
    for (let i = 0; i < timeParts.length; i++) {
      const part = timeParts[i];
      const previous = timeParts[i - 1];
  
      if (part == 'hour' || part == 'hours') {
        hours = parseInt(previous);
      } else if (part == 'min' || part == 'mins') {
        minutes = parseInt(previous);
      }
    }
  
    const totalMinutes = hours * 60 + minutes;
  
    return totalMinutes;
  }

export {
    getLatitudeAndLongitudeFromAddress,
    getDistanceFromLongitudeAndLatitudePairs,
    serviceAndDeliveryFee
};