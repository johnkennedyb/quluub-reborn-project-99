import { Stack } from "@mui/material";
import { Typography, Select } from "antd";
import { countries } from "../../countries";

const CountrySelect = ({
  inputs,
  handleChange,
  fullWidth = true,
  text = false,
  noEmpty = true,
}) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Country of residence: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.country ? inputs.country : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      value={inputs.country}
      name="country"
      onChange={(value) => {
        handleChange({
          target: {
            name: "country",
            value,
          },
        });
      }}
      style={{ width: fullWidth ? "100%" : "250px" }}
      options={[
        { value: "", label: "Country of residence", disabled: true },
        !noEmpty && {
          value: "Any",
          label: "Any",
        },
        ...countries.map((country) => ({
          value: country,
          label: country,
        })),
      ].filter((item) => !!item)}
      placeholder="Country of residence"
    />
  );
};

export default CountrySelect;
