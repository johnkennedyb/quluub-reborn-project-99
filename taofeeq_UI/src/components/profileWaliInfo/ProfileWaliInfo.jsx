import { Paper, Grid, Typography, Box } from "@mui/material";
import { Typography as AntTypography } from "antd";
import WaliNameInput from "../waliNameInput/WaliNameInput";
import WaliEmailInput from "../waliEmailInput/WaliEmailInput";
import WaliPhoneNumber from "../waliPhoneNumber/WaliPhoneNumber";

const ProfileWaliInfo = ({
  menu,
  inputs,
  handleChange,
  text = false,
  canSeeWaliDetails = false,
}) => {
  return menu && inputs && handleChange ? (
    <Paper
      elevation={1}
      sx={{
        padding: "20px",
        marginRight: "10px",
        height: "60vh",
        overflow: "auto",
        scrollbarWidth: "thin",
        marginBottom: "10px",
      }}
      ref={menu.to}
    >
      <Typography
        component="p"
        sx={{
          textTransform: "capitalize",
          fontWeight: "bold",
          color: "#545e6f",
        }}
      >
        {menu.text}
      </Typography>
      {canSeeWaliDetails ? (
        <>
          <Box
            component="form"
            noValidate
            sx={{
              my: 2,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <Grid container rowSpacing={2} columnSpacing={1}>
              <Grid item xs={12} sm={6}>
                <WaliNameInput
                  handleChange={handleChange}
                  inputs={inputs}
                  text={text}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <WaliEmailInput
                  handleChange={handleChange}
                  inputs={inputs}
                  text={text}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <WaliPhoneNumber
                  inputs={inputs}
                  handleChange={handleChange}
                  type={"whatsapp"}
                  text={text}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <WaliPhoneNumber
                  inputs={inputs}
                  handleChange={handleChange}
                  type={"telegram"}
                  text={text}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <WaliPhoneNumber
                  inputs={inputs}
                  handleChange={handleChange}
                  type={"otherNumber"}
                  text={text}
                />
              </Grid>
            </Grid>
          </Box>
        </>
      ) : (
        <AntTypography.Text type="secondary">
          You have to be matched to see Wali details
        </AntTypography.Text>
      )}
    </Paper>
  ) : null;
};

export default ProfileWaliInfo;
