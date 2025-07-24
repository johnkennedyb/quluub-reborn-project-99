import { Stack } from "@mui/material";
import { Input, Typography } from "antd";
import { camelCaseToWords } from "../../helpers";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

const WaliPhoneNumber = ({ inputs, handleChange, text = false, type }) => {
  const { isMobile } = useContext(AuthContext);

  const handleWaliPhoneChange = (name, e) => {
    handleChange({
      target: {
        name,
        value: { ...inputs.waliDetails, [type]: e.target.value },
      },
    });
  };

  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>{camelCaseToWords(type)} : </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.waliDetails[type]}
        {inputs.waliDetails?.[type] ? inputs?.waliDetails?.[type] : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input
      {...{
        addonBefore: !isMobile ? `${camelCaseToWords(type)}` : "",
        placeholder: isMobile ? `${camelCaseToWords(type)}` : "",
      }}
      onChange={(e) => handleWaliPhoneChange(`waliDetails`, e)}
      value={inputs.waliDetails[type]}
      required
      name={`waliDetails`}
    />
  );
};

export default WaliPhoneNumber;
