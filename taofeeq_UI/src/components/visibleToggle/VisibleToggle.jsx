import { AuthContext } from "../../context/authContext";
import { useContext } from "react";
import { Stack } from "@mui/material";
import { Button as AntButton, message, Popconfirm } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../axios";

const VisibleToggle = () => {
  const { currentUser, setCurrentUser } = useContext(AuthContext);

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (user) => {
      return makeRequest.put("/users", user);
    },
    {
      onSuccess: () => {
        // Invalidate and refetch
        message.success(
          currentUser.hidden
            ? "Your profile is now visible"
            : "Your profile is now hidden"
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

  return (
    <Stack direction="row" spacing={10} alignItems="center">
      <Popconfirm
        title={
          !currentUser.hidden ? "Hide my profile" : "Make my profile visible"
        }
        description={
          !currentUser.hidden
            ? "Are you sure you want to do this, you will be inaccessible to everyone"
            : "Are you sure you want to do this, you will be accessible to everyone"
        }
        onConfirm={() => {
          mutation.mutate({ hidden: currentUser.hidden ? null : "yes" });
        }}
        onCancel={() => {}}
        okText="Yes"
        cancelText="No"
      >
        Toggle visibility <br />
        <AntButton danger={!currentUser.hidden}>
          {!currentUser.hidden ? "Hide my profile" : "Show my profile"}
        </AntButton>
      </Popconfirm>
    </Stack>
  );
};

export default VisibleToggle;
