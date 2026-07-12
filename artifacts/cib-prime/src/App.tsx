import { useEffect, useState } from 'react';
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
import AdminContent from '@/pages/AdminContent';
import AdminSecurity from '@/pages/AdminSecurity';
import AdminVisitors from '@/pages/AdminVisitors';
import NotFound from '@/pages/not-found';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

const REDIRECT_TARGET_PATH: Record<string, string> = {
  home: '/',
  signup: '/signup',
  create_account: '/create-account',
  verify: '/verify',
  pending_approval: '/pending-approval',
  rejected: '/create-account?rejected=true',
};

// Verify token from server
async function verifyToken(): Promise<boolean> {
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) return false;
    
    const response = await fetch('/api/admin/auth/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.authenticated === true;
    }
    return false;
  } catch {
    return false;
  }
}

// Loading screen - hides content until auth is verified
function LoadingScreen() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-100"
      style={{ visibility: 'hidden' }} // Hide by default until mounted
    >
      <Loader2 className="w-8 h-8 animate-spin text-[#0a4fa3]" />
    </div>
  );
}

// Protected admin route wrapper
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('admin_logged_in');
      if (loggedIn !== 'true') {
        setIsVerified(false);
        return;
      }
      
      const isValid = await verifyToken();
      if (!isValid) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        setIsVerified(false);
      } else {
        setIsVerified(true);
      }
    };
    
    checkAuth();
  }, []);

  // Still checking
  if (isVerified === null) {
    return <LoadingScreen />;
  }

  // Not authenticated - redirect to login
  if (!isVerified) {
    setTimeout(() => {
      setLocation('/admin');
    }, 100);
    return <LoadingScreen />;
  }

  // Authenticated - show content
  return <>{children}</>;
}

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
          <Route path="/admin" component={Admin} />
          <Route path="/admin/content" component={AdminContent} />
          <Route path="/admin/security" component={AdminSecurity} />
          <Route path="/admin/visitors" component={AdminVisitors} />
          <Route component={NotFound} />
        </Switch>
        <RedirectListener />
      </RealtimeProvider>
    </RegistrationProvider>
  );
}

function AppRoutes() {
  const [location] = useLocation();
  if (location.startsWith('/admin')) {
    if (location === '/admin' || location === '/admin/') {
      return <Admin />;
    }
    // All other admin routes are protected
    return (
      <ProtectedAdminRoute>
        <AdminLayout />
      </ProtectedAdminRoute>
    );
  }
  return <CustomerApp />;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  if (location === '/admin' || location === '/admin/') {
    return <Admin />;
  }
  if (location.startsWith('/admin/content')) {
    return <AdminContent />;
  }
  if (location.startsWith('/admin/security')) {
    return <AdminSecurity />;
  }
  if (location.startsWith('/admin/visitors')) {
    return <AdminVisitors />;
  }
  return <Admin />;
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
