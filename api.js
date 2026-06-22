import axios from "axios";
import { getActiveContextSync } from "./src/db/utils";
import EventEmitter from "eventemitter3";

export const authEvents = new EventEmitter();

// const baseURL = "http://192.168.1.166:8000/api"
const baseURL = "https://api.zeniabiz.com/api"
export let api = axios.create({baseURL})

api.interceptors.request.use(
  async (config) => {
    const ctx = getActiveContextSync();

    if (ctx?.access_token) {
      config.headers.Authorization = `Bearer ${ctx.access_token}`;
    }

    if (ctx?.company) {
      config.params = {
        ...config.params,
        company: ctx.company,
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  error => {
    
    if (error.response && error.response.status === 401) {
      authEvents.emit("unauthorized");
    }
    return Promise.reject(error);
  }
);

export let blogApi = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})
