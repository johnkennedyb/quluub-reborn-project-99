import { Paper, Typography, Divider, Box, Stack } from "@mui/material";
import { Typography as AntTypo } from "antd";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

const Advert = () => {
  const { currentUser } = useContext(AuthContext);

  return currentUser.plan.name === "freemium" ? (
    <Paper
      elevation={1}
      sx={{
        padding: "10px",
        width: "100%",
        cursor: "pointer",
      }}
    >
      <Stack direction={"row"} justifyContent={"space-between"}>
        <Box>
          <Typography
            component="strong"
            sx={{
              textTransform: "capitalize",
              fontWeight: "bold",
              color: "#545e6f",
            }}
          >
            Advert{" "}
          </Typography>
        </Box>
        <Box>
          {" "}
          <i>
            <AntTypo.Text type="secondary">This is sponsored</AntTypo.Text>
          </i>
        </Box>
      </Stack>
      <Divider variant="middle" sx={{ marginY: "5px" }} />

      <AntTypo.Text type="secondary">Sponsored post placeholder</AntTypo.Text>
    </Paper>
  ) : null;
};

export default Advert;
