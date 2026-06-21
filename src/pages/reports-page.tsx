import { useEffect, useState } from "react";
import { ResourcePage } from "./resource-page";
import { buildReportStats, listReportsWithFallback } from "../lib/admin-reports";
import type { ComplaintRow } from "../types";

export function ReportsPage() {
  const [rows, setRows] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      const nextRows = await listReportsWithFallback();

      if (!active) {
        return;
      }

      setRows(nextRows);
      setLoading(false);
    }

    void loadReports();

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
      title="Reports"
      description="Customer and provider issues submitted from the live product."
      rows={rows}
      columns={[
        { key: "ticket", label: "Ticket" },
        { key: "subject", label: "Subject" },
        { key: "customer", label: "Reporter" },
        { key: "owner", label: "Against / Scope" },
        { key: "status", label: "Status" },
        { key: "priority", label: "Priority" },
        { key: "updated", label: "Updated" },
      ]}
      statusKey="status"
      searchPlaceholder="Search reports, reporters, or ticket IDs..."
      stats={buildReportStats(rows)}
    />
  );
}
