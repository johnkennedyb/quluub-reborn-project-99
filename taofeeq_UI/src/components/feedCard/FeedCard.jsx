import { Paper, Grid, Typography, Box } from "@mui/material";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import JoinInnerIcon from "@mui/icons-material/JoinInner";
import SendIcon from "@mui/icons-material/Send";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { pink } from "@mui/material/colors";
import { capitalizeFirstLetter } from "../../helpers";

const FeedCard = ({ item, elevation = 0 }) => {
  const navigate = useNavigate();

  const typeMapping = {
    fit: {
      title: "might be a fit for you",
      icon: <SendIcon color="primary" />,
    },
    request: {
      title: "sent you a connection request",
      icon: <MoveToInboxIcon color="secondary" />,
    },
    accept: {
      title: "accepted your connection request",
      icon: <JoinInnerIcon color="success" />,
    },
    view: {
      title: "viewed your profile",
      icon: <VisibilityIcon sx={{ color: pink[500] }} />,
    },
  };

  return (
    <Paper
      sx={{
        width: "100%",
        cursor: "pointer",
        padding: elevation ? "10px" : "0px",
      }}
      onClick={() => navigate(`/profile/${item.username}`)}
      elevation={elevation}
    >
      <Grid container spacing={1}>
        <Grid
          item
          xs={9}
          sm={9}
          md={9}
          sx={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          {typeMapping[item.type].icon}

          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: "#545e6f",

                fontSize: "13px",
              }}
            >
              {capitalizeFirstLetter(item.username)}{" "}
              {typeMapping[item.type].title.toLowerCase()}.
            </Typography>
            {elevation ? (
              <Typography component="small" sx={{ fontSize: "10px" }}>
                {moment(item.timestamp).fromNow()}
              </Typography>
            ) : null}
          </Box>
        </Grid>
        <Grid item xs={3} sm={3} md={3}>
          {!elevation ? (
            <Typography component="small" sx={{ fontSize: "10px" }}>
              {moment(item.timestamp).fromNow()}
            </Typography>
          ) : null}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FeedCard;
