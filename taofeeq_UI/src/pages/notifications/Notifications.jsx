import FeedCard from "../../components/feedCard/FeedCard";
import "./notifications.scss";
import {
  Typography,
  ListItem,
  Divider,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { Empty, Skeleton } from "antd";

const Notifications = () => {
  const { isLoading, data } = useQuery(["dashboard"], () =>
    makeRequest.get("/users/notifications").then((res) => {
      return res.data;
    })
  );

  return isLoading ? (
    <Skeleton active />
  ) : (
    <>
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          <Typography
            component="p"
            sx={{
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            Connection requests
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {isLoading ? (
            <Skeleton active />
          ) : (
            <>
              {data?.request?.length > 0 ? (
                <List>
                  {data?.request?.map((item, index, arr) => (
                    <Fragment
                      key={`${item.username}${item.type}${item.timestamp}${index}`}
                    >
                      <ListItem>
                        <FeedCard item={item} elevation={0} />
                      </ListItem>
                      {index !== arr.length - 1 && (
                        <Divider variant="fullWidth" sx={{ margin: "5px" }} />
                      )}
                    </Fragment>
                  ))}
                </List>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={"No requests yet"}
                  style={{ marginTop: "150px" }}
                />
              )}
            </>
          )}
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          <Typography
            component="p"
            sx={{
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            Recent notifications
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            height: "50vh",
            overflow: "auto",
            scrollbarWidth: "none",
          }}
        >
          {data?.others?.length > 0 ? (
            <List>
              {data?.others?.map((item, index, arr) => (
                <Fragment
                  key={`${item.username}${item.type}${item.timestamp}${index}`}
                >
                  <ListItem>
                    <FeedCard item={item} elevation={0} />
                  </ListItem>
                  {index !== arr.length - 1 && (
                    <Divider variant="fullWidth" sx={{ margin: "5px" }} />
                  )}
                </Fragment>
              ))}
            </List>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={"Nothing here yet"}
              style={{ marginTop: "150px" }}
            />
          )}
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default Notifications;
