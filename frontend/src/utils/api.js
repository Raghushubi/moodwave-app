import axios from "axios";

// This connects React (frontend) to your backend server
const API = axios.create({
  baseURL: "http://localhost:5000/api",  // backend base URL
});

export default API;
