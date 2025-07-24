import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useMediaQuery, useTheme } from "@mui/material";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const login = async (inputs) => {
    const res = await axios.post(
      `${process.env.REACT_APP_baseURL}auth/login`,
      inputs,
      {
        withCredentials: true,
      }
    );

    setCurrentUser(res.data);
  };

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(currentUser));
  }, [currentUser]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <AuthContext.Provider
      value={{ currentUser, login, setCurrentUser, isMobile, isMd }}
    >
      {children}
    </AuthContext.Provider>
  );
};
