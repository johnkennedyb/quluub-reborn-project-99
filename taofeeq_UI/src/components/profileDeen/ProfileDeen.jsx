import { Paper, Grid, Typography, Box } from "@mui/material";
import { Tag, Typography as AntTypo } from "antd";
import { deenTraits } from "../../traits";
import SalaahSelect from "../../components/salaahSelect/SalaahSelect";
import RevertSelect from "../../components/revertSelect/RevertSelect";
import StartedPracticingInput from "../startedPracticingInput/StartedPracticingInput";
import ScholarsSpeakersInput from "../scholarsSpeakersInput/ScholarsSpeakersInput";

const ProfileDeen = ({ menu, inputs, handleChange, text = false }) => {
  const handleTraitsChange = (traitKey, checked) => {
    const value = checked
      ? [...inputs.traits, traitKey]
      : inputs.traits.filter((t) => t !== traitKey);
    handleChange({
      target: {
        name: "traits",
        value,
      },
    });
  };

  const deenTraitsComp = deenTraits
    .filter((trait) => (text ? inputs.traits.includes(trait.key) : true))
    .map((trait) => (
      <Tag.CheckableTag
        key={trait.key}
        checked={inputs.traits.includes(trait.key)}
        onChange={
          text ? null : (checked) => handleTraitsChange(trait.key, checked)
        }
      >
        {trait.value}
      </Tag.CheckableTag>
    ));

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
            <RevertSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StartedPracticingInput
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12}>
            <SalaahSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          {/* <Grid item xs={4}>
            <SectSelect
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid> */}

          <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text>
                {text ? "Deen traits:" : "Which of these describe you"}
              </AntTypo.Text>{" "}
              {!text && (
                <small
                  style={{
                    fontSize: "10px",
                  }}
                >
                  <i>(Select all that apply)</i>
                </small>
              )}
            </Box>
            {deenTraitsComp?.length ? (
              <Box>{deenTraitsComp}</Box>
            ) : (
              <AntTypo.Text type="secondary">Not set</AntTypo.Text>
            )}
          </Grid>

          <Grid item xs={12}>
            <ScholarsSpeakersInput
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          {/* <Grid item xs={12}>
            <IslamicPracticeInput
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid> */}
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileDeen;
