import { Stack } from "@mui/material";
import { Input, Typography } from "antd";

const OtherDetailsInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="column" spacing={1}>
      <Typography.Text>Other miscellaneous details: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.otherDetails ? inputs.otherDetails : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input.TextArea
      rows={4}
      placeholder="Lifestyle, hobbies, interests, family, interesting facts, miscellaneous details etc"
      onChange={handleChange}
      value={inputs.otherDetails}
      required
      name="otherDetails"
    />
  );
};

export default OtherDetailsInput;
