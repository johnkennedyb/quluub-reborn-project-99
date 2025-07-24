import { Select, Typography, Tag } from "antd";
import { nationalities } from "../../countries";
import { Stack } from "@mui/material";

const EthnicitySelect = ({
  inputs,
  handleChange,
  fullWidth = true,
  text = false,
}) => {
  return text ? (
    <Stack direction={"row"} spacing={1}>
      <Typography.Paragraph>Ethnicity: </Typography.Paragraph>

      {inputs.ethnicity ? (
        inputs.ethnicity.map((ice) => (
          <Tag key={ice} checked={true}>
            {ice}
          </Tag>
        ))
      ) : (
        <Typography.Text type="secondary">Not set</Typography.Text>
      )}
    </Stack>
  ) : (
    <Select
      mode="multiple"
      allowClear
      value={inputs.ethnicity}
      name="ethnicity"
      onChange={(value) => {
        handleChange({
          target: {
            name: "ethnicity",
            value,
          },
        });
      }}
      style={{ width: fullWidth ? "100%" : "250px" }}
      placeholder="Ethnicity (Select all that apply)"
      options={[
        ...nationalities.map((value) => ({
          value,
          label: value,
        })),
      ]}
    />
  );
};

export default EthnicitySelect;
