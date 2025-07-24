import { Stack } from "@mui/material";
import { Typography, Select } from "antd";

const RevertSelect = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Revert: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.revert ? inputs.revert : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      value={inputs.revert}
      name="revert"
      onChange={(value) => {
        handleChange({
          target: {
            name: "revert",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        { value: "", label: "Are you a revert", disabled: true },
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]}
      placeholder={"Are you a revert"}
    />
  );
};

export default RevertSelect;
