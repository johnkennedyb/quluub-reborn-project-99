import {
  Paper,
  Box,
  ListItem,
  List,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { Fragment, useState, useEffect, useContext } from "react";
import UserCard from "../userCard/UserCard";
import { Empty, Row, Col, Skeleton } from "antd";
import { AuthContext } from "../../context/authContext";

const DashboardTabs = ({
  receivedRequestArray,
  sentRequestArray,
  matchesArray,
  isLoading,
  top,
}) => {
  const [value, setValue] = useState(0);

  const { isMobile } = useContext(AuthContext);

  useEffect(() => {
    setValue(top);
  }, [top]);

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

  const handleAccordionChange = (newValue) => (event, isExpanded) => {
    setValue(isExpanded ? newValue : undefined);
  };

  return (
    <Row>
      <Col xs={0} sm={24}>
        <Paper elevation={0}>
          {isLoading ? (
            <Skeleton active />
          ) : (
            <Box sx={{ width: "100%" }}>
              <Box>
                <Tabs value={value} onChange={handleChange} centered>
                  <Tab
                    label={`Matches (${matchesArray?.length})`}
                    {...a11yProps(0)}
                  />
                  <Tab
                    label={`Received Requests (${receivedRequestArray?.length})`}
                    {...a11yProps(1)}
                  />
                  <Tab
                    label={`Sent Requests (${sentRequestArray?.length})`}
                    {...a11yProps(2)}
                  />
                </Tabs>
              </Box>
              <CustomTabPanel value={value} index={0}>
                {matchesArray?.length > 0 ? (
                  <List>
                    {matchesArray?.map((user) => (
                      <Fragment key={JSON.stringify(user)}>
                        <ListItem sx={{ padding: "4px" }}>
                          <UserCard user={user} />
                        </ListItem>
                      </Fragment>
                    ))}
                  </List>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={"No matches yet"}
                    style={{ marginTop: isMobile ? "70px" : "150px" }}
                  />
                )}
              </CustomTabPanel>
              <CustomTabPanel value={value} index={1}>
                {receivedRequestArray?.length > 0 ? (
                  <List>
                    {receivedRequestArray?.map((user) => (
                      <ListItem key={JSON.stringify(user)}>
                        <UserCard user={user} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={"No pending received requests yet"}
                    style={{ marginTop: isMobile ? "70px" : "150px" }}
                  />
                )}
              </CustomTabPanel>
              <CustomTabPanel value={value} index={2}>
                {sentRequestArray?.length > 0 ? (
                  <List>
                    {sentRequestArray?.map((user) => (
                      <Fragment key={JSON.stringify(user)}>
                        <ListItem sx={{ padding: "4px" }}>
                          <UserCard user={user} />
                        </ListItem>
                      </Fragment>
                    ))}
                  </List>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={"No pending sent requests yet "}
                    style={{ marginTop: isMobile ? "70px" : "150px" }}
                  />
                )}
              </CustomTabPanel>
            </Box>
          )}
        </Paper>
      </Col>
      <Col
        xs={24}
        sm={0}
        style={{
          paddingBottom: "10px",
        }}
      >
        <Accordion expanded={value === 0} onChange={handleAccordionChange(0)}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            Matches ({matchesArray?.length})
          </AccordionSummary>
          <AccordionDetails
            sx={{
              padding: "4px",
              overflow: "auto",
              scrollbarWidth: "thin",
              height: "250px",
            }}
          >
            {matchesArray?.length > 0 ? (
              <List>
                {matchesArray?.map((user) => (
                  <Fragment key={JSON.stringify(user)}>
                    <ListItem sx={{ padding: "4px" }}>
                      <UserCard user={user} />
                    </ListItem>
                  </Fragment>
                ))}
              </List>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={"No matches yet"}
                style={{ marginTop: isMobile ? "70px" : "150px" }}
              />
            )}
          </AccordionDetails>
        </Accordion>
        <Accordion expanded={value === 1} onChange={handleAccordionChange(1)}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            Received Requests ({receivedRequestArray?.length})
          </AccordionSummary>
          <AccordionDetails
            sx={{
              padding: "4px",
              overflow: "auto",
              scrollbarWidth: "thin",
              height: "250px",
            }}
          >
            {receivedRequestArray?.length > 0 ? (
              <List>
                {receivedRequestArray?.map((user) => (
                  <Fragment key={JSON.stringify(user)}>
                    <ListItem sx={{ padding: "4px" }}>
                      <UserCard user={user} />
                    </ListItem>
                  </Fragment>
                ))}
              </List>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={"No pending received requests yet"}
                style={{ marginTop: isMobile ? "70px" : "150px" }}
              />
            )}
          </AccordionDetails>
        </Accordion>
        <Accordion expanded={value === 2} onChange={handleAccordionChange(2)}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3-content"
            id="panel3-header"
          >
            Sent Requests ({sentRequestArray?.length})
          </AccordionSummary>
          <AccordionDetails
            sx={{
              padding: "4px",
              overflow: "auto",
              scrollbarWidth: "thin",
              height: "250px",
            }}
          >
            {sentRequestArray?.length > 0 ? (
              <List>
                {sentRequestArray?.map((user) => (
                  <Fragment key={JSON.stringify(user)}>
                    <ListItem sx={{ padding: "4px" }}>
                      <UserCard user={user} />
                    </ListItem>
                  </Fragment>
                ))}
              </List>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={"No pending sent requests yet "}
                style={{ marginTop: isMobile ? "70px" : "150px" }}
              />
            )}
          </AccordionDetails>
        </Accordion>
      </Col>
    </Row>
  );
};

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{
        height: "63.25vh",
        overflow: "auto",
        scrollbarWidth: "none",
      }}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default DashboardTabs;
