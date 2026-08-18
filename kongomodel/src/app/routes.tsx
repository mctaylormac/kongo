import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { DashboardOverview } from "./components/pages/DashboardOverview";
import { Agencies } from "./components/pages/Agencies";
import { Users } from "./components/pages/Users";
import { Buses } from "./components/pages/Buses";
import { Trips } from "./components/pages/Trips";
import { StopsRoutes } from "./components/pages/StopsRoutes";
import { LiveMap } from "./components/pages/LiveMap";
import { Finance } from "./components/pages/Finance";
import { CashManagement } from "./components/pages/CashManagement";
import { Staff } from "./components/pages/Staff";
import { Reports } from "./components/pages/Reports";
import { Notifications } from "./components/pages/Notifications";
import { Settings } from "./components/pages/Settings";
import { Bookings } from "./components/pages/Bookings";
import { ActivityLogs } from "./components/pages/ActivityLogs";
import { NewBooking } from "./components/pages/NewBooking";
import { Login } from "./components/pages/Login";
import { ExtraServices } from "./components/pages/ExtraServices";
import { AgencyManagement } from "./components/pages/AgencyManagement";
import { Incidents } from "./components/pages/Incidents";
import { Scanner } from "./components/pages/Scanner";
import { SuperuserChat } from "./components/pages/SuperuserChat";
import { AgencyChat } from "./components/pages/AgencyChat";
import { LocationsPayments } from "./components/pages/LocationsPayments";
import { RoleGuard } from "./components/RoleGuard";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardOverview },
      { 
        path: "agencies", 
        element: <RoleGuard allowedRoles={["superuser", "agency"]}><Agencies /></RoleGuard> 
      },
      { 
        path: "agency-management", 
        element: <RoleGuard allowedRoles={["superuser"]}><AgencyManagement /></RoleGuard> 
      },
      { 
        path: "users", 
        element: <RoleGuard allowedRoles={["superuser"]}><Users /></RoleGuard> 
      },
      { 
        path: "buses", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "chef", "cashier"]}><Buses /></RoleGuard> 
      },
      { 
        path: "trips", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "chef", "cashier"]}><Trips /></RoleGuard> 
      },
      { 
        path: "stops-routes", 
        element: <RoleGuard allowedRoles={["superuser", "agency"]}><StopsRoutes /></RoleGuard> 
      },
      { 
        path: "live-map", 
        element: <RoleGuard allowedRoles={["superuser", "agency"]}><LiveMap /></RoleGuard> 
      },
      { 
        path: "finance", 
        element: <RoleGuard allowedRoles={["superuser", "agency"]}><Finance /></RoleGuard> 
      },
      { 
        path: "cash-management", 
        element: <RoleGuard allowedRoles={["superuser", "agency"]}><CashManagement /></RoleGuard> 
      },
      { 
        path: "staff", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "chef"]}><Staff /></RoleGuard> 
      },
      { 
        path: "bookings", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "cashier"]}><Bookings /></RoleGuard> 
      },
      { 
        path: "new-booking", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "cashier"]}><NewBooking /></RoleGuard> 
      },
      { 
        path: "reports", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "chef"]}><Reports /></RoleGuard> 
      },
      { path: "notifications", Component: Notifications },
      { 
        path: "activity-logs", 
        element: <RoleGuard allowedRoles={["superuser"]}><ActivityLogs /></RoleGuard> 
      },
      { path: "settings", Component: Settings },
      { 
        path: "extra-services", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "cashier"]}><ExtraServices /></RoleGuard> 
      },
      { 
        path: "incidents", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "chef"]}><Incidents /></RoleGuard> 
      },
      { 
        path: "scanner", 
        element: <RoleGuard allowedRoles={["superuser", "agency", "chef", "cashier"]}><Scanner /></RoleGuard> 
      },
      { 
        path: "chat", 
        element: <RoleGuard allowedRoles={["superuser"]}><SuperuserChat /></RoleGuard> 
      },
      { 
        path: "agency-chat", 
        element: <RoleGuard allowedRoles={["agency", "chef", "cashier"]}><AgencyChat /></RoleGuard> 
      },
      { 
        path: "locations-payments", 
        element: <RoleGuard allowedRoles={["superuser"]}><LocationsPayments /></RoleGuard> 
      },
    ],
  },
]);
