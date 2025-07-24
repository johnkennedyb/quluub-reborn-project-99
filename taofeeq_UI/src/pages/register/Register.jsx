import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Paper,
  Grid,
  Box,
  TextField,
  Button,
  Select,
  InputLabel,
  MenuItem,
  FormControl,
  Stack,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { message, Image } from "antd";
import OutsideWrapper from "../../components/outsideWrapper/OutsideWrapper";
import CircularProgress from "@mui/material/CircularProgress";
import { isEmail, validatePassword } from "../../helpers";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Register = () => {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
    password: "",
    fname: "",
    lname: "",
    gender: "",
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

  const handleChange = (e) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: ["email", "username"].includes(e.target.name)
        ? e.target.value.trim()
        : e.target.value,
    }));
  };

  const handleClick = async (e) => {
    e.preventDefault();

    const valid = Object.values(inputs).every((value) => !!value);

    if (!valid) {
      message.error("Please fill in all fields with valid values");
      return;
    }

    if (!isEmail(inputs.email)) {
      message.error("Please fill in a valid email address");
      return;
    }

    if (!(inputs.username.length >= 5)) {
      message.error("Username should be 5 characters or more");
      return;
    }

    if (!/^[a-z0-9]*$/.test(inputs.username)) {
      message.error(
        'Username should only include small letters and numbers. For example, "user123" and no spaces'
      );
      return;
    }

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

      const res = await axios.post(
        `${process.env.REACT_APP_baseURL}auth/register`,
        inputs
      );

      message.success(res.data);

      message.success(
        "Please check your mail inbox (and spam folder) to validate your email address",
        10
      );

      message.success(
        "If you do not receive it in 2 hours, please contact support",
        10
      );

      navigate("/login");
    } catch (err) {
      message.error(err.response.data);
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
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="First Name"
                  name="fname"
                  onChange={handleChange}
                  value={inputs.fname}
                  variant="standard"
                  helperText="This will not be visible to other users"
                  FormHelperTextProps={{
                    style: { color: "orange" },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Last Name"
                  name="lname"
                  value={inputs.lname}
                  onChange={handleChange}
                  variant="standard"
                  helperText="This will not be visible to other users"
                  FormHelperTextProps={{
                    style: { color: "orange" },
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={1}>
              <Grid item xs={8} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Username"
                  name="username"
                  value={inputs.username}
                  onChange={handleChange}
                  variant="standard"
                  helperText="We recommend not using your real names"
                  FormHelperTextProps={{
                    style: { color: "orange" },
                  }}
                />
              </Grid>
              <Grid item xs={4} sm={6}>
                <FormControl variant="standard" required fullWidth>
                  <InputLabel id="demo-simple-select-standard-label">
                    Gender
                  </InputLabel>

                  <Select
                    labelId="demo-simple-select-standard-label"
                    id="demo-simple-select-standard"
                    value={inputs.gender}
                    onChange={handleChange}
                    label="Gender"
                    variant="standard"
                    name="gender"
                    required
                  >
                    <MenuItem value={"male"}>Male</MenuItem>
                    <MenuItem value={"female"}>Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              required
              fullWidth
              label="Email Address"
              name="email"
              autoComplete="email"
              onChange={handleChange}
              variant="standard"
              value={inputs.email}
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
              helperText="We strongly advice using special characters as well"
              FormHelperTextProps={{
                style: { color: "orange" },
              }}
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
              onClick={handleClick}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Register"
              )}
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link to="/login" variant="body2">
                  Login
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Paper>
    </OutsideWrapper>
  );
};

export default Register;
