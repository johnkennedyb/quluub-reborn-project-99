import "./leftBar.scss";
import { Paper, Divider, Avatar } from "@mui/material";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import SidebarMenu from "../sidebarMenu/SidebarMenu";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

export const menus = [
  {
    icon: <SpaceDashboardIcon />,
    text: "Dashboard",
    to: "/",
  },
  {
    icon: <PersonSearchIcon />,
    text: "Search",
    to: "/search",
  },
  {
    icon: <PersonOutlineIcon />,
    text: "Profile",
    to: "/profile",
  },
  {
    icon: <NotificationsNoneIcon />,
    text: "Alerts",
    to: "/notifications",
  },
  {
    icon: <SettingsIcon />,
    text: "Settings",
    to: "/settings",
  },
];

const LeftBar = () => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "auto",
        height: "97vh",
        margin: "10px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "25px",
      }}
    >
      <Avatar
        alt="Remy Sharp"
        src="https://source.unsplash.com/random?wallpapers"
        sx={{
          alignSelf: "center",
          marginTop: "10px",
        }}
      />
      <Divider variant="middle" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "25px",
        }}
      >
        {menus.map((menu) => (
          <SidebarMenu {...menu} link key={menu.text} />
        ))}
      </div>
    </Paper>
  );
};

export default LeftBar;
