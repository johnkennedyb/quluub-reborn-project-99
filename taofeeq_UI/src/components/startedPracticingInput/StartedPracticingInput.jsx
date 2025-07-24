import { Stack } from "@mui/material";
import { DatePicker, Typography } from "antd";
import dayjs from "dayjs";

const StartedPracticingInput = ({ inputs, handleChange, text = false }) => {
  const dateFormat = "YYYY-MM-DD";

  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Started Practicing: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.startedPracticing && inputs.dob !== "0000-00-00 00:00:00"
          ? dayjs(inputs.startedPracticing, dateFormat).format("DD MMM YYYY")
          : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <DatePicker
      onChange={(date, value) => {
        const temp = dayjs(date).hour(12).minute(0).second(0);
        handleChange({
          target: {
            name: "startedPracticing",
            value: value === "" ? "0000-00-00" : temp,
          },
        });
      }}
      style={{ width: "100%" }}
      placeholder="Roughly when did you start practicing"
      maxDate={dayjs(dayjs(), dateFormat)}
      format="DD MMM YYYY"
      value={
        inputs.startedPracticing &&
        inputs.startedPracticing !== "0000-00-00" &&
        inputs.startedPracticing !== "0000-00-00 00:00:00"
          ? dayjs(inputs.startedPracticing).hour(12).minute(0).second(0)
          : undefined
      }
    />
  );
};

export default StartedPracticingInput;
