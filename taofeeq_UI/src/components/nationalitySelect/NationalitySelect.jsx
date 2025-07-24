import { Stack } from "@mui/material";
import { Typography, Select } from "antd";
import { nationalities } from "../../countries";

const NationalitySelect = ({
  inputs,
  handleChange,
  fullWidth = true,
  text = false,
  noEmpty = true,
}) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Nationality (as on passport): </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.nationality ? inputs.nationality : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      value={inputs.nationality}
      name="nationality"
      onChange={(value) => {
        handleChange({
          target: {
            name: "nationality",
            value,
          },
        });
      }}
      style={{ width: fullWidth ? "100%" : "250px" }}
      options={[
        {
          value: "",
          label: "Nationality (as on passport)",
          disabled: true,
        },
        !noEmpty && {
          value: "Any",
          label: "Any",
        },
        ...nationalities.map((value) => ({
          value,
          label: value,
        })),
      ].filter((item) => !!item)}
      placeholder="Nationality (as on passport)"
    />
  );
};

export default NationalitySelect;
