import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Paper, Grid, Box, TextField, Button } from "@mui/material";
import { message, Image } from "antd";
import { makeRequest } from "../../axios";
import OutsideWrapper from "../../components/outsideWrapper/OutsideWrapper";
import CircularProgress from "@mui/material/CircularProgress";
import { isEmail } from "../../helpers";

const ForgotPassword = () => {
  const [inputs, setInputs] = useState({
    email: "",
  });

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  //call backend forgot password
  const handleForgotPassword = async (e) => {
    if (!isEmail(inputs.email)) {
      message.error("Please fill in a valid email address");
      return;
    }

    try {
      setLoading(true);
      await makeRequest.post("/auth/forgot-password", {
        email: inputs.email,
      });
      setSent(true);

      message.success("Successful, please check your email for a reset link");
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
              label="Your Email Address"
              name="email"
              onChange={handleChange}
              variant="standard"
              value={inputs.email}
            />

            <Button
              onClick={handleForgotPassword}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!inputs?.email?.length || sent}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Reset Password"
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

export default ForgotPassword;
