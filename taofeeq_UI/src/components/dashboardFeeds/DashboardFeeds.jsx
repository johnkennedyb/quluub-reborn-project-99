import {
  Paper,
  Typography,
  ListItem,
  Divider,
  List,
  Stack,
  Box,
  Button,
} from "@mui/material";
import { Fragment } from "react";
import FeedCard from "../feedCard/FeedCard";
import { Empty } from "antd";
import { useNavigate } from "react-router-dom";

const DashboardFeeds = ({ feed }) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        padding: "10px",
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
            Feed
          </Typography>
          <Typography variant="caption" display="block">
            Recent information you may find useful
          </Typography>
        </Box>
        <Button onClick={() => navigate("/notifications")} size="small">
          See all
        </Button>
      </Stack>

      {feed?.length < 1 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={"Nothing here yet"}
          style={{ marginTop: "150px", height: "35vh" }}
        />
      ) : (
        <List
          sx={{
            height: "61vh",
            overflow: "auto",
            scrollbarWidth: "none",
          }}
        >
          {feed?.map((item, index, arr) => (
            <Fragment
              key={`${item.username}${item.type}${item.timestamp}${index}`}
            >
              <ListItem>
                <FeedCard item={item} />
              </ListItem>
              {index !== arr?.length - 1 && (
                <Divider variant="fullWidth" sx={{ margin: "5px" }} />
              )}
            </Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default DashboardFeeds;
