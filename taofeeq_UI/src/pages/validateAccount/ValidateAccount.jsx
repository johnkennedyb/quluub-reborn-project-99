import { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Paper } from "@mui/material";
import { message, Skeleton } from "antd";
import { makeRequest } from "../../axios";
import OutsideWrapper from "../../components/outsideWrapper/OutsideWrapper";

const ValidateAccount = () => {
  const navigate = useNavigate();

  const token = useLocation().pathname.split("/")[2];

  const handleValidateAccount = useCallback(async () => {
    try {
      await makeRequest.post("/auth/validate-email", {
        token,
      });
      navigate("/login");
      message.success("Validation Successful, please login");
    } catch (error) {
      message.error(error?.response?.data?.message);
      navigate("/register");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/register");
    } else {
      handleValidateAccount();
    }
  }, [handleValidateAccount, navigate, token]);

  return (
    <OutsideWrapper>
      <Paper
        elevation={3}
        sx={{
          m: "20px",
        }}
      >
        <Skeleton active />
      </Paper>
    </OutsideWrapper>
  );
};

export default ValidateAccount;
