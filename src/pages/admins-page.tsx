import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ResourcePage } from "./resource-page";
import { buildInternalUserStats, listInternalUsersWithFallback } from "../lib/admin-users";
import type { UserRow } from "../types";

export function AdminsPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAdmins() {
      setLoading(true);
      const nextRows = await listInternalUsersWithFallback();

      if (!active) {
        return;
      }

      setRows(nextRows);
      setLoading(false);
    }

    void loadAdmins();

    return () => {
      active = false;
    };
  }, []);

  if (loading && rows.length === 0) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <ResourcePage
      title="Admins"
      description="Admin, manager, and customer service accounts from the live Supabase workspace."
      rows={rows}
      columns={[
        {
          key: "id",
          label: "ID",
          render: (row) => (
            <Link
              to={`/admins/${row.id}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {String(row.id)}
            </Link>
          ),
        },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status" },
        { key: "city", label: "City" },
        { key: "joined", label: "Joined" },
      ]}
      statusKey="status"
      searchPlaceholder="Search admins by name, email, or role..."
      stats={buildInternalUserStats(rows)}
    />
  );
}
