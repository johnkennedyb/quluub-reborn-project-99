import { Stack } from "@mui/material";
import { Typography, Select } from "antd";
import { states } from "../../states";

const RegionSelect = ({
  inputs,
  handleChange,
  fullWidth = true,
  text = false,
}) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Region: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.region ? inputs.region : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      value={inputs.region}
      name="region"
      disabled={!inputs.country || states[inputs.country].length === 0}
      onChange={(value) => {
        handleChange({
          target: {
            name: "region",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        { value: "", label: "Region", disabled: true },
        ...(inputs.country ? states[inputs.country] : []).map((state) => ({
          value: state,
          label: state,
        })),
      ]}
      placeholder="Region"
    />
  );
};

export default RegionSelect;
