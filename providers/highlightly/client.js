const axios = require("axios");

const BASE_URL = process.env.HIGHLIGHTLY_BASE_URL;
const API_KEY = process.env.HIGHLIGHTLY_API_KEY;

if (!BASE_URL) {
  throw new Error("HIGHLIGHTLY_BASE_URL is missing from .env");
}

if (!API_KEY) {
  throw new Error("HIGHLIGHTLY_API_KEY is missing from .env");
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "x-rapidapi-key": API_KEY,
  },
});

client.interceptors.request.use((config) => {
  console.log(
    `🏉 HIGHLIGHTLY → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
  );

  return config;
});

client.interceptors.response.use(
  (response) => {
    console.log(
      `✅ HIGHLIGHTLY ${response.status} (${response.config.url})`
    );

    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `❌ HIGHLIGHTLY ERROR ${error.response.status}`,
        error.response.data
      );
    } else {
      console.error(
        "❌ HIGHLIGHTLY NETWORK ERROR",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

module.exports = client;