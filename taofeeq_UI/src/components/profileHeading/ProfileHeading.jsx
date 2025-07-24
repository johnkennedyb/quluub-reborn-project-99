import { useState } from "react";
import { Paper, Typography, Avatar, Stack, Tooltip, Chip } from "@mui/material";
import { Button, Popconfirm, Drawer, message } from "antd";

import { useLocation } from "react-router-dom";
import {
  capitalizeFirstLetter,
  noCompulsoryInfo,
  noDob,
  noWali,
} from "../../helpers";
import InfoIcon from "@mui/icons-material/Info";
import Chat from "../chat/Chat";
import { useMutation } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

const ProfileHeading = ({ inputs, canChat, refetch }) => {
  const { currentUser, isMobile } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [chatCount, setChatCount] = useState(0);

  const userId = useLocation().pathname.split("/")[2];

  const rejectMutation = useMutation(
    () => {
      return makeRequest.put("/relationships", { userId, status: "REJECTED" });
    },
    {
      onSuccess: () => {
        message.success(
          "You have rejected the request from " +
            capitalizeFirstLetter(inputs.username)
        );
        refetch();
      },
      onError: (error) => {},
    }
  );

  const mutation = useMutation(
    (unfollow) => {
      if (unfollow) {
        return makeRequest.delete("/relationships?userId=" + userId);
      }
      return makeRequest.post("/relationships", {
        userId,
      });
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate and refetch
        if (variables) {
          message.success(`Connection request withdrawn`);
        } else {
          message.success(`Request ${inputs.isReceived ? "Accepted" : "Sent"}`);
        }
        refetch();
      },
      onError: (error) => {
        if (error?.response?.data?.msg) {
          message.error(error?.response?.data?.msg);
        }
      },
    }
  );

  const showDrawer = () => {
    if (noWali(currentUser)) {
      message.error("Please set your wali details to chat");

      return;
    }

    if (noDob(currentUser)) {
      message.error("Please set your date of birth to chat");

      return;
    }

    if (noCompulsoryInfo(currentUser)) {
      message.error(
        "Please fill in your Summary, Nationality and Country of Residence to chat"
      );

      return;
    }

    if (currentUser.type === "NEW") {
      message.error("Please validate your email address to chat");

      return;
    }
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const confirm = (e) => {
    if (noWali(currentUser)) {
      message.error("Please set your wali details to continue");

      return;
    }

    if (noDob(currentUser)) {
      message.error("Please set your date of birth to continue");

      return;
    }

    if (noCompulsoryInfo(currentUser)) {
      message.error(
        "Please fill in your Summary, Nationality and Country of Residence to continue"
      );

      return;
    }

    if (currentUser.type === "NEW") {
      message.error("Please validate your email address to continue");

      return;
    }

    handleFollow();
  };

  const confirmReject = (e) => {
    if (noWali(currentUser)) {
      message.error("Please set your wali details to continue");

      return;
    }

    if (noDob(currentUser)) {
      message.error("Please set your date of birth to continue");

      return;
    }

    if (noCompulsoryInfo(currentUser)) {
      message.error(
        "Please fill in your Summary, Nationality and Country of Residence to continue"
      );

      return;
    }

    if (currentUser.type === "NEW") {
      message.error("Please validate your email address to continue");

      return;
    }

    handleReject();
  };

  const confirmRevoke = (e) => {
    if (noWali(currentUser)) {
      message.error("Please set your wali details to continue");

      return;
    }

    if (noDob(currentUser)) {
      message.error("Please set your date of birth to continue");

      return;
    }

    if (noCompulsoryInfo(currentUser)) {
      message.error(
        "Please fill in your Summary, Nationality and Country of Residence to continue"
      );

      return;
    }

    if (currentUser.type === "NEW") {
      message.error("Please validate your email address to continue");

      return;
    }

    handleFollow(true);
  };

  const cancel = (e) => {};

  const handleFollow = (following) => {
    mutation.mutate(following);
  };

  const handleReject = () => {
    rejectMutation.mutate();
  };

  return (
    <Paper
      elevation={1}
      sx={{
        padding: "20px",
        marginRight: "10px",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent={"space-between"}
      >
        <Stack direction={"row"} spacing={2}>
          <Avatar
            sx={{
              bgcolor: "#f8ae95",
            }}
          >
            {inputs?.kunya?.charAt(0).toUpperCase() ||
              inputs?.username?.charAt(0).toUpperCase() ||
              "Q"}
          </Avatar>

          <Stack>
            <Typography
              component="strong"
              sx={{
                textTransform: "capitalize",
                fontWeight: "bold",
                color: "#545e6f",
              }}
            >
              {inputs.username} {inputs.kunya && `(${inputs.kunya})`}
            </Typography>
            <Typography variant="caption">
              {userId
                ? `View ${capitalizeFirstLetter(
                    inputs.username
                  )}'s profile here`
                : "Manage your profile here"}
            </Typography>
          </Stack>
        </Stack>

        {userId && (
          <Stack
            direction={"row"}
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
          >
            {canChat && (
              <Tooltip title={`Chat with ${inputs.username}`}>
                <span>
                  <Button
                    aria-label="delete"
                    type="primary"
                    size="small"
                    onClick={showDrawer}
                  >
                    Chat with {capitalizeFirstLetter(inputs.username)}
                  </Button>
                </span>
              </Tooltip>
            )}

            <>
              {inputs.isSent ? (
                <>
                  <Popconfirm
                    title={`Withdraw connection ${canChat ? "" : "request"}`}
                    description={`Are you sure you want to do this ${
                      canChat ? "(all your chat history will be deleted)?" : ""
                    } `}
                    onConfirm={confirmRevoke}
                    onCancel={cancel}
                    icon={
                      <InfoIcon color="info" style={{ marginRight: "5px" }} />
                    }
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button danger size="small">
                      Withdraw connection {canChat ? "" : "request"}
                    </Button>
                  </Popconfirm>
                  {!canChat && inputs.hasRejectedMe && (
                    <Chip
                      label="Rejected your request"
                      color="error"
                      size="small"
                    />
                  )}
                </>
              ) : (
                <>
                  <Popconfirm
                    title={
                      inputs.isReceived
                        ? "Accept connection request"
                        : "Send connection request"
                    }
                    description="Are you sure you want to do this?"
                    onConfirm={confirm}
                    onCancel={cancel}
                    icon={
                      <InfoIcon color="info" style={{ marginRight: "5px" }} />
                    }
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="primary"
                      size="small"
                      disabled={inputs.isSent}
                      style={{ marginTop: "10px" }}
                    >
                      {inputs.isReceived
                        ? "Accept connection request from " +
                          capitalizeFirstLetter(inputs.username)
                        : "Send connection request to " +
                          capitalizeFirstLetter(inputs.username)}
                    </Button>
                  </Popconfirm>
                  {inputs.isReceived && (
                    <>
                      {inputs.hasBeenRejectedByMe ? (
                        <Chip
                          label="You rejected this request"
                          color="error"
                          size="small"
                          style={{ marginTop: "10px" }}
                        />
                      ) : (
                        <Popconfirm
                          title={"Reject connection request"}
                          description="Are you sure you want to do this?"
                          onConfirm={confirmReject}
                          onCancel={cancel}
                          icon={
                            <InfoIcon
                              color="info"
                              style={{ marginRight: "5px" }}
                            />
                          }
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button danger size="small" disabled={inputs.isSent}>
                            Reject connection request from{" "}
                            {capitalizeFirstLetter(inputs.username)}
                          </Button>
                        </Popconfirm>
                      )}
                    </>
                  )}
                </>
              )}
            </>
            {/* )} */}
          </Stack>
        )}
        <Drawer
          title={
            <Stack
              direction={isMobile ? "column" : "row"}
              justifyContent="space-between"
              flexWrap={"wrap"}
              alignItems={"center"}
            >
              <Stack
                direction={"row"}
                spacing={{ xs: 0, sm: 0, md: 1 }}
                alignItems={"center"}
                flexWrap={"wrap"}
              >
                <span>
                  Your chat with {inputs.username} {isMobile && <br />}
                </span>
                <small
                  style={{
                    color: "orange",
                  }}
                >
                  Keep it halaal,{" "}
                  {currentUser.gender === "male" ? "her" : "your"} Wali can view
                  these messages
                </small>
              </Stack>
              <small
                style={{
                  alignSelf: isMobile && "flex-start",
                  color: chatCount < 1 ? "red" : chatCount < 5 ? "orange" : "",
                }}
              >
                {chatCount} Messages left
              </small>
            </Stack>
          }
          onClose={onClose}
          open={open}
          width={isMobile ? "100%" : "70%"}
        >
          <Chat setChatCount={setChatCount} />
        </Drawer>
      </Stack>
    </Paper>
  );
};

export default ProfileHeading;
