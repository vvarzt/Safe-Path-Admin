import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Check if user ID matches the specific admin user
      if (user.uid !== 'hVsm6odkp8NM9cbezIM7R6uSmn52') {
        throw new Error("Access denied: Not an admin user");
      }

      // Store user info in localStorage
      localStorage.setItem("auth_token", await user.getIdToken());
      localStorage.setItem("auth_uid", user.uid);
      localStorage.setItem("auth_email", user.email!);
      localStorage.setItem("auth_role", "admin");

      toast({ title: "Login successful", description: "Welcome to Admin Panel" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.message || "Invalid email or password",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(var(--sidebar-background)/0.12)] via-background to-[hsl(var(--accent)/0.10)]" />
      <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-[hsl(var(--sidebar-background)/0.16)] blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--accent)/0.22)] blur-3xl animate-[pulse_7s_ease-in-out_infinite]" />

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="grid w-full gap-8 md:grid-cols-2 items-center">
          <div className="hidden md:flex flex-col items-start gap-6 p-6">
            <img src="/brand/safe-path-logo.svg" alt="Safe Path" className="h-12 w-12" />
            <div className="text-4xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--sidebar-background))] to-[hsl(var(--accent))]">
              Safe Path
            </div>
            <p className="text-muted-foreground max-w-sm">
              {t("pages.login.description")}
            </p>
            <div className="mt-2 h-px w-24 bg-[hsl(var(--sidebar-background))]" />
          </div>

          <div className="p-2">
            <Card className="w-full backdrop-blur supports-[backdrop-filter]:bg-white/80 border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <CardHeader className="space-y-1 text-center md:text-left">
                <div className="md:hidden flex justify-center mb-2">
                  <img src="/brand/safe-path-logo.svg" alt="Safe Path" className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold">{t("pages.login.title")}</CardTitle>
                <CardDescription>
                  {t("pages.login.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("pages.login.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("pages.login.placeholderEmail")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("pages.login.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        placeholder={t("pages.login.placeholderPassword")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-9 pr-9"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                        aria-label={showPw ? "Hide password" : "Show password"}
                        onClick={() => setShowPw((v) => !v)}
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(var(--sidebar-background))] hover:bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
                    {t("actions.signIn")}
                  </Button>
                </form>
                <div className="mt-6 text-center text-xs text-muted-foreground">
                  © {new Date().getFullYear()} Safe Path
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
