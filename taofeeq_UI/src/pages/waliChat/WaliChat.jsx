import { useEffect, useState, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Paper, Box } from "@mui/material";
import { message, Image, Empty, Typography } from "antd";
import { makeRequest } from "../../axios";
import OutsideWrapper from "../../components/outsideWrapper/OutsideWrapper";
import { AuthContext } from "../../context/authContext";

const WaliChat = () => {
  const [chat, setChat] = useState([]);
  const [ward, setWard] = useState();
  const endOfDivRef = useRef(null);
  const { isMobile } = useContext(AuthContext);

  const navigate = useNavigate();

  const token = useLocation().pathname.split("/")[2];

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate, token]);

  useEffect(() => {
    if (chat.length > 0) {
      endOfDivRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.length]);

  useEffect(() => {
    handleWaliChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //call backend forgot password
  const handleWaliChat = async () => {
    try {
      makeRequest.get("/chat/wali?token=" + token).then(({ data }) => {
        if (Array.isArray(data.data)) {
          const temp = data.data.map((item, ind, arr) => {
            return {
              ...item,
              ref: ind === arr.length - 1 ? endOfDivRef : null,
            };
          });

          setChat(temp);
          setWard(data.ward);
        }
      });
    } catch (error) {
      message.error(error?.response?.data?.message);
    }
  };

  return (
    <OutsideWrapper>
      <Paper
        elevation={3}
        sx={{
          m: "20px",
        }}
      >
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Image
            width={200}
            src={`${process.env.PUBLIC_URL}/logo.png`}
            preview={false}
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          />

          <Box
            sx={{
              height: "90%",
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              scrollbarWidth: "none",
              gap: "20px",
              padding: "10px",
              width: isMobile ? "80vw" : "60vw",
            }}
            className="pyuu"
          >
            {chat.length && ward ? (
              <>
                <Typography.Text
                  style={{
                    alignSelf: "center",
                  }}
                >
                  Chat between {chat?.[0]?.sender} and {chat?.[0]?.receiver}{" "}
                </Typography.Text>

                {chat.map(
                  ({ message, sender, timestamp, ref, status }, ind, arr) => (
                    <Paper
                      key={timestamp + message}
                      elevation={1}
                      sx={{
                        width: isMobile ? "80%" : "45%",
                        alignSelf: sender === ward ? "flex-end" : "flex-start",
                        padding: "25px",
                        borderRadius:
                          sender === ward
                            ? "50px 50px 0px 50px"
                            : "50px 50px 50px 0px",
                        backgroundColor:
                          sender === ward ? "#75c0f9" : "#f7f7f7",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                      ref={ref}
                    >
                      {message}

                      <p>
                        <small>{sender}</small>
                      </p>
                    </Paper>
                  )
                )}
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <>
                    No messages found! <br /> This may be because either party
                    withdrew their connection
                  </>
                }
              />
            )}
          </Box>
        </Box>
      </Paper>
    </OutsideWrapper>
  );
};

export default WaliChat;
