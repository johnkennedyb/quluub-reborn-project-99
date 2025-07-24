import { AuthContext } from "../../context/authContext";
import { useContext, useState } from "react";
import { Paper, Typography, Box } from "@mui/material";
import { Button, message, Input, Popconfirm, Tooltip, Row, Col } from "antd";
import InfoIcon from "@mui/icons-material/Info";
import { makeRequest } from "../../axios";
import { useMutation } from "@tanstack/react-query";

const SettingsPassword = ({ menu }) => {
  const [inputs, setInputs] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPass: "",
  });

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const { isMobile } = useContext(AuthContext);

  const confirm = (e) => {
    mutation.mutate();
  };

  const mutation = useMutation(
    () => {
      return makeRequest.put("/auth/password", inputs);
    },
    {
      onSuccess: () => {
        message.success("Password Update Successful");
        setInputs({
          oldPassword: "",
          newPassword: "",
          confirmPass: "",
        });
      },
      onError: (error) => {
        message.error("Error updating password " + error.response.data.msg, 2);
      },
    }
  );

  return (
    <Paper
      elevation={1}
      sx={{
        padding: "20px",
        marginRight: "10px",
      }}
      ref={menu.to}
    >
      <Typography
        component="strong"
        sx={{
          textTransform: "capitalize",
          fontWeight: "bold",
          color: "#545e6f",
        }}
      >
        {menu.text}
      </Typography>
      <Box
        component="form"
        noValidate
        sx={{ my: 2, display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Input.Password
              {...{
                addonBefore: !isMobile ? "Current password*" : "",
                placeholder: isMobile ? "Current password*" : "",
              }}
              onChange={handleChange}
              value={inputs.oldPassword}
              required
              name="oldPassword"
            />
          </Col>

          <Col xs={24} sm={12}>
            <Input.Password
              {...{
                addonBefore: !isMobile ? "New password*" : "",
                placeholder: isMobile ? "New password*" : "",
              }}
              onChange={handleChange}
              value={inputs.newPassword}
              required
              name="newPassword"
            />
          </Col>

          <Col xs={24} sm={12}>
            <Tooltip
              trigger={["focus"]}
              color="red"
              title={
                inputs.newPassword !== inputs.confirmPass
                  ? "Must match new password"
                  : ""
              }
              placement="topLeft"
            >
              <span>
                <Input.Password
                  {...{
                    addonBefore: !isMobile ? "Confirm password*" : "",
                    placeholder: isMobile ? "Confirm password*" : "",
                  }}
                  onChange={handleChange}
                  value={inputs.confirmPass}
                  placeholder="Must match new password"
                  required
                  name="confirmPass"
                />
              </span>
            </Tooltip>
          </Col>

          <Col xs={24} sm={0}>
            <Popconfirm
              title={"Change password?"}
              description="Are you sure you want to do this?"
              onConfirm={confirm}
              onCancel={() => {}}
              icon={<InfoIcon color="info" style={{ marginRight: "5px" }} />}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                block
                disabled={
                  !inputs.confirmPass ||
                  !inputs.newPassword ||
                  !inputs.oldPassword ||
                  inputs.newPassword !== inputs.confirmPass
                }
              >
                Change password
              </Button>
            </Popconfirm>
          </Col>

          <Col xs={0} sm={4} offset={20}>
            <Popconfirm
              title={"Change password?"}
              description="Are you sure you want to do this?"
              onConfirm={confirm}
              onCancel={() => {}}
              icon={<InfoIcon color="info" style={{ marginRight: "5px" }} />}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                block
                disabled={
                  !inputs.confirmPass ||
                  !inputs.newPassword ||
                  !inputs.oldPassword ||
                  inputs.newPassword !== inputs.confirmPass
                }
              >
                Change password
              </Button>
            </Popconfirm>
          </Col>
        </Row>
      </Box>
    </Paper>
  );
};

export default SettingsPassword;
