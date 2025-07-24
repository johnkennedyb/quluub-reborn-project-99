import { Paper, Grid, Typography, Divider } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import { useNavigate } from "react-router-dom";

const DashboardTopBar = ({ topBar, setTop }) => {
  const navigate = useNavigate();

  return (
    <Grid container spacing={3}>
      {topBar.map(({ icon, number, title, stats, color }, index, arr) => (
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
          key={title}
          onClick={() =>
            index === arr.length - 1
              ? navigate("/notifications")
              : setTop(index)
          }
        >
          <Paper
            elevation={1}
            sx={{
              padding: "10px",
              borderLeft: color + " 3px solid",
              cursor: "pointer",
            }}
          >
            <Grid container>
              <Grid item xs={10} sm={10} md={10}>
                <Typography variant="subtitle2">{title}</Typography>
                <Typography
                  variant="body1"
                  style={{
                    fontWeight: "bold",
                    color: "#545e6f",
                  }}
                >
                  {number}
                </Typography>
                <Divider variant="fullWidth" sx={{ margin: "5px" }} />

                <Typography
                  variant="caption"
                  display="block"
                  sx={{
                    display: "flex",
                    gap: "3px",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: stats === 0 ? "grey" : stats > 0 ? "green" : "red",
                      fontWeight: "bold",
                      display: "flex",
                    }}
                  >
                    {stats === 0 ? (
                      <DragHandleIcon fontSize="small" />
                    ) : stats > 0 ? (
                      <ArrowUpwardIcon fontSize="small" />
                    ) : (
                      <ArrowDownwardIcon fontSize="small" />
                    )}{" "}
                    {Math.abs(stats)}%
                  </Typography>{" "}
                  this week
                </Typography>
              </Grid>
              <Grid item xs={2} sm={2} md={2}>
                {icon}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardTopBar;
