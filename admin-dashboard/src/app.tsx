import { Suspense, lazy } from "react";
import { Navigate, RouterProvider, createBrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/auth-provider";
import { AdminShell } from "./components/admin-shell";
import { complaints, payments, providers as mockProviders, reviews, bookings } from "./data/mock-data";

const DashboardPage = lazy(async () => {
  const module = await import("./pages/dashboard-page");
  return { default: module.DashboardPage };
});

const ForgotPasswordPage = lazy(async () => {
  const module = await import("./pages/forgot-password-page");
  return { default: module.ForgotPasswordPage };
});

const LoginPage = lazy(async () => {
  const module = await import("./pages/login-page");
  return { default: module.LoginPage };
});

const ResetPasswordPage = lazy(async () => {
  const module = await import("./pages/reset-password-page");
  return { default: module.ResetPasswordPage };
});

const ResourcePage = lazy(async () => {
  const module = await import("./pages/resource-page");
  return { default: module.ResourcePage };
});

const SettingsPage = lazy(async () => {
  const module = await import("./pages/settings-page");
  return { default: module.SettingsPage };
});

const UserProfilePage = lazy(async () => {
  const module = await import("./pages/user-profile-page");
  return { default: module.UserProfilePage };
});

const ProviderProfilePage = lazy(async () => {
  const module = await import("./pages/provider-profile-page");
  return { default: module.ProviderProfilePage };
});

const ProvidersPage = lazy(async () => {
  const module = await import("./pages/providers-page");
  return { default: module.ProvidersPage };
});

const UsersPage = lazy(async () => {
  const module = await import("./pages/users-page");
  return { default: module.UsersPage };
});

function RouteLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="h-10 w-10 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { initialized, session } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/blocked",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/blokced",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/forgot-password",
    element: withSuspense(<ForgotPasswordPage />),
  },
  {
    path: "/reset-password",
    element: withSuspense(<ResetPasswordPage />),
  },
  {
    path: "/",
    element: (
        <ProtectedRoute>
          <AdminShell />
        </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(<DashboardPage />),
      },
      {
        path: "users",
        element: withSuspense(<UsersPage />),
      },
      {
        path: "users/:userId",
        element: withSuspense(<UserProfilePage />),
      },
      {
        path: "service-providers",
        element: withSuspense(<ProvidersPage />),
      },
      {
        path: "service-providers/:providerId",
        element: withSuspense(<ProviderProfilePage />),
      },
      {
        path: "provider-approvals",
        element: withSuspense((
          <ResourcePage
            title="Provider Approvals"
            description="Pending provider and listing approval decisions."
            rows={mockProviders.filter((provider) => provider.status !== "Approved")}
            columns={[
              { key: "id", label: "ID" },
              { key: "provider", label: "Provider" },
              { key: "service", label: "Service" },
              { key: "status", label: "Status" },
              { key: "zone", label: "Zone" },
              { key: "verification", label: "Verification" },
            ]}
            statusKey="status"
            searchPlaceholder="Search pending approvals..."
            stats={[
              { label: "Profiles", value: "12", note: "Profiles waiting for initial ops review" },
              { label: "Documents", value: "8", note: "KYC and compliance checks" },
              { label: "Listings", value: "5", note: "Marketplace visibility approvals" },
            ]}
          />
        )),
      },
      {
        path: "tasks-bookings",
        element: withSuspense((
          <ResourcePage
            title="Tasks / Bookings"
            description="Real-time service operations and fulfilment pipeline."
            rows={bookings}
            columns={[
              { key: "id", label: "ID" },
              { key: "service", label: "Service" },
              { key: "provider", label: "Provider" },
              { key: "customer", label: "Customer" },
              { key: "status", label: "Status" },
              { key: "amount", label: "Amount" },
              { key: "schedule", label: "Date & Time" },
            ]}
            statusKey="status"
            searchPlaceholder="Search bookings, customers, or providers..."
            stats={[
              { label: "Open tasks", value: "1,245", note: "Pending, accepted, and in progress" },
              { label: "Completed today", value: "235", note: "Freshly settled jobs" },
              { label: "Cancelled", value: "83", note: "Needs quality follow-up" },
            ]}
          />
        )),
      },
      {
        path: "payments",
        element: withSuspense((
          <ResourcePage
            title="Payments"
            description="Customer collections, settlement state, and refund monitoring."
            rows={payments}
            columns={[
              { key: "id", label: "ID" },
              { key: "customer", label: "Customer" },
              { key: "provider", label: "Provider" },
              { key: "amount", label: "Amount" },
              { key: "method", label: "Method" },
              { key: "status", label: "Status" },
              { key: "date", label: "Date" },
            ]}
            statusKey="status"
            searchPlaceholder="Search payments, customers, or methods..."
            stats={[
              { label: "Total volume", value: "RM256,890", note: "Month-to-date collections" },
              { label: "Pending", value: "RM18,760", note: "Awaiting settlement or capture" },
              { label: "Refunds", value: "RM7,340", note: "Requires finance review where needed" },
            ]}
          />
        )),
      },
      {
        path: "reviews",
        element: withSuspense((
          <ResourcePage
            title="Reviews"
            description="Moderation and quality signals from marketplace feedback."
            rows={reviews}
            columns={[
              { key: "id", label: "ID" },
              { key: "customer", label: "Customer" },
              { key: "provider", label: "Provider" },
              { key: "rating", label: "Rating" },
              { key: "comment", label: "Comment" },
              { key: "status", label: "Status" },
              { key: "date", label: "Date" },
            ]}
            statusKey="status"
            searchPlaceholder="Search reviews, comments, or providers..."
            stats={[
              { label: "Published", value: "8,432", note: "Visible marketplace reviews" },
              { label: "Flagged", value: "17", note: "Awaiting moderation" },
              { label: "Average rating", value: "4.82", note: "Rolling 30-day platform score" },
            ]}
          />
        )),
      },
      {
        path: "complaints",
        element: withSuspense((
          <ResourcePage
            title="Complaints"
            description="Trust, support, and service recovery queue."
            rows={complaints}
            columns={[
              { key: "ticket", label: "Ticket" },
              { key: "subject", label: "Subject" },
              { key: "customer", label: "Customer" },
              { key: "owner", label: "Owner" },
              { key: "status", label: "Status" },
              { key: "priority", label: "Priority" },
              { key: "updated", label: "Updated" },
            ]}
            statusKey="status"
            searchPlaceholder="Search complaints, owners, or ticket IDs..."
            stats={[
              { label: "Open", value: "19", note: "Cases needing immediate attention" },
              { label: "Escalated", value: "4", note: "High-risk incidents" },
              { label: "Resolved", value: "143", note: "Closed this month" },
            ]}
          />
        )),
      },
      {
        path: "settings",
        element: withSuspense(<SettingsPage />),
      },
    ],
  },
]);

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
