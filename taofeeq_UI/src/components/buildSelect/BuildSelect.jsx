import { Stack } from "@mui/material";
import { Typography, Select } from "antd";

const BuildSelect = ({
  inputs,
  handleChange,
  text = false,
  noEmpty = true,
}) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Build: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.build ? inputs.build : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      placeholder="Build"
      value={inputs.build}
      name="build"
      onChange={(value) => {
        handleChange({
          target: {
            name: "build",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        { value: "", label: "Build", disabled: true },
        !noEmpty && {
          value: "Any",
          label: "Any",
        },
        ...[
          "Skinny",
          "Lean",
          "Well proportioned",
          "Hourglass figure",
          "Pear-shaped figure",
          "Curvy",
          "Thick",
          "Slim",
          "Average",
          "Sporty",
          "Muscular",
          "Stocky",
          "Bulking",
          "Few extra pounds",
          "Chubby",
          "Heavyset",
        ].map((value) => ({ value, label: value })),
      ].filter((item) => !!item)}
    />
  );
};

export default BuildSelect;
