import { Stack } from "@mui/material";
import { Input, Typography } from "antd";

const FnameInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>First Name: </Typography.Text>
      <Typography.Text type="secondary">{inputs.fname}</Typography.Text>
    </Stack>
  ) : (
    <Input
      addonBefore="First Name*"
      onChange={handleChange}
      value={inputs.fname}
      required
      name="fname"
    />
  );
};

export default FnameInput;
