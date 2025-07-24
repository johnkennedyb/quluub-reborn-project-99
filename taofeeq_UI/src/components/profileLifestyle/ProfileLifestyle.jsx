import { Paper, Grid, Typography, Box } from "@mui/material";
import { traits } from "../../traits";

import { Tag, Typography as AntTypo } from "antd";
import OtherDetailsInput from "../otherDetailsInput/OtherDetailsInput";

const ProfileLifestyle = ({ menu, inputs, handleChange, text = false }) => {
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

  const traitsComp = traits
    .filter((trait) => (text ? inputs.traits.includes(trait.key) : true))
    .map((trait) => (
      <Tag.CheckableTag
        key={trait.key}
        checked={inputs.traits.includes(trait.key)}
        onChange={
          text
            ? null
            : (checked) =>
                handleTraitsChange(trait.key, checked, inputs.traits, "traits")
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
          <Grid item xs={12}>
            <OtherDetailsInput
              inputs={inputs}
              handleChange={handleChange}
              text={text}
            />
          </Grid>

          <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text>
                {text
                  ? "Lifestyle Traits:"
                  : "Which of these Traits describe you"}
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
            {traitsComp?.length ? (
              <Box>{traitsComp}</Box>
            ) : (
              <AntTypo.Text type="secondary">Not set</AntTypo.Text>
            )}
          </Grid>

          {/* <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text type="secondary">
                Which of these Recreational activities appeal to you
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
              {recreationTraits.map((trait) => (
                <Tag.CheckableTag
                  key={trait.key}
                  checked={inputs.traits.includes(trait.key)}
                  onChange={
                    text
                      ? null
                      : (checked) =>
                          handleTraitsChange(
                            trait.key,
                            checked,
                            inputs.traits,
                            "traits"
                          )
                  }
                >
                  {trait.value}
                </Tag.CheckableTag>
              ))}
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text type="secondary">
                Which of these Food and Travel activities appeal to you
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
              {foodDrinksTravelTraits.map((trait) => (
                <Tag.CheckableTag
                  key={trait.key}
                  checked={inputs.traits.includes(trait.key)}
                  onChange={
                    text
                      ? null
                      : (checked) =>
                          handleTraitsChange(
                            trait.key,
                            checked,
                            inputs.traits,
                            "traits"
                          )
                  }
                >
                  {trait.value}
                </Tag.CheckableTag>
              ))}
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text type="secondary">
                Which of these Sports and Relaxation activities appeal to you
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
              {sportsMiscTraits.map((trait) => (
                <Tag.CheckableTag
                  key={trait.key}
                  checked={inputs.traits.includes(trait.key)}
                  onChange={
                    text
                      ? null
                      : (checked) =>
                          handleTraitsChange(
                            trait.key,
                            checked,
                            inputs.traits,
                            "traits"
                          )
                  }
                >
                  {trait.value}
                </Tag.CheckableTag>
              ))}
            </Box>
          </Grid> */}
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileLifestyle;
