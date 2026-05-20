import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// API.interceptors.request.use((config) => {
//   const token = localStorage.getItem("kist_token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default API;
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("kist_token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;