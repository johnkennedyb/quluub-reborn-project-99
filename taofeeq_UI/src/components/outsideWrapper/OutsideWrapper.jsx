import { Stack } from "@mui/material";

const OutsideWrapper = ({ children }) => {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        height: "100vh",
        backgroundImage: `url(${process.env.PUBLIC_URL}/bg.svg)`,
        backgroundRepeat: "no-repeat",
        backgroundColor: (t) =>
          t.palette.mode === "light" ? t.palette.grey[50] : t.palette.grey[900],
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {children}
    </Stack>
  );
};

export default OutsideWrapper;
