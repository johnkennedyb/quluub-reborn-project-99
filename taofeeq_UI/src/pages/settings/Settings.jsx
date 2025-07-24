import "./settings.scss";
import SettingsHelp from "../../components/settingsHelp/SettingsHelp";
import { useRef } from "react";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import PasswordIcon from "@mui/icons-material/Password";
import HelpCenterIcon from "@mui/icons-material/HelpCenter";
import { Box } from "@mui/material";
import SettingsPlan from "../../components/settingsPlan/SettingsPlan";
import SettingsPassword from "../../components/settingsPassword/SettingsPassword";

const Settings = () => {
  const menus = [
    {
      icon: <LoyaltyIcon />,
      text: "Manage my plan",
      to: useRef(null),
    },
    {
      icon: <PasswordIcon />,
      text: "Change my password",
      to: useRef(null),
    },
    {
      icon: <HelpCenterIcon />,
      text: "Help center",
      to: useRef(null),
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",

        marginTop: "0px",

        height: "80vh",
        overflow: "auto",
        scrollbarWidth: "none",
        paddingY: "5px !important",
      }}
    >
      <SettingsPlan menu={menus[0]} />

      <SettingsPassword menu={menus[1]} />

      <SettingsHelp menu={menus[2]} />
    </Box>
  );
};

export default Settings;
