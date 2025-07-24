import { AuthContext } from "../../context/authContext";
import { useContext, useState, useEffect } from "react";
import { Button, Result } from "antd";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useNavigate } from "react-router-dom";

const SettingsPlanResponse = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const { currentUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (user) => {
      return makeRequest.put("/users", user);
    },
    {
      onSuccess: () => {
        // Invalidate and refetch

        makeRequest.get("/users/find/" + currentUser.username).then((res) => {
          const { isMatched, type, status, isSent, isReceived, ...rest } =
            res.data;

          setStatus("complete");
          localStorage.setItem("user", JSON.stringify(rest));
        });

        queryClient.invalidateQueries(["user"]);
      },
      onError: (error) => {
        if (error?.response?.data?.message === "Session expired") {
          setStatus("error_expired");
        } else {
          console.error("Error updating user:", error);
        }
      },
    }
  );

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const sessionId = urlParams.get("session_id");
  const paystackReference = urlParams.get("reference");

  useEffect(() => {
    if (sessionId) {
      fetch(
        `${process.env.REACT_APP_baseURL}users/stripe-session-status?session_id=${sessionId}`
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.message === "Session not found") {
            setStatus("error");
          }
          if (res.message === "Session expired") {
            setStatus("error_expired");
          }

          if (res.status === "open") {
            navigate("/settings");
          }

          if (res.status === "complete" && res?.metadata?.planName) {
            mutation.mutate({
              plan: res.metadata.planName,
              allowPlan: true,
              sessionId,
              psp: "stripe",
            });
          }
        });
    }

    if (paystackReference) {
      fetch(
        `${process.env.REACT_APP_baseURL}users/confirm-paystack-transaction?paystack_reference=${paystackReference}`
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.message === "Session not found") {
            setStatus("error");
          }
          if (res.message === "Session expired") {
            setStatus("error_expired");
          }

          if (res.status === "success" && res?.metadata?.planName) {
            mutation.mutate({
              plan: res.metadata.planName,
              allowPlan: true,
              sessionId: paystackReference,
              psp: "paystack",
            });
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error" || status === "error_expired") {
    return (
      <Result
        status={"error"}
        title={
          status === "error"
            ? `Payment ran into an issue, please contact admin`
            : "Payment session has expired, please try to pay again"
        }
        subTitle="You will be notified soon if we find anything on our end"
        extra={[
          <Button key="settings" onClick={() => navigate("/settings")}>
            Back to Settings
          </Button>,
        ]}
      />
    );
  }

  if (status === "complete") {
    return (
      <Result
        status={"success"}
        title={`Successfully Purchased a Premium plan`}
        subTitle="You will be notified soon, Contact admin if you encounter any issues"
        extra={[
          <Button type="primary" key="home" onClick={() => navigate("/")}>
            Go Home
          </Button>,
          <Button key="settings" onClick={() => navigate("/settings")}>
            Back to Settings
          </Button>,
        ]}
      />
    );
  }

  return null;
};

export default SettingsPlanResponse;
