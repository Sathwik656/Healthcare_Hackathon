import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';



const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, 
});

export default api;