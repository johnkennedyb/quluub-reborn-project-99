import { Stack } from "@mui/material";
import { Select, Typography } from "antd";

const MaritalSelect = ({
  inputs,
  handleChange,
  text = false,
  noEmpty = true,
}) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Marital Status: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.maritalStatus ? inputs.maritalStatus : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Select
      placeholder="Marital Status"
      value={inputs.maritalStatus}
      name="maritalStatus"
      onChange={(value) => {
        handleChange({
          target: {
            name: "maritalStatus",
            value,
          },
        });
      }}
      style={{ width: "100%" }}
      options={[
        { value: "", label: "Marital Status", disabled: true },
        !noEmpty && {
          value: "Any",
          label: "Any",
        },
        { value: "Single", label: "Single" },
        { value: "Divorced", label: "Divorced" },
        { value: "Widowed", label: "Widowed" },
        // { value: "Annulled", label: "Annulled" },
        { value: "Married", label: "Married" },
      ].filter((item) => !!item)}
    />
  );
};

export default MaritalSelect;
