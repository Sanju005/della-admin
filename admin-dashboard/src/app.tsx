import { Suspense, lazy } from "react";
import { Navigate, RouterProvider, createBrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/auth-provider";
import { AdminShell } from "./components/admin-shell";
import { complaints, payments, providers, reviews, users, bookings } from "./data/mock-data";

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
        element: withSuspense((
          <ResourcePage
            title="Users"
            description="Customer, provider, and internal user management at a glance."
            rows={users}
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
              { key: "status", label: "Status" },
              { key: "city", label: "City" },
              { key: "joined", label: "Joined" },
            ]}
            statusKey="status"
            searchPlaceholder="Search users by name, email, or role..."
            stats={[
              { label: "Active users", value: "9,856", note: "76.7% of total users" },
              { label: "Internal admins", value: "48", note: "Operational and support staff" },
              { label: "Suspended", value: "844", note: "Accounts needing review" },
            ]}
          />
        )),
      },
      {
        path: "service-providers",
        element: withSuspense((
          <ResourcePage
            title="Service Providers"
            description="Provider health, approval state, and geographic coverage."
            rows={providers}
            columns={[
              { key: "id", label: "ID" },
              { key: "provider", label: "Provider" },
              { key: "service", label: "Service" },
              { key: "rating", label: "Rating" },
              { key: "status", label: "Status" },
              { key: "zone", label: "Zone" },
              { key: "verification", label: "Verification" },
            ]}
            statusKey="status"
            searchPlaceholder="Search providers, zones, or service types..."
            stats={[
              { label: "Approved", value: "2,105", note: "Visible in the marketplace" },
              { label: "Pending", value: "132", note: "Waiting for manual review" },
              { label: "Paused", value: "113", note: "Temporarily hidden or inactive" },
            ]}
          />
        )),
      },
      {
        path: "provider-approvals",
        element: withSuspense((
          <ResourcePage
            title="Provider Approvals"
            description="Pending provider and listing approval decisions."
            rows={providers.filter((provider) => provider.status !== "Approved")}
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
