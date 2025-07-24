import { Alert, Button } from "antd";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import { useNavigate } from "react-router-dom";

const PlanViewer = () => {
  const { currentUser } = useContext(AuthContext);

  const navigate = useNavigate();

  return (
    currentUser.requestsThisMonth >= currentUser.plan.requestsSentPerMonth && (
      <Alert
        message={`You have used all your requests this month, ${
          currentUser.plan.name === "freemium"
            ? "Upgrade to Premium plan or"
            : ""
        } try again next month`}
        type="warning"
        showIcon
        action={
          currentUser.plan.name === "freemium" && (
            <Button
              size="small"
              type="primary"
              onClick={() => navigate("/settings")}
            >
              Upgrade
            </Button>
          )
        }
        style={{
          marginBottom: "10px",
        }}
      />
    )
  );
};

export default PlanViewer;
