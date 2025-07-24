import { Stack } from "@mui/material";
import { InputNumber, Typography } from "antd";
import { AuthContext } from "../../context/authContext";
import { useContext } from "react";

const ChildrenInput = ({ inputs, handleChange, text = false }) => {
  const { isMobile } = useContext(AuthContext);

  return text ? (
    <Stack direction="row" spacing={1}>
      <Typography.Text>Number of Children: </Typography.Text>
      <Typography.Text type="secondary">
        {inputs.noOfChildren
          ? inputs.noOfChildren
          : inputs.noOfChildren === 0
          ? 0
          : "Not set"}
      </Typography.Text>
    </Stack>
  ) : (
    <InputNumber
      {...{
        addonBefore: !isMobile ? "Number of Children" : "",
        placeholder: isMobile ? "Number of Children" : "",
      }}
      onChange={(value) => {
        handleChange({
          target: {
            name: "noOfChildren",
            value,
          },
        });
      }}
      value={inputs.noOfChildren}
      required
      name="noOfChildren"
      style={{ width: "100%" }}
    />
  );
};

export default ChildrenInput;
