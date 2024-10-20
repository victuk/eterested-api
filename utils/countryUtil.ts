import axios from "axios";

async function getCountryList() {
  try {
    const url =
      "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/countries.json";

    const apiResponse = await axios.get(url);

    const resJSON = apiResponse.data;

    const countries: Record<string, string>[] = [];

    resJSON.forEach((country: Record<string, string>) => {
      countries.push({
        name: country.name!,
        emoji: country.emoji!,
        phone_code: country.phone_code!,
        currency: country.currency!,
        currency_symbol: country.currency_symbol,
        id: country.id!,
      });
    });

    console.log(countries);

    return {
      response: countries,
      error: null
    }

  } catch (error) {
    return {
      response: null,
      error
    }
  }
}

async function getUserCoutryAndCurrency(userId: string, userType: "buyer" | "shopper" | "shop") {
  try {

    let response: object | null;

    // switch (userType) {
    //   case "buyer":
    //     response = await buyerCollection.findById(userId, "country countrySymbol currency");
    //     break;
    //   case "shop":
    //     response = await shopCollection.findById(userId, "country countrySymbol currency");
    //     break;
    //   case "shopper":
    //     response = await shopperCollection.findById(userId, "country countrySymbol currency");
    // }

    // if (!response) {
    //   return {
    //     response: null,
    //     error: "Can't find record."
    //   }
    // }

    return {
      // response,
      error: null
    }

  } catch (error) {
    return {
      response: null,
      error
    }
  }
}

export {
  getCountryList,
  getUserCoutryAndCurrency
}