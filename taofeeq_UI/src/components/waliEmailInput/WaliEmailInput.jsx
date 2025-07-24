import { Stack } from "@mui/material";
import { Input, Typography } from "antd";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

const WaliEmailInput = ({ inputs, handleChange, text = false }) => {
  const { isMobile } = useContext(AuthContext);

  const handleWaliPhoneChange = (name, e) => {
    handleChange({
      target: {
        name,
        value: { ...inputs.waliDetails, email: e.target.value },
      },
    });
  };
  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Email Address: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs?.waliDetails?.email ? inputs?.waliDetails?.email : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input
      {...{
        addonBefore: !isMobile ? "Email Address*" : "",
        placeholder: isMobile ? "Email Address*" : "",
      }}
      onChange={(e) => handleWaliPhoneChange(`waliDetails`, e)}
      value={inputs.waliDetails.email}
      type="email"
      required
      name="waliEmail"
    />
  );
};

export default WaliEmailInput;
