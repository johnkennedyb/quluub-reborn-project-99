import * as React from "react";
import Box from "@mui/material/Box";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import FileCopyIcon from "@mui/icons-material/FileCopyOutlined";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import ShareIcon from "@mui/icons-material/Share";
import { menus } from "../leftBar/LeftBar";
import { useLocation, useNavigate } from "react-router-dom";

export default function MenuSpeedDial() {
  const navigate = useNavigate();

  return (
    <SpeedDial
      ariaLabel="SpeedDial basic example"
      sx={{ position: "absolute", bottom: 16, right: 16 }}
      icon={<SpeedDialIcon />}
    >
      {[...menus].reverse().map((action) => (
        <SpeedDialAction
          key={action.text}
          icon={action.icon}
          tooltipTitle={action.text}
          onClick={() => navigate(action.to)}
        />
      ))}
    </SpeedDial>
  );
}
