import { User, Shield } from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";

export function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold text-[#1D1D1F] tracking-tight">Settings</h1>
        <p className="text-[15px] text-[#86868B] mt-1">Manage your account and system preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#007AFF]" />
            </div>
            <div>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Full Name</label>
              <input
                type="text"
                defaultValue="Admin User"
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Email</label>
              <input
                type="email"
                defaultValue="admin@kongo.cd"
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Phone</label>
              <input
                type="tel"
                defaultValue="+243 812 345 678"
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Role</label>
              <input
                type="text"
                defaultValue="Super Admin"
                disabled
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#86868B] cursor-not-allowed"
              />
            </div>
          </div>
          <button className="mt-6 h-11 px-6 bg-[#1D1D1F] text-white rounded-xl hover:bg-[#2C2C2E] transition-all">
            Save Changes
          </button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#FF3B30]" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Password and authentication settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1D1D1F] mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full h-11 px-4 bg-black/5 border-0 rounded-lg text-[15px] text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/5 rounded-xl">
              <div>
                <p className="text-[15px] font-medium text-[#1D1D1F]">Two-Factor Authentication</p>
                <p className="text-[13px] text-[#86868B] mt-0.5">Add an extra layer of security</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-[#86868B]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
              </label>
            </div>
          </div>
          <button className="mt-6 h-11 px-6 bg-[#1D1D1F] text-white rounded-xl hover:bg-[#2C2C2E] transition-all">
            Update Password
          </button>
        </CardContent>
      </Card>

    </div>
  );
}
