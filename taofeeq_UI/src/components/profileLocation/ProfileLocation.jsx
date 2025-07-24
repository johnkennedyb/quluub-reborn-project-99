import { Paper, Grid, Typography, Box } from "@mui/material";
import EthnicitySelect from "../../components/ethnicitySelect/EthnicitySelect";
import CountrySelect from "../../components/countrySelect/CountrySelect";
import NationalitySelect from "../nationalitySelect/NationalitySelect";
import RegionSelect from "../regionSelect/RegionSelect";

const ProfileLocation = ({ menu, inputs, handleChange, text = false }) => {
  return (
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
        component="strong"
        sx={{
          textTransform: "capitalize",
          fontWeight: "bold",
          color: "#545e6f",
        }}
      >
        {menu.text}
      </Typography>
      <Box
        component="form"
        noValidate
        sx={{ my: 2, display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <Grid container rowSpacing={2} columnSpacing={1}>
          <Grid item xs={12} sm={6}>
            <CountrySelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <RegionSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <EthnicitySelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <NationalitySelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileLocation;
