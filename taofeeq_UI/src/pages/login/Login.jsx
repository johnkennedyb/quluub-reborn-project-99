import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import {
  Paper,
  Grid,
  Box,
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { message, Image } from "antd";
import OutsideWrapper from "../../components/outsideWrapper/OutsideWrapper";
import CircularProgress from "@mui/material/CircularProgress";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Login = () => {
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      await login(inputs);
      navigate("/");
    } catch (err) {
      message.error(err?.response?.data);
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
        <Stack
          alignItems="center"
          spacing={4}
          sx={{
            my: 8,
            mx: 4,
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
              label="Username or Email Address"
              name="username"
              onChange={handleChange}
              variant="standard"
              value={inputs.username}
            />

            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              onChange={handleChange}
              variant="standard"
              value={inputs.password}
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
              onClick={handleLogin}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!inputs.password || !inputs.username}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Login"
              )}
            </Button>
            <Grid container>
              <Grid item xs>
                <Link to="/forgot-password" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link to="/register" variant="body2">
                  Sign Up
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Paper>
    </OutsideWrapper>
  );
};

export default Login;
