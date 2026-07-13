import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ResourcePage } from "./resource-page";
import { buildProviderStats, listProvidersWithFallback } from "../lib/admin-providers";
import type { ProviderRow } from "../types";

export function ProvidersPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProviders() {
      setLoading(true);
      const nextRows = await listProvidersWithFallback();

      if (!active) {
        return;
      }

      setRows(nextRows);
      setLoading(false);
    }

    void loadProviders();

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
      title="Service Providers"
      description="Provider health, approval state, and geographic coverage."
      rows={rows}
      columns={[
        {
          key: "id",
          label: "ID",
          render: (row) => (
            <Link
              to={`/service-providers/${row.id}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {String(row.id)}
            </Link>
          ),
        },
        { key: "provider", label: "Provider" },
        { key: "service", label: "Service" },
        { key: "rating", label: "Rating" },
        { key: "status", label: "Status" },
        { key: "zone", label: "Zone" },
        { key: "verification", label: "Verification" },
      ]}
      action={
        <button
          type="button"
          onClick={() => navigate("/service-providers/create")}
          className="inline-flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          Create Provider
        </button>
      }
      statusKey="status"
      searchPlaceholder="Search providers, zones, or service types..."
      stats={buildProviderStats(rows)}
    />
  );
}
