import "./profile.scss";
import ProfileHeading from "../../components/profileHeading/ProfileHeading";
import ProfileBasicInfo from "../../components/profileBasicInfo/ProfileBasicInfo";
import ProfileLocation from "../../components/profileLocation/ProfileLocation";
import ProfileAppearance from "../../components/profileAppearance/ProfileAppearance";
import ProfileDeen from "../../components/profileDeen/ProfileDeen";
import ProfileLifestyle from "../../components/profileLifestyle/ProfileLifestyle";
import ProfileMatching from "../../components/profileMatching/ProfileMatching";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import SidebarMenu from "../../components/sidebarMenu/SidebarMenu";
import { Button, message, Skeleton, Empty, Row, Col, Carousel } from "antd";

import { useState, useRef, useContext, useEffect } from "react";
import {
  Paper,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PermContactCalendarIcon from "@mui/icons-material/PermContactCalendar";
import MapIcon from "@mui/icons-material/Map";
import ContactsIcon from "@mui/icons-material/Contacts";
import MosqueIcon from "@mui/icons-material/Mosque";
import JoinInnerIcon from "@mui/icons-material/JoinInner";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import HotTubIcon from "@mui/icons-material/HotTub";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import ProfileWaliInfo from "../../components/profileWaliInfo/ProfileWaliInfo";

import {
  noCompulsoryInfo,
  noDob,
  removeNullUndefinedFields,
} from "../../helpers";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ProfileInterests from "../../components/profileInterests/ProfileInterests";
import PlanViewer from "../../components/planViewer/PlanViewer";
import { noWali as noWaliRenamed } from "../../helpers";

const Profile = () => {
  const queryClient = useQueryClient();

  const [hidden, setHidden] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const sliderRef = useRef(null);
  const next = () => {
    sliderRef.current.next();
  };
  const previous = () => {
    sliderRef.current.prev();
  };

  const [inputs, setInputs] = useState({
    fname: "",
    lname: "",
    dob: "",
    kunya: "",
    maritalStatus: "",
    noOfChildren: 0,
    country: "",
    region: "",
    ethnicity: undefined,
    nationality: "",
    height: 0,
    weight: 0,
    build: "",
    appearance: "",
    genotype: "",
    revert: "",
    startedPracticing: "",
    patternOfSalaah: "",
    // sect: "",
    summary: "",
    scholarsSpeakers: "",
    dressingCovering: "",
    islamicPractice: "",
    workEducation: "",
    otherDetails: "",
    traits: [],

    dealbreakers: [],
    icebreakers: [],
    openToMatches: [],

    waliDetails: {
      name: "",
      email: "",
      whatsapp: "",
      telegram: "",
      otherNumber: "",
    },
  });

  const { currentUser, setCurrentUser } = useContext(AuthContext);

  const confirm = (e) => {
    if (noWaliRenamed(inputs)) {
      message.info("Please set your wali details to continue");
    }

    if (noDob(inputs)) {
      message.info("Please set your date of birth to continue");
    }

    if (noCompulsoryInfo(inputs)) {
      message.info(
        "Please fill in your Summary, Nationality and Country of Residence to continue"
      );
    }

    handleSubmit();
  };

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    const mergedTraits = [...new Set(inputs.traits.filter((item) => !!item))];

    const toSave = {
      ...inputs,

      ethnicity:
        inputs?.ethnicity && inputs.ethnicity.length > 0
          ? JSON.stringify(inputs.ethnicity)
          : undefined,

      traits:
        mergedTraits?.length > 0 ? JSON.stringify(mergedTraits) : undefined,

      openToMatches:
        inputs?.openToMatches?.length > 0
          ? JSON.stringify(inputs.openToMatches)
          : undefined,

      dealbreakers:
        inputs?.dealbreakers?.length > 0
          ? JSON.stringify(inputs.dealbreakers)
          : undefined,

      icebreakers:
        inputs?.icebreakers?.length > 0
          ? JSON.stringify(inputs.icebreakers)
          : undefined,

      waliDetails: inputs.waliDetails
        ? JSON.stringify(inputs.waliDetails)
        : undefined,
    };

    delete toSave.baseTraits;
    delete toSave.deenTraits;
    delete toSave.recreationTraits;
    delete toSave.foodDrinksTravelTraits;
    delete toSave.sportsMiscTraits;

    const cleanedObj = removeNullUndefinedFields(toSave);

    mutation.mutate(cleanedObj);
  };

  const menus = [
    {
      icon: <PermContactCalendarIcon />,
      text: "Basic Info",
      to: useRef(null),
    },
    {
      icon: <MosqueIcon />,
      text: "Deen",
      to: useRef(null),
    },
    {
      icon: <MapIcon />,
      text: "Location and Ethnicity",
      to: useRef(null),
    },
    {
      icon: <ContactsIcon />,
      text: "Appearance and Co",
      to: useRef(null),
    },
    {
      icon: <BeachAccessIcon />,
      text: "Lifestyle and Traits",
      to: useRef(null),
    },
    {
      icon: <HotTubIcon />,
      text: "Interests",
      to: useRef(null),
    },
    {
      icon: <JoinInnerIcon />,
      text: "Matching Details",
      to: useRef(null),
    },
    {
      icon: <FamilyRestroomIcon />,
      text: "Wali Details",
      to: useRef(null),
    },
  ];

  const userId = useLocation().pathname.split("/")[2];

  const location = useLocation();
  const { state } = location;

  useEffect(() => {
    // handle goto wali details click on top banner
    if (state?.whereTo) {
      sliderRef?.current?.goTo(state?.whereTo);
    }
  }, [state]);

  const { isLoading, data, refetch } = useQuery(["user"], () =>
    userId
      ? makeRequest.get("/users/find/" + userId).then((res) => {
          if (res.data.msg === "Profile is hidden") {
            setHidden(true);
          }

          return res.data;
        })
      : {}
  );

  const mutation = useMutation(
    (user) => {
      return makeRequest.put("/users", user);
    },
    {
      onSuccess: () => {
        // Invalidate and refetch
        message.success("Update Successful");

        makeRequest.get("/users/find/" + currentUser.username).then((res) => {
          const { isMatched, status, isSent, isReceived, ...rest } = res.data;

          setCurrentUser(rest);
        });

        queryClient.invalidateQueries(["user"]);
      },
      onError: (error) => {
        console.error("Error updating user:", error);
      },
    }
  );

  useEffect(() => {
    if (!isLoading && data && userId) {
      setInputs({
        ...data,

        ethnicity: data.ethnicity ? JSON.parse(data.ethnicity) : undefined,

        traits: data.traits ? JSON.parse(data.traits) : [],

        dealbreakers: data.dealbreakers ? JSON.parse(data.dealbreakers) : [],
        icebreakers: data.icebreakers ? JSON.parse(data.icebreakers) : [],
        openToMatches: data.openToMatches ? JSON.parse(data.openToMatches) : [],

        waliDetails: data.waliDetails
          ? JSON.parse(data.waliDetails)
          : {
              name: "",
              email: "",
              whatsapp: "",
              telegram: "",
              otherNumber: "",
            },
      });
    } else if (currentUser) {
      setInputs({
        ...currentUser,

        ethnicity: currentUser.ethnicity
          ? JSON.parse(currentUser.ethnicity)
          : undefined,

        traits: currentUser.traits ? JSON.parse(currentUser.traits) : [],

        dealbreakers: currentUser.dealbreakers
          ? JSON.parse(currentUser.dealbreakers)
          : [],
        icebreakers: currentUser.icebreakers
          ? JSON.parse(currentUser.icebreakers)
          : [],
        openToMatches: currentUser.openToMatches
          ? JSON.parse(currentUser.openToMatches)
          : [],

        waliDetails: currentUser.waliDetails
          ? JSON.parse(currentUser.waliDetails)
          : {
              name: "",
              email: "",
              whatsapp: "",
              telegram: "",
              otherNumber: "",
            },
      });
    }
  }, [data, isLoading, userId, currentUser]);

  const matched = () => userId && inputs.isMatched;

  const text = !!userId;

  const canSeeWaliDetails =
    (currentUser.gender === "male" && userId && matched()) ||
    (currentUser.gender === "female" && !userId);

  const noWali =
    (currentUser.gender === "male" && !userId) ||
    (currentUser.gender === "female" && userId);

  return isLoading ? (
    <Skeleton active />
  ) : hidden ? (
    <Empty
      image={<VisibilityOffIcon style={{ fontSize: 60 }} />}
      description={"This profile is hidden"}
      style={{ marginTop: "150px" }}
    />
  ) : (
    <Row gutter={16}>
      <Col xs={24}>{userId && <PlanViewer />}</Col>
      <Col xs={0} sm={6}>
        <Stack
          spacing={2}
          style={{
            overflow: "auto",
            height: "70vh",
            scrollbarWidth: "none",
          }}
        >
          <Paper
            elevation={1}
            sx={{
              paddingY: "20px",
            }}
          >
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "25px",
              }}
            >
              {menus
                .filter((menu) =>
                  noWali ? menu.text !== "Wali Details" : true
                )
                .map((menu, i) => (
                  <SidebarMenu
                    key={menu.text}
                    {...menu}
                    onClick={() => {
                      sliderRef.current.goTo(i);
                    }}
                  />
                ))}
            </Box>
          </Paper>

          {!userId && (
            <Paper
              elevation={1}
              sx={{
                padding: "20px",
              }}
            >
              <Button type="primary" block onClick={confirm}>
                Update my profile
              </Button>
            </Paper>
          )}
        </Stack>
      </Col>

      <Col xs={24} sm={0} style={{ marginBottom: "15px" }}>
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded((prev) => !prev)}
        >
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
              Profile Menu
            </Typography>
            {!expanded && (
              <Typography sx={{ color: "text.secondary", marginLeft: "1em" }}>
                Click here or swipe to navigate
              </Typography>
            )}
          </AccordionSummary>
          <AccordionDetails>
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "25px",
              }}
            >
              {menus
                .filter((menu) =>
                  noWali ? menu.text !== "Wali Details" : true
                )
                .map((menu, i) => (
                  <SidebarMenu
                    key={menu.text}
                    {...menu}
                    onClick={() => {
                      setExpanded(false);
                      sliderRef.current.goTo(i);
                    }}
                  />
                ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Col>

      <Col
        sm={18}
        xs={24}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",

          height: "80vh",
          overflow: "auto",
          scrollbarWidth: "none",
          paddingY: "5px !important",
        }}
      >
        <ProfileHeading inputs={inputs} canChat={matched()} refetch={refetch} />

        <Row align="middle" style={{ marginBottom: "50px" }}>
          <Col xs={0} sm={1}>
            {currentSlide > 0 && (
              <IconButton onClick={previous}>
                <ArrowBackIcon style={{ color: "teal" }} />
              </IconButton>
            )}
          </Col>

          <Col xs={24} sm={22}>
            <Carousel
              afterChange={(index) => {
                setCurrentSlide(index);
                document.activeElement.blur();
              }}
              infinite={false}
              ref={sliderRef}
            >
              <div>
                <ProfileBasicInfo
                  menu={menus[0]}
                  inputs={inputs}
                  handleChange={handleChange}
                  text={text}
                />
              </div>

              <div>
                <ProfileDeen
                  menu={menus[1]}
                  inputs={inputs}
                  handleChange={handleChange}
                  text={text}
                />
              </div>

              <div>
                <ProfileLocation
                  menu={menus[2]}
                  inputs={inputs}
                  handleChange={handleChange}
                  text={text}
                />
              </div>

              <div>
                <ProfileAppearance
                  menu={menus[3]}
                  inputs={inputs}
                  handleChange={handleChange}
                  text={text}
                />
              </div>

              <div>
                <ProfileLifestyle
                  menu={menus[4]}
                  inputs={inputs}
                  handleChange={handleChange}
                  text={text}
                />
              </div>

              <div>
                <ProfileInterests
                  menu={menus[5]}
                  inputs={inputs}
                  handleChange={handleChange}
                  text={text}
                />
              </div>

              <div>
                <ProfileMatching
                  menu={menus[6]}
                  inputs={inputs}
                  handleChange={handleChange}
                  text={text}
                />
              </div>

              {!noWali ? (
                <div>
                  <ProfileWaliInfo
                    menu={menus[7]}
                    inputs={inputs}
                    handleChange={handleChange}
                    text={text}
                    canSeeWaliDetails={canSeeWaliDetails}
                  />
                </div>
              ) : null}
            </Carousel>
          </Col>

          <Col xs={0} sm={1}>
            <IconButton onClick={next}>
              <ArrowForwardIcon style={{ color: "teal" }} />
            </IconButton>
          </Col>

          <Col xs={24} sm={0}>
            {!userId && (
              <Paper
                elevation={1}
                sx={{
                  padding: "20px",
                }}
              >
                <Button type="primary" block onClick={confirm}>
                  Update my profile
                </Button>
              </Paper>
            )}
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default Profile;
