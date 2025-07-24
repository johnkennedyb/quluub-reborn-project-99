import { Stack } from "@mui/material";
import { Input, Typography } from "antd";

const ScholarsSpeakersInput = ({ inputs, handleChange, text = false }) => {
  return text ? (
    <Stack direction="column" spacing={1}>
      <Typography.Text>
        Deen practice, learning (Scholars / Speakers) etc:{" "}
      </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.scholarsSpeakers ? inputs.scholarsSpeakers : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input.TextArea
      rows={4}
      placeholder="Details about how you practice deen, where you learn (scholars/speakers)?"
      onChange={handleChange}
      value={inputs.scholarsSpeakers}
      required
      name="scholarsSpeakers"
    />
  );
};

export default ScholarsSpeakersInput;
