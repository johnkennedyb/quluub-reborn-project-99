import { Paper, Grid, Typography, Box } from "@mui/material";
import MaritalSelect from "../../components/maritalSelect/MaritalSelect";
import DOBInput from "../../components/dobInput/DOBInput";
import KunyaInput from "../../components/kunyaInput/KunyaInput";
import ChildrenInput from "../childrenInput/ChildrenInput";
import SummaryInput from "../summaryInput/SummaryInput";
import WorkEducationInput from "../workEducationInput/WorkEducationInput";

const ProfileBasicInfo = ({ menu, inputs, handleChange, text = false }) => {
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
        component="strong"
        sx={{
          textTransform: "capitalize",
          fontWeight: "bold",
          color: "#545e6f",
        }}
      >
        {menu.text}
      </Typography>
      <Box component="form" noValidate sx={{ my: 2 }}>
        <Grid container rowSpacing={2} columnSpacing={1}>
          <Grid item xs={12} sm={6}>
            <KunyaInput
              handleChange={handleChange}
              inputs={inputs}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DOBInput handleChange={handleChange} inputs={inputs} text={text} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <MaritalSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <ChildrenInput
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12}>
            <SummaryInput
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12}>
            <WorkEducationInput
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  ) : null;
};

export default ProfileBasicInfo;
