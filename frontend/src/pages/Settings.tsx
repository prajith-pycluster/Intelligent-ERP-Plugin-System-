import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, KeyRound, Clock, Monitor, Mail, BellRing, LogIn } from "lucide-react";

const loginActivity = [
  { date: "Mar 20, 2026 — 09:42 AM", device: "Chrome · Windows" },
  { date: "Mar 19, 2026 — 02:15 PM", device: "Safari · macOS" },
  { date: "Mar 18, 2026 — 08:30 AM", device: "Chrome · Windows" },
];

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-xl border border-border shadow-sm p-5">
    <h3 className="font-semibold text-card-foreground mb-4">{title}</h3>
    {children}
  </div>
);

const Settings = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground text-sm">Manage security and application preferences</p>
      </div>

      <SectionCard title="Security">
        <div className="space-y-4">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <KeyRound className="mr-2 h-4 w-4" /> Change Password
          </Button>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-card-foreground">Two-Factor Authentication</span>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium text-card-foreground mb-2 flex items-center gap-2">
              <LogIn className="h-4 w-4 text-muted-foreground" /> Recent Login Activity
            </p>
            <div className="space-y-2">
              {loginActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">{a.date}</span>
                  <span className="text-card-foreground font-medium">{a.device}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Preferences">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-card-foreground">Dark Mode</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-card-foreground">Email Notifications</span>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-card-foreground">System Alerts</span>
            </div>
            <Switch checked={systemAlerts} onCheckedChange={setSystemAlerts} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default Settings;
