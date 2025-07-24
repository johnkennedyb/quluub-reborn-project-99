import "./navbar.scss";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import {
  Paper,
  Grid,
  Typography,
  Box,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { capitalizeFirstLetter } from "../../helpers";
import { Image } from "antd";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LogoutIcon from "@mui/icons-material/Logout";
import { makeRequest } from "../../axios";
import { useMutation } from "@tanstack/react-query";
import { message } from "antd";

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const mutation = useMutation(
    () => {
      return makeRequest.post("/auth/logout");
    },
    {
      onSuccess: () => {
        message.success("Logout Successful");
        localStorage.setItem("user", null);

        navigate("/login");
      },
    }
  );

  const handleLogout = () => {
    mutation.mutate();
  };

  return (
    <Paper
      elevation={1}
      sx={{
        marginTop: "5px",
        padding: "10px",
        position: "fixed",
        top: "10",
        width: "99%",
        zIndex: "100",
      }}
    >
      <Grid container justifyContent="space-between" alignItems="center">
        <Grid item xs={4} sm={4} md={4}>
          <Image
            width={150}
            src={`${process.env.PUBLIC_URL}/logo.png`}
            preview={false}
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          />
        </Grid>
        {/* <Grid item xs={4} sm={4} md={4}>
          <Typography
            variant="h6"
            sx={{
              color: "#545e6f",
            }}
          >
            {capitalizeFirstLetter(
              currentRoute.length ? currentRoute : "Dashboard"
            )}
          </Typography>
        </Grid> */}
        <Grid
          item
          xs={4}
          sm={4}
          md={4}
          style={{
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          {currentUser.hidden && (
            <Tooltip
              title={
                "Your profile is hidden from everyone, click here to become visible"
              }
            >
              <span>
                <IconButton onClick={() => navigate("/settings")}>
                  <VisibilityOffIcon style={{ color: "orange" }} />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <IconButton onClick={() => navigate("/search")}>
            <SearchIcon />
          </IconButton>
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              color: "#545e6f",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "teal",
              }}
              onClick={() => navigate("/profile")}
            >
              {currentUser?.kunya?.charAt(0).toUpperCase() ||
                currentUser?.username?.charAt(0).toUpperCase() ||
                "Q"}
            </Avatar>
            <Typography
              component="b"
              sx={{
                color: "#545e6f",
              }}
            >
              {capitalizeFirstLetter(currentUser.fname)}
            </Typography>
          </Box>
          <IconButton onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Navbar;
