import { Paper } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import SimpleBottomNavigation from "../simpleBottomNavigation/SimpleBottomNavigation";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import { Alert, Button, message, notification } from "antd";
import { Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { noCompulsoryInfo, noDob, noWali } from "../../helpers";
import { useMutation, useQuery } from "@tanstack/react-query";
import { makeRequest } from "../../axios";

const OutletWrapper = () => {
  const { currentUser } = useContext(AuthContext);

  const navigate = useNavigate();
  const currentRoute = useLocation().pathname.split("/")[1];

  const [api, contextHolder] = notification.useNotification();

  const mutation = useMutation(
    () => {
      return makeRequest.put("/auth/send-validation-email", {
        email: currentUser.email,
      });
    },
    {
      onSuccess: () => {
        message.success(
          "Mail sent successfully, you will be logged out now",
          5
        );
        message.success(
          "Please check your email (and spam folder) for a validation link to continue",
          5
        );
        message.success(
          "If you do not receive it in 2 hours, please contact support",
          5
        );
        navigate("/login");
      },
      onError: (error) => {
        message.error("Error sending validation mail, Try again later ", 2);
      },
    }
  );

  const { refetch } = useQuery(
    ["chat", currentUser.username],
    () =>
      makeRequest.get("/chat/allrec").then((res) => {
        return res.data;
      }),
    {
      refetchInterval: 300000, // 5 minute in milliseconds
      onSuccess: (data) => {
        if (Array.isArray(data)) {
          const newMessages = data.filter(
            ({ status, sender }) =>
              status === null && sender !== currentUser.username
          );
          if (newMessages.length > 0) {
            notification.destroy(); // remove existing

            if (!newMessages?.[0]?.sender) {
              return;
            }

            api["info"]({
              message: "New Chat Message",
              duration: 4,
              description: (
                <span>
                  You have a new message from{" "}
                  <b
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(`/profile/${newMessages?.[0]?.sender}`)
                    }
                  >
                    {newMessages?.[0]?.sender}
                  </b>
                </span>
              ),
            });
          }
        }
      },
    }
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: "auto",
        height: "97vh",
        paddingX: "10px",
        backgroundColor: "#f0f2f5",
        paddingBottom: "150px",
        paddingTop: "85px",
      }}
    >
      {contextHolder}
      <Stack>
        {noWali(currentUser) && (
          <Alert
            message="Please set your Wali details"
            type="warning"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => navigate("/profile", { state: { whereTo: 7 } })}
              >
                {currentRoute !== "profile"
                  ? "Go to my profile"
                  : "Go to Wali Details"}
              </Button>
            }
            style={{
              marginBottom: "10px",
            }}
          />
        )}

        {noDob(currentUser) && (
          <Alert
            message="Please set your date of birth"
            type="warning"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => navigate("/profile", { state: { whereTo: 0 } })}
              >
                {"Go to my profile"}
              </Button>
            }
            style={{
              marginBottom: "10px",
            }}
          />
        )}

        {noCompulsoryInfo(currentUser) && (
          <Alert
            message="Please fill in your Summary, Nationality and Country of Residence"
            type="warning"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => navigate("/profile", { state: { whereTo: 0 } })}
              >
                {"Go to my profile"}
              </Button>
            }
            style={{
              marginBottom: "10px",
            }}
          />
        )}

        {currentUser.type === "NEW" && (
          <Alert
            message="Please validate your email address to continue"
            type="warning"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => mutation.mutate()}
              >
                Resend validation mail
              </Button>
            }
            style={{
              marginBottom: "10px",
            }}
          />
        )}

        <Outlet />
        <SimpleBottomNavigation />
      </Stack>
    </Paper>
  );
};

export default OutletWrapper;
