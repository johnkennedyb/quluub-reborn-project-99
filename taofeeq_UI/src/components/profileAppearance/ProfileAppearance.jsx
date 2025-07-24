import { Paper, Grid, Typography, Box } from "@mui/material";
import BuildSelect from "../../components/buildSelect/BuildSelect";
import FacialSelect from "../../components/facialSelect/FacialSelect";
import HeightSelect from "../heightSelect/HeightSelect";
import WeightInput from "../weightInput/WeightInput";
import GenotypeSelect from "../genotypeSelect/GenotypeSelect";
import DressingCoveringInput from "../dressingCoveringInput/DressingCoveringInput";

const ProfileAppearance = ({ menu, inputs, handleChange, text = false }) => {
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
          <Grid item xs={12} sm={5}>
            <HeightSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <WeightInput
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <GenotypeSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <BuildSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FacialSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12}>
            <DressingCoveringInput
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

export default ProfileAppearance;
