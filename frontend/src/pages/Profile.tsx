import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Mail, Phone, BadgeCheck, Building2, Shield, Clock,
  Pencil, Save, X, LogOut
} from "lucide-react";

const adminDefault = {
  fullName: "Karoyl",
  email: "karoyl@gmail.com",
  phone: "+91 98765 43210",
  gender: "Male",
  employeeId: "EMP-2047",
  department: "Inventory & Operations",
  username: "karoyl",
  accountType: "Admin" as const,
  lastLogin: "20-03-2026 09:42 AM",
  accountStatus: "Active" as const,
  role: "Inventory Manager",
};

const warehouseDefault = {
  fullName: "Warehouse Operator",
  email: "warehouse@gmail.com",
  phone: "+91 98765 00000",
  gender: "Male",
  employeeId: "EMP-5082",
  department: "Warehouse Operations",
  username: "warehouse",
  accountType: "Warehouse" as const,
  lastLogin: "20-03-2026 10:00 AM",
  accountStatus: "Active" as const,
  role: "Warehouse Operator",
};

const formatDate = (dateStr: string) => {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}${match[4]}`;
  }
  return dateStr;
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-3 py-3">
    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-card-foreground break-all">{value}</p>
    </div>
  </div>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-xl border border-border shadow-sm p-5">
    <h3 className="font-semibold text-card-foreground mb-4">{title}</h3>
    {children}
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const userRole = sessionStorage.getItem("user_role") || "admin";
  const defaultUser = userRole === "warehouse" ? warehouseDefault : adminDefault;

  const [user, setUser] = useState(() => {
    const key = `user_profile_${userRole}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultUser;
      }
    }
    return defaultUser;
  });

  const [draft, setDraft] = useState(user);

  const startEdit = () => { setDraft(user); setEditing(true); };
  const cancelEdit = () => setEditing(false);
  
  const saveEdit = () => {
    setUser(draft);
    const key = `user_profile_${userRole}`;
    localStorage.setItem(key, JSON.stringify(draft));
    window.dispatchEvent(new Event("profileUpdate"));
    setEditing(false);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.dispatchEvent(new Event("profileUpdate"));
    navigate("/");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-[32px] font-bold text-foreground leading-[40px]">Profile</h1>
        <p className="text-muted-foreground text-sm">View and manage your personal information</p>
      </div>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col sm:flex-row items-center gap-5">
        <Avatar className="h-20 w-20 border-2 border-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
            {user.fullName.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left flex-1">
          <p className="text-xl font-bold text-card-foreground">{user.fullName}</p>
          <p className="text-sm text-muted-foreground">{user.role}</p>
          <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
            <Badge className="bg-primary/10 text-primary border-0">{user.accountType}</Badge>
            <Badge className="bg-success/15 text-success border-0">{user.accountStatus}</Badge>
          </div>
        </div>
        {!editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Profile
            </Button>
            {userRole === "warehouse" && (
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-3.5 w-3.5" /> Log out
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit}><Save className="mr-2 h-3.5 w-3.5" /> Save</Button>
            <Button variant="outline" size="sm" onClick={cancelEdit}><X className="mr-2 h-3.5 w-3.5" /> Cancel</Button>
          </div>
        )}
      </div>

      <div className={userRole === "warehouse" ? "max-w-2xl" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
        {/* Personal Info */}
        <SectionCard title="Personal Information">
          {editing ? (
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground">Full Name</label><Input value={draft.fullName} onChange={e => setDraft({ ...draft, fullName: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Email</label><Input value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Phone</label><Input value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></div>
              <div>
                <label className="text-xs text-muted-foreground">Gender</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, gender: "Male" })}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                      draft.gender === "Male"
                        ? "border-black bg-black text-white"
                        : "border-border bg-card text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, gender: "Female" })}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                      draft.gender === "Female"
                        ? "border-black bg-black text-white"
                        : "border-border bg-card text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
              <div><label className="text-xs text-muted-foreground">Department</label><Input value={draft.department} onChange={e => setDraft({ ...draft, department: e.target.value })} /></div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <InfoRow icon={User} label="Full Name" value={user.fullName} />
              <InfoRow icon={Mail} label="Email Address" value={user.email} />
              <InfoRow icon={Phone} label="Phone Number" value={user.phone} />
              <InfoRow icon={User} label="Gender" value={user.gender} />
              <InfoRow icon={BadgeCheck} label="Employee ID" value={user.employeeId} />
              <InfoRow icon={Building2} label="Department" value={user.department} />
            </div>
          )}
        </SectionCard>

        {userRole !== "warehouse" && (
          /* Account Details */
          <SectionCard title="Account Details">
            <div className="divide-y divide-border">
              <InfoRow icon={User} label="Username" value={user.username} />
              <InfoRow icon={Shield} label="Account Type" value={user.accountType} />
              <InfoRow icon={Clock} label="Last Login" value={formatDate(user.lastLogin)} />
              <InfoRow icon={BadgeCheck} label="Account Status" value={user.accountStatus} />
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default Profile;
