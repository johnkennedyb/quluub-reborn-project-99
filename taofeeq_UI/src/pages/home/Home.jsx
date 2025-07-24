import DashboardTabs from "../../components/dashboardTabs/DashboardTabs";
import DashboardTopBar from "../../components/dashboardTopBar/DashboardTopBar";
import DashboardFeeds from "../../components/dashboardFeeds/DashboardFeeds";
import "./home.scss";
import JoinInnerIcon from "@mui/icons-material/JoinInner";
import SendIcon from "@mui/icons-material/Send";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { pink } from "@mui/material/colors";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { Skeleton, Row, Col } from "antd";
import Advert from "../../components/advert/Advert";

const Home = () => {
  const [top, setTop] = useState(0);

  const { isLoading, data } = useQuery(["dashboard"], () =>
    makeRequest.get("/users/dashboard").then((res) => {
      return res.data;
    })
  );

  const topBar = isLoading
    ? []
    : [
        {
          title: "Matches",
          number: data?.matches?.count,
          stats: data?.matches?.percentageDifference,
          icon: <JoinInnerIcon color="primary" />,
          color: "#008080",
        },
        {
          title: "Received Requests",
          number: data?.received?.count,
          stats: data?.received?.percentageDifference,
          icon: <MoveToInboxIcon color="secondary" />,
          color: "#9c27b0",
        },
        {
          title: "Sent Requests",
          number: data?.sent?.count,
          stats: data?.sent?.percentageDifference,
          icon: (
            <SendIcon
              sx={{
                color: "#1976d2",
              }}
            />
          ),
          color: "#1976d2",
        },
        {
          title: "Profile Views",
          number: data?.views?.count,
          stats: data?.views?.percentageDifference,
          icon: <VisibilityIcon sx={{ color: pink[500] }} />,
          color: "#e91e63",
        },
      ];

  return isLoading ? (
    <Skeleton active />
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <DashboardTopBar topBar={topBar} setTop={setTop} />
      <Advert />

      <Row gutter={16}>
        <Col xs={24} sm={16}>
          <DashboardTabs
            receivedRequestArray={
              isLoading ? [] : data?.received?.receivedUsers
            }
            sentRequestArray={isLoading ? [] : data?.sent?.sentUsers}
            matchesArray={isLoading ? [] : data?.matches?.matchedUsers}
            isLoading={isLoading}
            top={top}
          />
        </Col>
        <Col xs={24} sm={8}>
          <DashboardFeeds feed={isLoading ? [] : data?.feed} />
        </Col>
      </Row>
    </div>
  );
};

export default Home;
