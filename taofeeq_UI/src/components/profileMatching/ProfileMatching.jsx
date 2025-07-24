import { Paper, Grid, Typography, Box } from "@mui/material";
import { Tag, Typography as AntTypo } from "antd";
import { matches } from "../../traits";
import IcebreakersSelect from "../icebreakersSelect/IcebreakersSelect";
import DealbreakersSelect from "../dealbreakersSelect/DealbreakersSelect";

const ProfileMatching = ({ menu, inputs, handleChange, text = false }) => {
  const handleTagsChange = (value, name) => {
    handleChange({
      target: {
        name,
        value,
      },
    });
  };

  const handleTraitsChange = (traitKey, checked, list, name) => {
    const value = checked
      ? [...list, traitKey]
      : list.filter((t) => t !== traitKey);
    handleChange({
      target: {
        name,
        value,
      },
    });
  };

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
          <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text type="secondary">
                Open to matches from...
              </AntTypo.Text>{" "}
              <small
                style={{
                  fontSize: "10px",
                }}
              >
                <i>(Select all that apply)</i>
              </small>
            </Box>
            <Box>
              {matches.map((trait) => (
                <Tag.CheckableTag
                  key={trait.key}
                  checked={inputs.openToMatches.includes(trait.key)}
                  onChange={
                    text
                      ? null
                      : (checked) =>
                          handleTraitsChange(
                            trait.key,
                            checked,
                            inputs.openToMatches,
                            "openToMatches"
                          )
                  }
                >
                  {trait.value}
                </Tag.CheckableTag>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <IcebreakersSelect
              inputs={inputs}
              handleTagsChange={handleTagsChange}
              text={text}
            />
          </Grid>

          <Grid item xs={12}>
            <DealbreakersSelect
              inputs={inputs}
              handleTagsChange={handleTagsChange}
              text={text}
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileMatching;
