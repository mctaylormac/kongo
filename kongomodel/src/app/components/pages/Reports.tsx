import { FileText, Download, Calendar, TrendingUp } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";

const reportTypes = [
  {
    id: 1,
    name: "Financial Summary",
    description: "Revenue, expenses, and profit analysis",
    icon: TrendingUp,
    color: "#34C759",
    lastGenerated: "2026-04-20",
  },
  {
    id: 2,
    name: "Passenger Manifest",
    description: "Complete list of all bookings and passengers",
    icon: FileText,
    color: "#007AFF",
    lastGenerated: "2026-04-21",
  },
  {
    id: 3,
    name: "Trip Performance",
    description: "Occupancy rates and route analytics",
    icon: TrendingUp,
    color: "#FF9500",
    lastGenerated: "2026-04-19",
  },
  {
    id: 4,
    name: "Agency Report",
    description: "Per-agency performance and metrics",
    icon: FileText,
    color: "#FF3B30",
    lastGenerated: "2026-04-18",
  },
];

const recentReports = [
  {
    name: "Monthly_Financial_Report_March_2026.pdf",
    type: "Financial",
    size: "2.4 MB",
    date: "2026-04-01",
    downloadUrl: "#",
  },
  {
    name: "Passenger_Manifest_Week_15.xlsx",
    type: "Manifest",
    size: "856 KB",
    date: "2026-04-15",
    downloadUrl: "#",
  },
  {
    name: "Trip_Performance_Q1_2026.pdf",
    type: "Performance",
    size: "1.8 MB",
    date: "2026-04-10",
    downloadUrl: "#",
  },
];

export function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Reports & Exports</h1>
        <p className="text-[15px] text-[#86868B] mt-1">Generate and download business reports</p>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${report.color}15` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: report.color }} />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold text-[#1D1D1F]">{report.name}</h3>
                      <p className="text-[13px] text-[#86868B] mt-1">{report.description}</p>
                      <p className="text-[12px] text-[#86868B] mt-2">
                        Last generated: {report.lastGenerated}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex-1 h-10 px-4 bg-[#1D1D1F] text-white rounded-lg flex items-center justify-center gap-2 hover:bg-[#2C2C2E] transition-all">
                    <FileText className="w-4 h-4" />
                    <span className="text-[14px] font-medium">Generate PDF</span>
                  </button>
                  <button className="flex-1 h-10 px-4 bg-[#34C759]/10 text-[#34C759] rounded-lg flex items-center justify-center gap-2 hover:bg-[#34C759]/20 transition-all">
                    <Download className="w-4 h-4" />
                    <span className="text-[14px] font-medium">Export Excel</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Generator</CardTitle>
          <CardDescription>Create a customized report with specific parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Report Type</label>
              <select className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10">
                <option>Financial Summary</option>
                <option>Passenger Manifest</option>
                <option>Trip Performance</option>
                <option>Agency Report</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Format</label>
              <select className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10">
                <option>PDF</option>
                <option>Excel (XLSX)</option>
                <option>CSV</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Start Date</label>
              <input
                type="date"
                defaultValue="2026-04-01"
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">End Date</label>
              <input
                type="date"
                defaultValue="2026-04-21"
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10"
              />
            </div>
          </div>
          <button className="w-full h-11 mt-6 bg-[#1D1D1F] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-[#2C2C2E] transition-all">
            <FileText className="w-5 h-5" />
            <span className="text-[15px] font-medium">Generate Custom Report</span>
          </button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Downloads</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-black/5">
            {recentReports.map((report, index) => (
              <div key={index} className="px-6 py-4 hover:bg-black/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#007AFF]" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-[#1D1D1F]">{report.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[12px] text-[#86868B]">{report.type}</span>
                        <span className="text-[12px] text-[#86868B]">•</span>
                        <span className="text-[12px] text-[#86868B]">{report.size}</span>
                        <span className="text-[12px] text-[#86868B]">•</span>
                        <span className="text-[12px] text-[#86868B]">{report.date}</span>
                      </div>
                    </div>
                  </div>
                  <button className="h-10 px-4 bg-black/5 hover:bg-black/10 rounded-lg flex items-center gap-2 transition-all">
                    <Download className="w-4 h-4 text-[#1D1D1F]" />
                    <span className="text-[14px] font-medium text-[#1D1D1F]">Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
