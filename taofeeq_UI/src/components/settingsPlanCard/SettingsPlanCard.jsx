import { useCallback, useContext, useState } from "react";
import {
  Box,
  Stack,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { Drawer, Button, Card, Popconfirm, Tag } from "antd";
import InfoIcon from "@mui/icons-material/Info";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

import { camelCaseToWords, capitalizeFirstLetter } from "../../helpers";
import { PaystackConsumer } from "react-paystack";
import { AuthContext } from "../../context/authContext";
import { createSearchParams, useNavigate } from "react-router-dom";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_API_KEY);

const SettingsPlanCard = ({
  currentUser,
  plan,
  mutation,
  segment,
  disableButton,
}) => {
  const [open, setOpen] = useState(false);

  const { isMobile } = useContext(AuthContext);

  const amountNaira = plan.discountPercent
    ? Math.ceil(
        (parseInt(plan[`${segment}Price`]) *
          (100 - parseInt(plan.discountPercent))) /
          100
      )
    : parseInt(plan[`${segment}Price`]);

  const fetchClientSecret = useCallback(() => {
    // Create a Checkout Session
    return fetch(
      `${process.env.REACT_APP_baseURL}users/stripe-create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: { ...plan, email: currentUser.email } }),
      }
    )
      .then((res) => res.json())
      .then((data) => data.clientSecret);
  }, [currentUser.email, plan]);

  const options = { fetchClientSecret };

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const confirm = (plan) => {
    // add make payment step here before activating plan

    if (segment === "naira") {
      if (plan.nairaPrice > 0) {
        // call FW
        // payToPaystack(plan);
      } else {
        mutation.mutate({ plan: plan.name, allowPlan: true });
      }
    }

    if (segment === "international") {
      if (plan.internationalPrice > 0) {
        // call stripe
        setOpen(true);
      } else {
        mutation.mutate({ plan: plan.name, allowPlan: true });
      }
    }
  };

  const dontShowKeys = [
    "name",
    "nairaPrice",
    "internationalPrice",
    "discountPercent",
  ];

  const listItemPrimary = ([key, value]) => {
    return (
      <>
        {camelCaseToWords(key)}: {value}
      </>
    );
  };

  const currencyMap = {
    naira: "₦",
    international: `£`,
  };

  const pricePanel = () => (
    <>
      <Drawer
        open={open}
        onClose={toggleDrawer(false)}
        width={isMobile ? "100%" : "50%"}
      >
        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </Drawer>

      <strong
        style={{
          fontSize: "3em",
          textAlign: "center",
          backgroundColor: "teal",
          color: "white",
        }}
      >
        {currencyMap[segment]}
        {plan.discountPercent
          ? Math.ceil(
              (parseInt(plan[`${segment}Price`]) *
                (100 - parseInt(plan.discountPercent))) /
                100
            )
          : parseInt(plan[`${segment}Price`])}{" "}
        {plan.discountPercent ? (
          <Tooltip title={"Late adopter price, act now"}>
            <small
              style={{
                fontSize: "15px",
              }}
            >
              <del>
                ({currencyMap[segment]}
                {plan[`${segment}Price`]})
              </del>
            </small>
          </Tooltip>
        ) : null}
        <p
          style={{
            textAlign: "center",
            fontSize: "15px",
          }}
        >
          per month
        </p>
      </strong>
    </>
  );

  return (
    <Card style={{ width: "100%" }}>
      <Stack gap={1}>
        <Box>
          {capitalizeFirstLetter(plan.name)}{" "}
          {JSON.parse(
            localStorage.getItem("user")
          )?.plan?.name.toLowerCase() === plan.name && (
            <Tag color="green">Active</Tag>
          )}
        </Box>

        {pricePanel()}

        <List dense>
          {Object.entries(plan)
            ?.filter(([key]) => !dontShowKeys.includes(key))
            .map((entry) => (
              <ListItem key={JSON.stringify(entry)}>
                <ListItemText secondary={listItemPrimary(entry)} />
              </ListItem>
            ))}
        </List>

        {segment === "naira" ? (
          <PaystackButtonWrapper
            plan={plan}
            disableButton={disableButton}
            amount={amountNaira * 100}
          />
        ) : (
          <Popconfirm
            title={`Activate ${capitalizeFirstLetter(plan.name)} plan`}
            description="Are you sure you want to do this?"
            onConfirm={() => confirm(plan)}
            onCancel={() => null}
            icon={<InfoIcon color="success" style={{ marginRight: "5px" }} />}
            okText="Yes"
            cancelText="No"
          >
            <Button
              disabled={
                JSON.parse(
                  localStorage.getItem("user")
                )?.plan?.name.toLowerCase() === plan.name || disableButton
              }
            >
              Select Plan
            </Button>
          </Popconfirm>
        )}
      </Stack>
    </Card>
  );
};

const PaystackButtonWrapper = ({ amount, plan, disableButton }) => {
  const { currentUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const onSuccess = (referenceObj) => {
    const { reference, status } = referenceObj;

    if (status === "success") {
      navigate({
        pathname: "/result",
        search: `?${createSearchParams({
          reference,
        })}`,
      });
    }
  };

  // you can call this function anything
  const onClose = () => {
    console.log("closed");
  };

  const reference = new Date().getTime().toString();

  const config = {
    reference,
    email: currentUser.email,
    amount,
    publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
    metadata: {
      planName: plan.name,
    },
  };

  const componentProps = {
    ...config,
    text: "Paystack Button Implementation",
    onSuccess: (reference) => onSuccess(reference),
    onClose,
  };

  return (
    <PaystackConsumer {...componentProps}>
      {({ initializePayment }) => (
        <Popconfirm
          title={`Activate ${capitalizeFirstLetter(plan.name)} plan`}
          description="Are you sure you want to do this?"
          onConfirm={() => initializePayment(onSuccess, onClose)}
          onCancel={() => null}
          icon={<InfoIcon color="success" style={{ marginRight: "5px" }} />}
          okText="Yes"
          cancelText="No"
        >
          <Button
            disabled={
              JSON.parse(
                localStorage.getItem("user")
              )?.plan?.name.toLowerCase() === plan.name || disableButton
            }
          >
            Select Plan
          </Button>
        </Popconfirm>
      )}
    </PaystackConsumer>
  );
};

export default SettingsPlanCard;
