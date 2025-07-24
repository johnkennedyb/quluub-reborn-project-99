import { Stack } from "@mui/material";
import { Input, Typography } from "antd";

const IslamicPracticeInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="column" spacing={1}>
      <Typography.Text>More details about how deen practice: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.islamicPractice ? inputs.islamicPractice : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input.TextArea
      rows={4}
      placeholder="Please share some more details about how you practice deen"
      onChange={handleChange}
      value={inputs.islamicPractice}
      required
      name="islamicPractice"
    />
  );
};

export default IslamicPracticeInput;
