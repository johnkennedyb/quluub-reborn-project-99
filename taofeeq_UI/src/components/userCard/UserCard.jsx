import { Paper, Typography, Divider, Chip, Box, Stack } from "@mui/material";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { capitalizeFirstLetter } from "../../helpers";
import { Typography as AntTypo, Tag } from "antd";
import dayjs from "dayjs";
import { countriesWithDetails } from "../../countries";
import * as Flags from "country-flag-icons/react/3x2";

const UserCard = ({ user, isSearch = false }) => {
  const navigate = useNavigate();

  const string = user.summary || "";

  const maxLength = 200;

  const daysAgo = (timestamp) => {
    const now = moment();
    const date = moment(timestamp);

    const diffInDays = now.diff(date, "days");

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else {
      return diffInDays + " days ago";
    }
  };

  function isOnline(timestamp) {
    if (!timestamp) return false;

    const inputTime = new Date(timestamp).getTime();
    const currentTime = Date.now();

    const differenceInMinutes = (currentTime - inputTime) / (1000 * 60);

    return differenceInMinutes <= 30;
  }

  const date1 = dayjs(user.dob);
  const date2 = dayjs();

  function getFlag(nationality) {
    if (!nationality) return false;
    const country = countriesWithDetails.filter(
      (v) => v.nationality.toLowerCase() === nationality.toLowerCase()
    );
    if (country.length < 1) return false;
    const code = country[0].country_code;

    const Flag = Flags[code];
    return (
      <div style={{ width: "20px" }}>
        <Flag title={code} />
      </div>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        padding: "10px",
        width: "100%",
        cursor: "pointer",
      }}
      onClick={() => navigate(`/profile/${user.username}`)}
    >
      <Stack direction={"row"} justifyContent={"space-between"}>
        <Box>
          <Typography
            component="strong"
            sx={{
              textTransform: "capitalize",
              fontWeight: "bold",
              color: "#545e6f",
            }}
          >
            {user.username} {user.kunya && `(${user.kunya})`}
          </Typography>
          {isOnline(user?.lastSeen) && (
            <Tag bordered={false} color="success">
              Online
            </Tag>
          )}
        </Box>
        <Box>
          {user.isMatched ? (
            <Chip label="Matched" color="success" size="small" />
          ) : user.isSent ? (
            <Chip label="Request sent" color="success" size="small" />
          ) : (
            user.isReceived && (
              <Chip label="Request received" color="success" size="small" />
            )
          )}

          {!user.isMatched && (
            <>
              {user.hasBeenRejectedByMe && (
                <Chip
                  label="You rejected this request"
                  color="error"
                  size="small"
                />
              )}
            </>
          )}

          {!user.isMatched && user.hasRejectedMe && (
            <Chip label="Rejected your request" color="error" size="small" />
          )}
        </Box>
      </Stack>
      <Divider variant="middle" sx={{ marginY: "5px" }} />

      {string ? (
        <Typography
          sx={{
            color: "#545e6f",
          }}
        >
          {string.length > maxLength
            ? `${string.substring(0, maxLength)}...`
            : string}
        </Typography>
      ) : (
        <AntTypo.Text type="secondary">User summary not set</AntTypo.Text>
      )}
      <div>
        <AntTypo.Text type="secondary" style={{ display: "flex", gap: "5px" }}>
          {user?.dob &&
            user?.dob !== "0000-00-00" &&
            user?.dob !== "0000-00-00 00:00:00" &&
            `${date2.diff(date1, "year")} year old `}
          {user?.nationality ? capitalizeFirstLetter(user?.nationality) : ""}
          {user?.nationality && getFlag(user?.nationality)}
          {user?.country
            ? "Lives in: " + capitalizeFirstLetter(user?.country)
            : ""}
        </AntTypo.Text>
      </div>
      <div>
        <Typography component={"i"}>
          {isSearch ? (
            <AntTypo.Text type="secondary">
              {"Last seen: "}

              {capitalizeFirstLetter(daysAgo(user?.lastSeen || user.created))}
            </AntTypo.Text>
          ) : (
            <AntTypo.Text type="secondary">
              {capitalizeFirstLetter(moment(user.latest_follow_date).fromNow())}
            </AntTypo.Text>
          )}
        </Typography>
      </div>
    </Paper>
  );
};

export default UserCard;
