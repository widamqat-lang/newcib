import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { RegistrationProvider } from '@/context/RegistrationContext';
import { RealtimeProvider, useRealtime } from '@/context/RealtimeContext';
import Home from '@/pages/Home';
import Watches from '@/pages/Watches';
import Signup from '@/pages/Signup';
import CreateAccount from '@/pages/CreateAccount';
import Verify from '@/pages/Verify';
import PendingApproval from '@/pages/PendingApproval';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const REDIRECT_TARGET_PATH: Record<string, string> = {
  home: '/',
  signup: '/signup',
  create_account: '/create-account',
  verify: '/verify',
  pending_approval: '/pending-approval',
  rejected: '/create-account?rejected=true',
};

// Listens for redirect commands pushed from the admin panel and navigates
// this customer's browser accordingly, in real time.
function RedirectListener() {
  const [, setLocation] = useLocation();
  const { redirectTarget, clearRedirect } = useRealtime();

  useEffect(() => {
    if (!redirectTarget) return;
    const path = REDIRECT_TARGET_PATH[redirectTarget];
    if (path) setLocation(path);
    clearRedirect();
  }, [redirectTarget, setLocation, clearRedirect]);

  return null;
}

function CustomerApp() {
  return (
    <RegistrationProvider>
      <RealtimeProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/watches" component={Watches} />
          <Route path="/signup" component={Signup} />
          <Route path="/create-account" component={CreateAccount} />
          <Route path="/verify" component={Verify} />
          <Route path="/pending-approval" component={PendingApproval} />
          <Route component={NotFound} />
        </Switch>
        <RedirectListener />
      </RealtimeProvider>
    </RegistrationProvider>
  );
}

function AppRoutes() {
  const [location] = useLocation();
  if (location === '/admin' || location.startsWith('/admin/')) {
    return <Admin />;
  }
  return <CustomerApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppRoutes />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
