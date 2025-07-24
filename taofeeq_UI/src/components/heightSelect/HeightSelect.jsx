import { Stack } from "@mui/material";
import { Typography, Select } from "antd";

const HeightSelect = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Estimated Height: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.height
          ? `${Math.floor(inputs.height / 12)} feet ${
              inputs.height % 12
            } inches`
          : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      value={inputs.height}
      name="height"
      onChange={(value) => {
        handleChange({
          target: {
            name: "height",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        {
          value: 0,
          label: "Estimated Height",
          disabled: true,
        },
        ...[...Array(48).keys()]
          .map((foo) => foo + 48)
          .map((value) => ({
            value,
            label: `${Math.floor(value / 12)} feet ${value % 12} inches`,
          })),
      ]}
      placeholder="Estimated Height"
    />
  );
};

export default HeightSelect;
