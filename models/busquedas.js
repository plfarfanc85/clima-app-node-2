const fs = require("fs");

const axios = require("axios");

class Busquedas {
  //historial = [];

  constructor() {
    this.dbPath = "./db/database.json";
    this.leerDB();
  }

  // Formatea el historial colocando las primeras letras en mayuscula
  get historialCapitalizado() {
    return this.historial.map((lugar) => {
      let palabras = lugar.split(" ");
      palabras = palabras.map((p) => p[0].toUpperCase() + p.substring(1));

      return palabras.join(" ");
    });
  }

  // Configuracion parametros endpoint Mapbox
  get paramsMapbox() {
    return {
      access_token: process.env.MAPBOX_KEY,
      limit: 5,
      language: "es",
    };
  }

  // Configuracion parametros endpoint Weather
  get paramsWeather() {
    return {
      appid: process.env.OPENWEATHER_KEY,
      units: "metric",
      lang: "es",
    };
  }

  // Consultar ciudad - devulve ciudades encontradas por la palabra ingresada por el usuario
  async ciudad(lugar = "") {
    try {
      // Petición http
      const intance = axios.create({
        baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${lugar}.json`,
        params: this.paramsMapbox,
      });

      const resp = await intance.get();
      return resp.data.features.map((lugar) => ({
        id: lugar.id,
        nombre: lugar.place_name,
        lng: lugar.center[0],
        lat: lugar.center[1],
      }));
    } catch (error) {
      return [];
    }
  }

  // Buscar clima de la ciudad seleccionada mediante latitud y longitu
  async climaLugar(lat, lon) {
    try {
      const instance = axios.create({
        baseURL: `https://api.openweathermap.org/data/2.5/weather`,
        params: { ...this.paramsWeather, lat, lon },
      });

      const resp = await instance.get();
      const { weather, main } = resp.data;

      return {
        desc: weather[0].description,
        min: main.temp_min,
        max: main.temp_max,
        temp: main.temp,
      };
    } catch (error) {
      console.log(error);
    }
  }

  // Agregar ciudad buscada al historial
  agregarHistorial(lugar = "") {
    if (this.historial.includes(lugar.toLowerCase())) {
      return;
    }
    this.historial = this.historial.splice(0, 5);

    this.historial.unshift(lugar.toLowerCase());

    // Grabar en DB
    this.guardarDB();
  }

  // Guarda historial de busqueda, primeras letras de las palabras en minuscula
  guardarDB() {
    const payload = {
      historial: this.historial,
    };

    fs.writeFileSync(this.dbPath, JSON.stringify(payload));
  }

  leerDB() {
    if (!fs.existsSync(this.dbPath)) return;

    const info = fs.readFileSync(this.dbPath, { encoding: "utf-8" });
    const data = JSON.parse(info);

    this.historial = data.historial;
  }
}

module.exports = Busquedas;
