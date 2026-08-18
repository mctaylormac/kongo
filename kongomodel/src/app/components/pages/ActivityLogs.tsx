import { Activity, User, Calendar, Filter } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";

const activityLogs = [
  {
    id: 1,
    user: "Admin User",
    action: "Created new trip",
    details: "TRIP-4525: Kinshasa → Lubumbashi",
    timestamp: "2026-04-21 10:45:23",
    type: "create",
  },
  {
    id: 2,
    user: "Marie Kabongo",
    action: "Closed cash session",
    details: "SESS-4521 with 0 CDF discrepancy",
    timestamp: "2026-04-21 10:30:15",
    type: "update",
  },
  {
    id: 3,
    user: "Admin User",
    action: "Updated bus status",
    details: "KG-2453 marked for maintenance",
    timestamp: "2026-04-21 09:15:42",
    type: "update",
  },
  {
    id: 4,
    user: "Jean Mukadi",
    action: "Completed trip",
    details: "TRIP-4520: Kinshasa → Matadi",
    timestamp: "2026-04-21 08:45:10",
    type: "complete",
  },
  {
    id: 5,
    user: "Admin User",
    action: "Added new staff member",
    details: "Driver: Joseph Nkomo",
    timestamp: "2026-04-21 08:00:33",
    type: "create",
  },
  {
    id: 6,
    user: "Grace Lumbi",
    action: "Processed refund",
    details: "BKG-4524: 3,500 CDF refunded",
    timestamp: "2026-04-21 07:30:18",
    type: "refund",
  },
  {
    id: 7,
    user: "System",
    action: "Automatic backup",
    details: "Database backup completed successfully",
    timestamp: "2026-04-21 06:00:00",
    type: "system",
  },
  {
    id: 8,
    user: "Admin User",
    action: "Generated report",
    details: "Financial Summary for March 2026",
    timestamp: "2026-04-20 18:20:45",
    type: "export",
  },
];

const actionTypeConfig = {
  create: { color: "bg-[#34C759]/10 text-[#34C759]", label: "Create" },
  update: { color: "bg-[#007AFF]/10 text-[#007AFF]", label: "Update" },
  complete: { color: "bg-[#34C759]/10 text-[#34C759]", label: "Complete" },
  refund: { color: "bg-[#FF9500]/10 text-[#FF9500]", label: "Refund" },
  system: { color: "bg-[#86868B]/10 text-[#86868B]", label: "System" },
  export: { color: "bg-[#007AFF]/10 text-[#007AFF]", label: "Export" },
};

export function ActivityLogs() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Activity Logs</h1>
        <p className="text-[15px] text-[#86868B] mt-1">Track all system actions and changes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Today's Activities</p>
                <p className="text-[24px] font-semibold text-[#1D1D1F] mt-1">{activityLogs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-[#007AFF]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Active Users</p>
                <p className="text-[24px] font-semibold text-[#34C759] mt-1">
                  {new Set(activityLogs.filter((log) => log.user !== "System").map((log) => log.user)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-[#34C759]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">System Events</p>
                <p className="text-[24px] font-semibold text-[#86868B] mt-1">
                  {activityLogs.filter((log) => log.type === "system").length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-[#86868B]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">This Week</p>
                <p className="text-[24px] font-semibold text-[#1D1D1F] mt-1">247</p>
              </div>
              <Calendar className="w-8 h-8 text-[#FF9500]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <select className="flex-1 h-10 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10">
              <option>All Users</option>
              <option>Admin User</option>
              <option>Marie Kabongo</option>
              <option>Jean Mukadi</option>
              <option>System</option>
            </select>
            <select className="flex-1 h-10 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10">
              <option>All Actions</option>
              <option>Create</option>
              <option>Update</option>
              <option>Complete</option>
              <option>Refund</option>
              <option>Export</option>
            </select>
            <button className="h-10 px-4 bg-black/5 hover:bg-black/10 rounded-lg flex items-center gap-2 transition-all">
              <Filter className="w-4 h-4 text-[#86868B]" />
              <span className="text-[15px] text-[#1D1D1F] font-medium">Date Range</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Chronological list of all system actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-black/5">
            {activityLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-black/5 transition-colors">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#34C759] flex items-center justify-center flex-shrink-0">
                    {log.user === "System" ? (
                      <Activity className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[15px] font-semibold text-[#1D1D1F]">{log.user}</h4>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              actionTypeConfig[log.type].color
                            }`}
                          >
                            {actionTypeConfig[log.type].label}
                          </span>
                        </div>
                        <p className="text-[14px] text-[#1D1D1F]">{log.action}</p>
                        <p className="text-[13px] text-[#86868B] mt-0.5">{log.details}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[12px] text-[#86868B] font-mono">{log.timestamp}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">Export Activity Logs</h3>
              <p className="text-[13px] text-[#86868B] mt-1">Download logs for auditing and compliance</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="h-10 px-4 bg-[#1D1D1F] text-white rounded-lg hover:bg-[#2C2C2E] transition-all">
                Export as CSV
              </button>
              <button className="h-10 px-4 bg-black/5 text-[#1D1D1F] rounded-lg hover:bg-black/10 transition-all">
                Export as PDF
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
