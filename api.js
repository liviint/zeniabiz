import axios from "axios";
import {safeLocalStorage} from './utils/storage'

const baseURL = "http://192.168.8.95:8000/api/"

export let api = axios.create({baseURL})

api.interceptors.request.use(
  async(config) => {
      const token = await safeLocalStorage.getItem("token")
      if(token) config.headers.Authorization = `Bearer ${token}`;
      return config;
  },
  error => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      //window.location.href = '/';
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
