import { Stack } from "@mui/material";
import { Input, Typography } from "antd";

const SummaryInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="column" spacing={1}>
      <Typography.Text>Summary about you: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.summary ? inputs.summary : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input.TextArea
      rows={4}
      placeholder="Summary about you"
      onChange={handleChange}
      value={inputs.summary}
      required
      name="summary"
    />
  );
};

export default SummaryInput;
