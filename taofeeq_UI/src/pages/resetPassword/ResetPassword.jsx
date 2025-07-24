import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Paper,
  Grid,
  Box,
  TextField,
  Button,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { message, Image } from "antd";
import { makeRequest } from "../../axios";
import OutsideWrapper from "../../components/outsideWrapper/OutsideWrapper";
import CircularProgress from "@mui/material/CircularProgress";
import { validatePassword } from "../../helpers";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const ResetPassword = () => {
  const [inputs, setInputs] = useState({
    password: "",
  });

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const navigate = useNavigate();

  const token = useLocation().pathname.split("/")[2];

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  //call backend forgot password
  const handleResetPassword = async (e) => {
    if (!(inputs.password.length >= 8)) {
      message.error("Password should be 8 characters or more");
      return;
    }

    if (!validatePassword(inputs.password)) {
      message.error(
        "Password should have uppercase, lowercase and numbers, no spaces"
      );
      return;
    }

    try {
      setLoading(true);

      await makeRequest.post("/auth/reset-password", {
        newPassword: inputs.password,
        token,
      });
      setSent(true);

      message.success("Successful, please login");
    } catch (error) {
      message.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OutsideWrapper>
      <Paper
        elevation={3}
        sx={{
          m: "20px",
        }}
      >
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Image
            width={200}
            src={`${process.env.PUBLIC_URL}/logo.png`}
            preview={false}
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          />

          <Box component="form" noValidate sx={{ mt: 2 }}>
            <TextField
              required
              fullWidth
              label="Your new password"
              name="password"
              onChange={handleChange}
              variant="standard"
              value={inputs.password}
              type={showPassword ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              onClick={handleResetPassword}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!inputs?.password?.length || sent}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Save New Password"
              )}
            </Button>
            <Grid container>
              <Grid item xs>
                <Link to="/login" variant="body2">
                  Login
                </Link>
              </Grid>
              <Grid item>
                <Link to="/register" variant="body2">
                  Sign Up
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </OutsideWrapper>
  );
};

export default ResetPassword;
