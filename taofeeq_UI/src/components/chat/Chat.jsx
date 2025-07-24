import { useState } from "react";
import { Paper, Box, Stack, Typography } from "@mui/material";
import { Button, Empty, Space, Input, message } from "antd";

import { useLocation } from "react-router-dom";
import { useContext, useRef, useEffect } from "react";
import { AuthContext } from "../../context/authContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { makeRequest } from "../../axios";

const Chat = ({ setChatCount }) => {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);

  const endOfDivRef = useRef(null);
  const { currentUser } = useContext(AuthContext);

  const userId = useLocation().pathname.split("/")[2];

  useEffect(() => {
    setChatCount(
      currentUser?.plan?.messageAllowance -
        chat?.filter((msg) => msg?.sender === currentUser?.username).length || 0
    );

    if (chat.length > 0) {
      endOfDivRef.current.scrollIntoView({ behavior: "smooth" });

      // once scrolled to recent messages, it is assumed to be read
      // so we get all messages where current user is the receiver
      // and mark as read

      const ids = chat
        .filter(
          ({ receiver, status }) =>
            receiver === currentUser.username && status === null
        )
        .map(({ id }) => id);

      if (ids.length > 0) {
        readMutation.mutate({
          ids,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.length]);

  const { refetch } = useQuery(
    ["chat", userId],
    () =>
      makeRequest.get("/chat?userId=" + userId).then((res) => {
        return res.data;
      }),
    {
      refetchInterval: 60000, // 1 minute in milliseconds
      onSuccess: (data) => {
        if (Array.isArray(data)) {
          const temp = data.map((item, ind, arr) => {
            return {
              ...item,
              ref: ind === arr.length - 1 ? endOfDivRef : null,
            };
          });

          setChat(temp);
        }
      },
    }
  );

  const mutation = useMutation(
    () => {
      return makeRequest.post("/chat", {
        userId,
        message: msg,
      });
    },
    {
      onSuccess: (_) => {
        //  refetch
        setMsg("");
        refetch();
      },
    }
  );

  const readMutation = useMutation(
    (ids) => {
      return makeRequest.put("/chat", ids);
    },
    {
      onSuccess: () => {},
      onError: (error) => {},
    }
  );

  const hasMetOrExceededPlan =
    chat.filter((msg) => msg.sender === currentUser.username).length >=
    currentUser?.plan?.messageAllowance;

  const hasMetOrExceededWordCountPerMessage =
    msg.split(" ").length >= currentUser?.plan?.wordCountPerMessage;

  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      <Box
        sx={{
          height: "90%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          scrollbarWidth: "none",
          gap: "20px",
          padding: "10px",
        }}
      >
        {chat ? (
          <>
            {chat.map(
              ({ message, sender, timestamp, ref, status }, ind, arr) => (
                <Paper
                  key={timestamp + message}
                  elevation={1}
                  sx={{
                    width: "45%",
                    alignSelf:
                      sender === currentUser.username
                        ? "flex-end"
                        : "flex-start",
                    padding: "25px",
                    borderRadius:
                      sender === currentUser.username
                        ? "50px 50px 0px 50px"
                        : "50px 50px 50px 0px",
                    backgroundColor:
                      sender === currentUser.username ? "#75c0f9" : "#f7f7f7",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                  ref={ref}
                >
                  {message}
                  {status === null && sender !== currentUser.username && (
                    <small style={{ color: "green" }}>New</small>
                  )}
                </Paper>
              )
            )}
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              "Please send a message to begin conversation with " + userId
            }
          />
        )}
      </Box>
      <Space.Compact style={{ width: "100%" }}>
        <Input
          placeholder="Type a message"
          value={msg}
          onChange={(e) => {
            if (hasMetOrExceededWordCountPerMessage || hasMetOrExceededPlan) {
              message.config({
                maxCount: 1,
              });
              message.error(
                hasMetOrExceededWordCountPerMessage
                  ? `You have a max of ${
                      currentUser?.plan?.wordCountPerMessage || 21
                    } words per message, please make it concise`
                  : hasMetOrExceededPlan
                  ? `You have a maximum of ${currentUser?.plan?.messageAllowance} messages`
                  : ""
              );
            }

            setMsg(e.target.value);
          }}
          disabled={hasMetOrExceededPlan}
          status={hasMetOrExceededWordCountPerMessage && `error`}
        />

        <Button
          type="primary"
          onClick={() => {
            mutation.mutate();
          }}
          disabled={
            msg.length < 5 ||
            hasMetOrExceededPlan ||
            hasMetOrExceededWordCountPerMessage
          }
        >
          Send
        </Button>
      </Space.Compact>
      {(hasMetOrExceededWordCountPerMessage || hasMetOrExceededPlan) && (
        <Typography
          color={"error"}
          variant="caption"
          display="block"
          style={{ textAlign: "center" }}
        >
          {hasMetOrExceededWordCountPerMessage
            ? `You have a max of ${
                currentUser?.plan?.wordCountPerMessage || 21
              } words per message, please make it concise`
            : hasMetOrExceededPlan
            ? `You have a maximum of ${currentUser?.plan?.messageAllowance} messages`
            : ""}
        </Typography>
      )}
    </Stack>
  );
};

export default Chat;
