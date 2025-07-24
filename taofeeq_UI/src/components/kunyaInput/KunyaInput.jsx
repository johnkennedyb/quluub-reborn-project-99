import { Stack } from "@mui/material";
import { Input, Typography } from "antd";
import { AuthContext } from "../../context/authContext";
import { useContext } from "react";

const KunyaInput = ({ inputs, handleChange, text = false }) => {
  const { isMobile } = useContext(AuthContext);

  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Nickname / Kunya: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.kunya ? inputs.kunya : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <Input
      {...{
        addonBefore: !isMobile ? "Nickname / Kunya" : "",
        placeholder: isMobile ? "Nickname / Kunya" : "Optional",
      }}
      onChange={handleChange}
      value={inputs.kunya}
      required
      name="kunya"
    />
  );
};

export default KunyaInput;
