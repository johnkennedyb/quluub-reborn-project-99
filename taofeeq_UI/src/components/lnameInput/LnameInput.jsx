import { Stack } from "@mui/material";
import { Input, Typography } from "antd";

const LnameInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Last Name: </Typography.Text>
      <Typography.Text type="secondary">{inputs.lname}</Typography.Text>
    </Stack>
  ) : (
    <Input
      addonBefore="Last Name*"
      onChange={handleChange}
      value={inputs.lname}
      required
      name="lname"
    />
  );
};

export default LnameInput;
