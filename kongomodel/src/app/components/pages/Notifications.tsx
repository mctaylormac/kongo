import { Bell, AlertTriangle, Info, CheckCircle, Clock } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";

const notifications = [
  {
    id: 1,
    type: "alert",
    title: "Bus KG-1827 delayed by 30 minutes",
    message: "Heavy traffic reported on Kinshasa-Matadi route",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "New booking received",
    message: "45 bookings confirmed for tomorrow's departures",
    time: "12 minutes ago",
    read: false,
  },
  {
    id: 3,
    type: "success",
    title: "Cash session closed successfully",
    message: "Marie Kabongo completed session with zero discrepancy",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 4,
    type: "warning",
    title: "Bus KG-2453 requires maintenance",
    message: "Scheduled maintenance due in 3 days",
    time: "2 hours ago",
    read: true,
  },
  {
    id: 5,
    type: "info",
    title: "Payment received",
    message: "Transaction TRX-2451: 12,500 CDF via Mobile Money",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 6,
    type: "success",
    title: "Trip completed successfully",
    message: "Bus KG-3427 arrived at destination on time",
    time: "5 hours ago",
    read: true,
  },
  {
    id: 7,
    type: "alert",
    title: "Weather alert",
    message: "Heavy rain expected on Goma-Bukavu route tomorrow",
    time: "6 hours ago",
    read: true,
  },
];

const notificationConfig = {
  alert: { icon: AlertTriangle, color: "#FF3B30", bg: "bg-[#FF3B30]/10" },
  warning: { icon: Clock, color: "#FF9500", bg: "bg-[#FF9500]/10" },
  info: { icon: Info, color: "#007AFF", bg: "bg-[#007AFF]/10" },
  success: { icon: CheckCircle, color: "#34C759", bg: "bg-[#34C759]/10" },
};

export function Notifications() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Notifications</h1>
          <p className="text-[15px] text-[#86868B] mt-1">
            System alerts and important updates
          </p>
        </div>
        <button className="h-10 px-4 bg-black/5 hover:bg-black/10 rounded-lg text-[14px] font-medium text-[#1D1D1F] transition-all">
          Mark all as read
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Unread</p>
                <p className="text-[24px] font-semibold text-[#FF3B30] mt-1">{unreadCount}</p>
              </div>
              <Bell className="w-8 h-8 text-[#FF3B30]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Alerts</p>
                <p className="text-[24px] font-semibold text-[#FF9500] mt-1">
                  {notifications.filter((n) => n.type === "alert").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-[#FF9500]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Info</p>
                <p className="text-[24px] font-semibold text-[#007AFF] mt-1">
                  {notifications.filter((n) => n.type === "info").length}
                </p>
              </div>
              <Info className="w-8 h-8 text-[#007AFF]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-[#86868B]">Total Today</p>
                <p className="text-[24px] font-semibold text-[#1D1D1F] mt-1">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-[#86868B]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Recent system events and alerts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-black/5">
            {notifications.map((notification) => {
              const config = notificationConfig[notification.type];
              const Icon = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-black/5 transition-colors ${
                    !notification.read ? "bg-[#007AFF]/5" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-semibold text-[#1D1D1F]">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-[#007AFF]"></span>
                            )}
                          </div>
                          <p className="text-[13px] text-[#86868B] mt-1">{notification.message}</p>
                          <p className="text-[12px] text-[#86868B] mt-2">{notification.time}</p>
                        </div>
                        <button className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-lg text-[12px] font-medium text-[#1D1D1F] transition-all">
                          {notification.read ? "Unread" : "Mark read"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure which alerts you want to receive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Trip Delays & Incidents", description: "Get notified when buses are delayed or incidents occur" },
              { label: "New Bookings", description: "Receive alerts for new reservations" },
              { label: "Cash Discrepancies", description: "Alert when cashier sessions have discrepancies" },
              { label: "Maintenance Reminders", description: "Get reminded about upcoming bus maintenance" },
              { label: "Financial Thresholds", description: "Alert when revenue or spending crosses thresholds" },
            ].map((setting, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-black/5 rounded-xl">
                <div>
                  <p className="text-[15px] font-medium text-[#1D1D1F]">{setting.label}</p>
                  <p className="text-[13px] text-[#86868B] mt-0.5">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-[#86868B]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
