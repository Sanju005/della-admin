import { LoaderCircle } from "lucide-react";
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

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#f8fff9_0%,#eef8f0_50%,#f8fafc_100%)] px-6 text-center">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[linear-gradient(135deg,#0f8b3d,#7c3aed)] text-white shadow-[0_20px_60px_rgba(15,139,61,0.25)]">
          <LoaderCircle className="size-7 animate-spin" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-slate-950">
          Preparing DELLA Admin
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Verifying your session.
        </p>
      </div>
    </div>
  );
}

function RouteLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-[linear-gradient(135deg,#0f8b3d,#7c3aed)] text-white shadow-[0_20px_60px_rgba(15,139,61,0.25)]">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { access, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (access === "guest") {
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
