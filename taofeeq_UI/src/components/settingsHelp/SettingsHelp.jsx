import { Paper, Grid, Typography, Box } from "@mui/material";
import VisibleToggle from "../visibleToggle/VisibleToggle";
import { Button, message, Card, Popconfirm } from "antd";
import InfoIcon from "@mui/icons-material/Info";

const SettingsHelp = ({ menu }) => {
  const confirm = (e) => {
    message.success("This feature is coming soon");
  };
  const cancel = (e) => {
    // message.error("Click on No");
  };

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
        <Grid container rowSpacing={3} columnSpacing={1}>
          <Grid item xs={12} sm={4}>
            <Card style={{ width: "100%" }}>
              <VisibleToggle />
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card style={{ width: "100%" }}>
              Having any issues? <br />
              <Button
                type="link"
                href="mailto:support@quluub.com"
                target="_blank"
                style={{
                  border: "1px solid #1890ff",
                  borderRadius: "4px",
                }}
              >
                Contact us
              </Button>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card style={{ width: "100%" }}>
              Please be sure! <br />
              <Popconfirm
                title="Delete my account"
                description="Are you sure you want to do this, there is no going back?"
                onConfirm={confirm}
                onCancel={cancel}
                icon={<InfoIcon color="error" style={{ marginRight: "5px" }} />}
                okText="Yes"
                cancelText="No"
              >
                <Button danger>Delete my account</Button>
              </Popconfirm>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default SettingsHelp;
