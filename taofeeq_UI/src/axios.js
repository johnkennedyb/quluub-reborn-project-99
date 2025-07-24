import axios from "axios";

export const makeRequest = axios.create({
  baseURL: process.env.REACT_APP_baseURL,
  withCredentials: true,
});

makeRequest.interceptors.response.use(
  (response) => {
    // If the response is successful, just return the response
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.error("Backend responded with an error:");

      if (error.response.status === 401) {
        // Handle unauthorized error
        window.location.href = "/login";
      }
    }

    // Optionally, return a specific error message or object to handle in your application
    return Promise.reject(error);
  }
);
