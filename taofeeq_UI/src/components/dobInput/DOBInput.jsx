import { Stack } from "@mui/material";
import { DatePicker, Typography } from "antd";
import dayjs from "dayjs";

const DOBInput = ({ inputs, handleChange, text = false }) => {
  const dateFormat = "YYYY-MM-DD";
  const date1 = dayjs(inputs.dob);
  const date2 = dayjs();
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Date of Birth: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.dob &&
        inputs.dob !== "0000-00-00" &&
        inputs.dob !== "0000-00-00 00:00:00"
          ? `${date2.diff(date1, "year")} years old (${dayjs(
              inputs.dob,
              dateFormat
            ).format("DD MMM YYYY")})`
          : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <DatePicker
      onChange={(date, value) => {
        const temp = dayjs(date).hour(12).minute(0).second(0);
        handleChange({
          target: {
            name: "dob",
            value: value === "" ? "0000-00-00" : temp,
          },
        });
      }}
      style={{ width: "100%" }}
      placeholder="Date of Birth*"
      format="DD MMM YYYY"
      maxDate={dayjs(dayjs().subtract(18, "year"), dateFormat)}
      value={
        inputs.dob &&
        inputs.dob !== "0000-00-00" &&
        inputs.dob !== "0000-00-00 00:00:00"
          ? dayjs(inputs.dob).hour(12).minute(0).second(0)
          : undefined
      }
    />
  );
};

export default DOBInput;
