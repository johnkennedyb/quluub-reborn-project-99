import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import { menus } from "../leftBar/LeftBar";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const findMenuIndex = (arr, item) => {
  return arr.findIndex((val) => val.to === item);
};

export default function SimpleBottomNavigation() {
  const [value, setValue] = useState(0);

  const navigate = useNavigate();
  const currentRoute = useLocation().pathname.split("/")[1];

  useEffect(() => {
    setValue(
      currentRoute.length ? findMenuIndex(menus, `/${currentRoute}`) : 0
    );
  }, [currentRoute]);

  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          navigate(menus[newValue].to);
        }}
      >
        {[...menus].map((action) => (
          <BottomNavigationAction
            label={action.text}
            icon={action.icon}
            key={action.text}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
