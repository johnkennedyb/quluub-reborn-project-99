import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Tabs,
  Tab,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Users as UsersIcon,
  BarChart as BarChartIcon,
  Mail as MailIcon,
  Settings as SettingsIcon,
  Phone as PhoneIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  Favorite as HeartIcon,
  PersonAdd as UserCheckIcon,
  Menu as MenuIcon,
  Notifications as BellIcon
} from '@mui/icons-material';
import { makeRequest } from '../../axios';

const AdminDashboard = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Get admin user from localStorage
    const adminUserData = localStorage.getItem('adminUser');
    if (adminUserData) {
      setAdminUser(JSON.parse(adminUserData));
    }
    
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch admin stats
      const statsResponse = await makeRequest.get('/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setStats(statsResponse.data);

      // Fetch users
      const usersResponse = await makeRequest.get('/admin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setUsers(usersResponse.data);

      // Fetch calls
      const callsResponse = await makeRequest.get('/admin/calls', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setCalls(callsResponse.data);

    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  };

  const tabItems = [
    { label: 'Overview', icon: BarChartIcon },
    { label: 'Members', icon: UsersIcon },
    { label: 'Insights', icon: BarChartIcon },
    { label: 'Email', icon: MailIcon },
    { label: 'Notifications', icon: BellIcon },
    { label: 'Calls', icon: PhoneIcon },
    { label: 'Reported', icon: SettingsIcon },
    { label: 'Subscriptions', icon: CreditCardIcon },
    { label: 'Payments', icon: WalletIcon },
    { label: 'Matches', icon: HeartIcon },
    { label: 'Referrals', icon: UserCheckIcon }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={4}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {error.message || 'Failed to load admin dashboard'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  const TabNavigation = () => (
    <List>
      {tabItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <ListItem
            button
            key={index}
            selected={activeTab === index}
            onClick={() => {
              setActiveTab(index);
              setMobileMenuOpen(false);
            }}
          >
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        );
      })}
    </List>
  );

  const OverviewContent = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Members
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.totalMembers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    +{stats?.recentRegistrations || 0} this week
                  </Typography>
                </Box>
                <UsersIcon color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Inactive Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.inactiveUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats?.inactiveSixMonths || 0} inactive 6+ months
                  </Typography>
                </Box>
                <UsersIcon color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Premium Members
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.premiumMembers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats?.conversionRate || 0}% conversion rate
                  </Typography>
                </Box>
                <CreditCardIcon color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Messages Exchanged
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.messagesExchanged || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    +{stats?.messagesThisWeek || 0} this week
                  </Typography>
                </Box>
                <MailIcon color="action" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Inactive User Analysis" />
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">1 Month Inactive:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.inactiveUsers || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">3 Months Inactive:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.inactiveQuarter || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">6 Months Inactive:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.inactiveSixMonths || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">1 Year Inactive:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.inactiveYear || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Match Statistics" />
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Matches:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.totalMatches || 0}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Success Rate:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.successRate || 0}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Avg per User:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.avgMatchesPerUser || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Growth Metrics" />
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Growth Rate:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.growthRate || 0}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Churn Rate:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.churnRate || 0}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Engagement Rate:</Typography>
                <Typography variant="body2" fontWeight="bold">{stats?.engagementRate || 0}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setActiveTab(1)}
                sx={{ height: 80, flexDirection: 'column' }}
              >
                <UsersIcon sx={{ mb: 1 }} />
                <Typography variant="body2">Manage Members</Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setActiveTab(2)}
                sx={{ height: 80, flexDirection: 'column' }}
              >
                <BarChartIcon sx={{ mb: 1 }} />
                <Typography variant="body2">View Insights</Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setActiveTab(9)}
                sx={{ height: 80, flexDirection: 'column' }}
              >
                <HeartIcon sx={{ mb: 1 }} />
                <Typography variant="body2">Match Suggestions</Typography>
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <OverviewContent />;
      case 1:
        return (
          <Card>
            <CardHeader title="Member Management" />
            <CardContent>
              <Typography>Member management functionality will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardHeader title="Dashboard Insights" />
            <CardContent>
              <Typography>Dashboard insights will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card>
            <CardHeader title="Email Management" />
            <CardContent>
              <Typography>Email management functionality will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Card>
            <CardHeader title="Push Notifications" />
            <CardContent>
              <Typography>Push notification management will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 5:
        return (
          <Card>
            <CardHeader title="Video Call Management" />
            <CardContent>
              <Typography>Video call management functionality will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 6:
        return (
          <Card>
            <CardHeader title="Reported Profiles" />
            <CardContent>
              <Typography>Reported profiles management will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 7:
        return (
          <Card>
            <CardHeader title="Subscription Overview" />
            <CardContent>
              <Typography>Subscription overview will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 8:
        return (
          <Card>
            <CardHeader title="Payment History" />
            <CardContent>
              <Typography>Payment history will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 9:
        return (
          <Card>
            <CardHeader title="Suggested Matches" />
            <CardContent>
              <Typography>Suggested matches functionality will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      case 10:
        return (
          <Card>
            <CardHeader title="Referral Analysis" />
            <CardContent>
              <Typography>Referral analysis will be implemented here.</Typography>
            </CardContent>
          </Card>
        );
      default:
        return <OverviewContent />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" py={2}>
            <Box display="flex" alignItems="center" gap={2}>
              {isMobile && (
                <IconButton onClick={() => setMobileMenuOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Box>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  Admin Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Welcome back, {adminUser?.fname} {adminUser?.lname}
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" onClick={adminLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{ display: { md: 'none' } }}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <Typography variant="h6" sx={{ px: 2, mb: 2 }}>
            Admin Menu
          </Typography>
          <TabNavigation />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, md: 4 } }}>
        {/* Desktop Navigation */}
        {!isMobile && (
          <Paper elevation={1} sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {tabItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Tab
                    key={index}
                    icon={<Icon />}
                    label={item.label}
                    iconPosition="start"
                    sx={{ minHeight: 64 }}
                  />
                );
              })}
            </Tabs>
          </Paper>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default AdminDashboard;
