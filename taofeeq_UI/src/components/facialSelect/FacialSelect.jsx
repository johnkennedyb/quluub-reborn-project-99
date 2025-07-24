import { Stack } from "@mui/material";
import { Typography, Select } from "antd";

const FacialSelect = ({
  inputs,
  handleChange,
  text = false,
  noEmpty = true,
}) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Appearance: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.appearance ? inputs.appearance : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      placeholder="Appearance"
      value={inputs.appearance}
      name="appearance"
      onChange={(value) => {
        handleChange({
          target: {
            name: "appearance",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        { value: "", label: "Facial appearance", disabled: true },
        !noEmpty && {
          value: "Any",
          label: "Any",
        },
        ...[
          "Standout",
          "Very attractive",
          "Attractive",
          "Fairly attractive",
          "Above average",
          "Average/Regular",
          "Fair/Okay",
          "Plain",
        ].map((value) => ({ value, label: value })),
      ].filter((item) => !!item)}
    />
  );
};

export default FacialSelect;
