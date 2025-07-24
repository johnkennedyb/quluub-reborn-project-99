import NationalitySelect from "../../components/nationalitySelect/NationalitySelect";
import CountrySelect from "../../components/countrySelect/CountrySelect";
import "./search.scss";
import {
  Grid,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
} from "@mui/material";
import { useState, useContext, Fragment, useEffect } from "react";
import {
  Typography as AntTypo,
  Slider,
  Card,
  Flex,
  Button,
  Empty,
  Skeleton,
} from "antd";
import BuildSelect from "../../components/buildSelect/BuildSelect";
import FacialSelect from "../../components/facialSelect/FacialSelect";
import MaritalSelect from "../../components/maritalSelect/MaritalSelect";
import SalaahSelect from "../../components/salaahSelect/SalaahSelect";
import { AuthContext } from "../../context/authContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { makeRequest } from "../../axios";
import {
  camelCaseToWords,
  allFieldsRemoveAny,
  removeNullUndefinedFields,
} from "../../helpers";
import GenotypeSelect from "../../components/genotypeSelect/GenotypeSelect";
import UserCard from "../../components/userCard/UserCard";
import PlanViewer from "../../components/planViewer/PlanViewer";
import Advert from "../../components/advert/Advert";
import PrevNext from "../../components/prevNext/PrevNext";

const Search = () => {
  const [results, setResults] = useState();
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);
  const [lastRequest, setLastRequest] = useState("");

  const [inputs, setInputs] = useState({
    nationality: "",
    country: "",
    ageRange: [22, 45],
    heightRange: [52, 80],
    weightRange: [50, 90],
    build: "",
    appearance: "",
    maritalStatus: "",
    patternOfSalaah: "",
    genotype: "",
    // sect: "",
    sortBy: "lastSeen",
  });

  const { currentUser } = useContext(AuthContext);

  const summaryEnabled = Object.values(inputs).every((val) => !!val);

  const handleToggleChange = (event) => {
    setInputs((prev) => ({ ...prev, sortBy: event.target.value }));

    const newReq = updateQueryParam(lastRequest, "sortBy", event.target.value);

    doSearch(newReq);
  };

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = () => {
    setExpanded(false);

    const stringifiedInputs = {
      ...allFieldsRemoveAny(removeNullUndefinedFields(inputs)),
    };

    setPage(1);

    const urlParams = new URLSearchParams({
      ...stringifiedInputs,
    }).toString();

    doSearch("/users/search?" + urlParams);
  };

  const doSearch = (req) => {
    setLoading(true);
    makeRequest
      .get(req)
      .then((res) => {
        setResults(res.data.returnData);
        setTotalPages(res.data.totalPages);
        setLastRequest(req);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const updateQueryParam = (relativeUrl, key, value) => {
    const baseUrl = "https://dummy.com"; // Temporary base URL
    let urlObj = new URL(relativeUrl, baseUrl);
    let params = urlObj.searchParams;

    params.set(key, value);

    return urlObj.pathname + urlObj.search; // Remove the dummy base URL
  };

  useEffect(() => {
    doSearch("/users/search");
  }, []);

  return (
    <>
      <PlanViewer />
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded((prev) => !prev)}
        style={{ width: "100%", marginBottom: "10px" }}
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
              marginBottom: "5px",
              fontSize: "15px",
            }}
          >
            Set your preferences and we will find{" "}
            {currentUser.gender === "male" ? "her" : "him"} in shaa Allaah
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box style={{ width: "98%", marginBottom: "10px" }}>
            <Grid container rowSpacing={1} columnSpacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <NationalitySelect
                  inputs={inputs}
                  handleChange={handleChange}
                  noEmpty={false}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <CountrySelect
                  inputs={inputs}
                  handleChange={handleChange}
                  noEmpty={false}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <BuildSelect
                  inputs={inputs}
                  handleChange={handleChange}
                  noEmpty={false}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <GenotypeSelect
                  inputs={inputs}
                  handleChange={handleChange}
                  noEmpty={false}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FacialSelect
                  inputs={inputs}
                  handleChange={handleChange}
                  noEmpty={false}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <MaritalSelect
                  inputs={inputs}
                  handleChange={handleChange}
                  noEmpty={false}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={6}>
                <SalaahSelect
                  inputs={inputs}
                  handleChange={handleChange}
                  noEmpty={false}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                  }}
                >
                  <Typography variant="caption" style={{ width: "90px" }}>
                    Age range
                  </Typography>
                  <Slider
                    style={{ width: "100%" }}
                    range
                    marks={{
                      18: "18",
                      60: "60",
                    }}
                    tooltip={{
                      formatter: (num) => `${num} years old`,
                    }}
                    value={inputs.ageRange}
                    min={18}
                    max={60}
                    onChange={(value) => {
                      handleChange({
                        target: {
                          name: "ageRange",
                          value,
                        },
                      });
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                  }}
                >
                  <Typography variant="caption" style={{ width: "120px" }}>
                    Height range
                  </Typography>
                  <Slider
                    style={{ width: "100%" }}
                    range
                    marks={{
                      48: `${Math.floor(48 / 12)}'${48 % 12}"`,
                      96: `${Math.floor(96 / 12)}'${96 % 12}"`,
                    }}
                    tooltip={{
                      formatter: (num) =>
                        `${Math.floor(num / 12)}'${num % 12}"`,
                    }}
                    value={inputs.heightRange}
                    min={48}
                    max={96}
                    onChange={(value) => {
                      handleChange({
                        target: {
                          name: "heightRange",
                          value,
                        },
                      });
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "baseline",
                  }}
                >
                  <Typography variant="caption" style={{ width: "120px" }}>
                    Weight range
                  </Typography>
                  <Slider
                    style={{ width: "100%" }}
                    range
                    marks={{
                      30: `${30}kg`,
                      125: `${125}kg`,
                    }}
                    tooltip={{
                      formatter: (num) => `${num}kg`,
                    }}
                    value={inputs.weightRange}
                    min={30}
                    max={125}
                    onChange={(value) => {
                      handleChange({
                        target: {
                          name: "weightRange",
                          value,
                        },
                      });
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            <Flex
              style={{ width: "100%", marginTop: "20px" }}
              justify={"flex-end"}
            >
              <Button type="primary" onClick={() => handleSearch(page)}>
                Search
              </Button>
            </Flex>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* this is hidden and false means it wont show so maybe delete? */}
      {summaryEnabled && false && (
        <Card>
          <Typography
            component="p"
            sx={{
              fontWeight: "bold",
              marginY: "10px",
            }}
          >
            Preference summary
          </Typography>

          <Typography component="span">
            {`You want a ${inputs.ageRange[0]} to ${
              inputs.ageRange[1]
            } year old ${inputs.nationality} ${
              currentUser.gender === "male" ? "sister" : "brother"
            }  who lives in ${inputs.country}. ${
              currentUser.gender === "male" ? "Her" : "His"
            } build should be ${inputs.build} with ${inputs.appearance} looks`}
            .{" "}
          </Typography>
          <Typography component="span">
            {`Somewhere between ${Math.floor(inputs.heightRange[0] / 12)}'${
              inputs.heightRange[0] % 12
            }" to ${Math.floor(inputs.heightRange[1] / 12)}'${
              inputs.heightRange[1] % 12
            }" in height and weighs from around ${inputs.weightRange[0]} to ${
              inputs.weightRange[1]
            } kg`}
            .{" "}
          </Typography>

          <Typography component="span">
            {`${currentUser.gender === "male" ? "She" : "He"} should be ${
              inputs.maritalStatus
            } one who ${camelCaseToWords(inputs.patternOfSalaah)} prays ${
              currentUser.gender === "male" ? "her" : "his"
            } salaah`}
            .
          </Typography>
        </Card>
      )}

      {loading ? (
        <Skeleton active />
      ) : (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
          >
            <AntTypo.Text type="secondary">Sort by</AntTypo.Text>

            <ToggleButtonGroup
              color="primary"
              orientation={"horizontal"}
              value={inputs.sortBy}
              exclusive
              onChange={handleToggleChange}
              aria-label="Platform"
              size="small"
            >
              <ToggleButton value="lastSeen">Last Seen</ToggleButton>
              <ToggleButton value="created">Newest</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {results ? (
            results.length > 0 ? (
              <Stack
                direction={"column"}
                sx={{
                  paddingBottom: "60px",
                }}
              >
                <List>
                  {results.map((user, index) => (
                    <Fragment key={JSON.stringify(user)}>
                      <ListItem>
                        <UserCard user={user} isSearch={true} />
                      </ListItem>
                      {(index + 1) % 5 === 0 && <Advert />}
                    </Fragment>
                  ))}
                </List>
                <PrevNext
                  handlePrev={() => {
                    if (page >= 2) {
                      const newPage = page - 1;

                      setPage(newPage);

                      const newReq = updateQueryParam(
                        lastRequest,
                        "page",
                        newPage
                      );

                      doSearch(newReq);
                    }
                  }}
                  handleNext={() => {
                    if (page <= totalPages) {
                      const newPage = page + 1;

                      setPage(page + 1);

                      const newReq = updateQueryParam(
                        lastRequest,
                        "page",
                        newPage
                      );

                      doSearch(newReq);
                    }
                  }}
                  prevDisabled={page === 1}
                  nextDisabled={page === totalPages}
                  isLastPage={page === totalPages}
                  totalPages={totalPages}
                  page={page}
                />
              </Stack>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_DEFAULT}
                description={
                  "Your search did not return any results, try again"
                }
              />
            )
          ) : null}
        </>
      )}
    </>
  );
};

export default Search;
