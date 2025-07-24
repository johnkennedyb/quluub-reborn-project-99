import { NavLink } from "react-router-dom";
import { Typography } from "@mui/material";

const SidebarMenu = ({ icon, text, to, link, onClick }) => {
  return link ? (
    <NavLink
      to={to}
      variant="body2"
      style={({ isActive }) => ({
        fontWeight: isActive ? "bold" : "normal",
        color: "#545e6f",
        display: "flex",
        gap: "10px",
        textDecoration: "none",
        marginLeft: "20px",
      })}
    >
      {icon} {text}
    </NavLink>
  ) : (
    <Typography
      variant="body2"
      style={{
        fontWeight: "normal",
        color: "#545e6f",
        display: "flex",
        gap: "10px",
        textDecoration: "none",
        marginLeft: "20px",
        cursor: "pointer",
        alignItems: "center",
      }}
      onClick={onClick}
    >
      {icon} {text}
    </Typography>
  );
};

export default SidebarMenu;
