import { AuthContext } from "../../context/authContext";
import { useContext, useState } from "react";
import { Paper, Grid, Typography, Box, Stack } from "@mui/material";
import { message, Skeleton, Badge, Segmented } from "antd";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { capitalizeFirstLetter } from "../../helpers";
import SettingsPlanCard from "../settingsPlanCard/SettingsPlanCard";

const SettingsPlan = ({ menu }) => {
  const [segment, setSegment] = useState("international");

  const { currentUser, setCurrentUser } = useContext(AuthContext);

  const queryClient = useQueryClient();

  const { isLoading, data } = useQuery(
    ["plans"],
    () =>
      makeRequest.get("/users/plans").then((res) => {
        return res.data;
      }),
    {
      refetchInterval: 60000, // 1 minute in milliseconds
    }
  );

  const mutation = useMutation(
    (user) => {
      return makeRequest.put("/users", user);
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate and refetch
        message.success(
          `Activated ${capitalizeFirstLetter(variables.plan)} plan`
        );

        makeRequest.get("/users/find/" + currentUser.username).then((res) => {
          const { isMatched, type, status, isSent, isReceived, ...rest } =
            res.data;

          setCurrentUser(rest);
        });

        queryClient.invalidateQueries(["user"]);
      },
      onError: (error) => {
        console.error("Error updating user:", error);
      },
    }
  );

  const localStoragePlan = JSON.parse(
    localStorage.getItem("user")
  )?.plan?.name.toLowerCase();

  return (
    <Paper
      elevation={1}
      sx={{
        padding: "20px",
        marginRight: "10px",
      }}
      ref={menu.to}
    >
      <Typography
        component="strong"
        sx={{
          textTransform: "capitalize",
          fontWeight: "bold",
          color: "#545e6f",
        }}
      >
        {menu.text}
      </Typography>
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Box
          component="form"
          noValidate
          sx={{ my: 2, display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <Grid
            container
            rowSpacing={3}
            columnSpacing={1}
            justifyContent={"center"}
          >
            <Grid item xs={12}>
              <Stack direction={"row"} justifyContent={"center"}>
                <Segmented
                  options={["International", "Naira"]}
                  onChange={(value) => {
                    setSegment(value.toLowerCase());
                  }}
                />
              </Stack>
            </Grid>
            {Object.values(data.plans).map((plan) => (
              <Grid item xs={12} sm={4} key={JSON.stringify(plan)}>
                {plan.name === "premium" ? (
                  <Badge.Ribbon text="Recommended">
                    <SettingsPlanCard
                      currentUser={currentUser}
                      plan={plan}
                      mutation={mutation}
                      segment={segment}
                      disableButton={false}
                    />
                  </Badge.Ribbon>
                ) : (
                  <SettingsPlanCard
                    currentUser={currentUser}
                    plan={plan}
                    mutation={mutation}
                    segment={segment}
                    disableButton={localStoragePlan !== "freemium"}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default SettingsPlan;
