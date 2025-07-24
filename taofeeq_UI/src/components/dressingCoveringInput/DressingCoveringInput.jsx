import { Stack } from "@mui/material";
import { Input, Typography } from "antd";

const DressingCoveringInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="column" spacing={1}>
      <Typography.Text>Dressing/Covering: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.dressingCovering ? inputs.dressingCovering : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input.TextArea
      rows={9}
      placeholder="How do you dress (How covered are you)?"
      onChange={handleChange}
      value={inputs.dressingCovering}
      required
      name="dressingCovering"
      style={{ resize: "none" }}
    />
  );
};

export default DressingCoveringInput;
