import { Paper, Grid, Typography, Box } from "@mui/material";
import {
  recreationTraits,
  foodDrinksTravelTraits,
  sportsMiscTraits,
} from "../../traits";

import { Tag, Typography as AntTypo } from "antd";

const ProfileInterests = ({ menu, inputs, handleChange, text = false }) => {
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

  const recreationTraitsComp = recreationTraits
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

  const foodDrinksTravelTraitsComp = foodDrinksTravelTraits
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

  const sportsMiscTraitsComp = sportsMiscTraits
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
          {/* <Grid item xs={12}>
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
              <AntTypo.Text type="secondary">
                Which of these Traits describe you
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
              {traits.map((trait) => (
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

          <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text>
                {text
                  ? "Recreational activities:"
                  : "Which of these Recreational activities appeal to you"}
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
            {recreationTraitsComp?.length ? (
              <Box>{recreationTraitsComp}</Box>
            ) : (
              <AntTypo.Text type="secondary">Not set</AntTypo.Text>
            )}
          </Grid>

          <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text>
                {text
                  ? "Food and Travel activities:"
                  : "Which of these Food and Travel activities appeal to you"}
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
            {foodDrinksTravelTraitsComp?.length ? (
              <Box>{foodDrinksTravelTraitsComp}</Box>
            ) : (
              <AntTypo.Text type="secondary">Not set</AntTypo.Text>
            )}
          </Grid>

          <Grid
            item
            xs={12}
            sx={{ display: "flex", flexDirection: "column", gap: "5px" }}
          >
            <Box>
              <AntTypo.Text>
                {text
                  ? "Sports and Relaxation activities:"
                  : "Which of these Sports and Relaxation activities appeal to you"}
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
            {sportsMiscTraitsComp?.length ? (
              <Box>{sportsMiscTraitsComp}</Box>
            ) : (
              <AntTypo.Text type="secondary">Not set</AntTypo.Text>
            )}
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileInterests;
