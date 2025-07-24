import { Stack } from "@mui/material";
import { Input, Typography } from "antd";

const WorkEducationInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="column" spacing={1}>
      <Typography.Text>Work and Education details: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.workEducation ? inputs.workEducation : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input.TextArea
      rows={4}
      placeholder="Work and Education details"
      onChange={handleChange}
      value={inputs.workEducation}
      required
      name="workEducation"
    />
  );
};

export default WorkEducationInput;
