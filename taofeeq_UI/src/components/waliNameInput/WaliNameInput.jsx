import { Stack } from "@mui/material";
import { Input, Typography } from "antd";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

const WaliNameInput = ({ inputs, handleChange, text = false }) => {
  const { isMobile } = useContext(AuthContext);

  const handleWaliPhoneChange = (name, e) => {
    handleChange({
      target: {
        name,
        value: { ...inputs.waliDetails, name: e.target.value },
      },
    });
  };

  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Full Name: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs?.waliDetails?.name ? inputs?.waliDetails?.name : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input
      {...{
        addonBefore: !isMobile ? "Full Name*" : "",
        placeholder: isMobile ? "Full Name*" : "",
      }}
      onChange={(e) => handleWaliPhoneChange(`waliDetails`, e)}
      value={inputs.waliDetails.name}
      required
      name="waliName"
    />
  );
};

export default WaliNameInput;
