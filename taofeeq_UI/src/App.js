import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import OutletWrapper from "./components/outletWrapper/OutletWrapper";
import Home from "./pages/home/Home";
import Profile from "./pages/profile/Profile";
import Search from "./pages/search/Search";
import Notifications from "./pages/notifications/Notifications";
import Settings from "./pages/settings/Settings";
import "./style.scss";
import { useContext } from "react";
import { AuthContext } from "./context/authContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Box } from "@mui/material";
import ForgotPassword from "./pages/forgotPassword/ForgotPassword";
import ResetPassword from "./pages/resetPassword/ResetPassword";
import WaliChat from "./pages/waliChat/WaliChat";
import ValidateAccount from "./pages/validateAccount/ValidateAccount";
import SettingsPlanResponse from "./components/settingsPlanResponse/SettingsPlanResponse";

function App() {
  const { currentUser } = useContext(AuthContext);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        onError: (error) => {
          // Handle the error globally
        },
      },
    },
  });

  const Layout = () => {
    return (
      <QueryClientProvider client={queryClient}>
        <Box
          sx={{
            height: "98vh",
            width: "98vw",
            backgroundColor: "#f0f2f5",

            display: "flex",
            flexDirection: "column",
            gap: "15px",
            margin: "5px 5px",
          }}
        >
          <Navbar />
          <OutletWrapper />
        </Box>
      </QueryClientProvider>
    );
  };

  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    return children;
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/profile/:id",
          element: <Profile />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/search",
          element: <Search />,
        },
        {
          path: "/notifications",
          element: <Notifications />,
        },
        {
          path: "/settings",
          element: <Settings />,
        },
        {
          path: "/result",
          element: <SettingsPlanResponse />,
        },
      ],
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/reset-password/:token",
      element: <ResetPassword />,
    },
    {
      path: "/validate/:token",
      element: <ValidateAccount />,
    },
    {
      path: "/wali-chat/:token",
      element: <WaliChat />,
    },
  ]);

  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
