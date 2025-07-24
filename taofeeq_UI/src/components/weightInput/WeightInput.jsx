import { Stack } from "@mui/material";
import { Select, Typography } from "antd";

const WeightInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Estimated Weight: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.weight
          ? `${JSON.parse(inputs.weight)[0]} to ${
              JSON.parse(inputs.weight)[1]
            }kg`
          : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      value={inputs.weight}
      name="weight"
      onChange={(value) => {
        handleChange({
          target: {
            name: "weight",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        {
          value: 0,
          label: "Estimated Weight",
          disabled: true,
        },
        ...[...Array(16).keys()]
          .map((val) => [(val + 6) * 5 + 1, (val + 6) * 5 + 5])
          .map((value) => ({
            value: JSON.stringify(value),
            label: `${value[0]} to ${value[1]}kg`,
          })),
      ]}
      placeholder="Estimated weight"
    />
  );
};

export default WeightInput;
