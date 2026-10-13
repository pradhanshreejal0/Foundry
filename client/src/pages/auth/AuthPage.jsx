import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Eye, EyeOff, Store, User, LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") || "login";
  const [mode, setMode] = useState(initialMode);
  const [isFlipping, setIsFlipping] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "customer",
    storeName: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFlip = (newMode) => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setMode(newMode);
      setIsFlipping(false);
    }, 600);
  };

  // Login handlers
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: loginData,
      });

      login(data.user, data.accessToken);

      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "vendor") navigate("/vendor");
      else navigate("/");
    } catch (err) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  // Register handlers
  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }

    if (registerData.role === "vendor" && !registerData.storeName.trim()) {
      setRegisterError("Store name is required for vendor registration");
      return;
    }

    setRegisterLoading(true);

    try {
      const payload = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
        role: registerData.role,
      };

      if (registerData.role === "vendor") {
        payload.storeName = registerData.storeName.trim();
      }

      const data = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      login(data.user, data.accessToken);

      if (data.user.role === "vendor") {
        navigate("/vendor");
      } else {
        navigate("/");
      }
    } catch (err) {
      setRegisterError(err.message || "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  const isVendor = registerData.role === "vendor";

  return (
    <div className="auth-container flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/20 via-background to-background px-4 py-10">
      <div className="relative w-full max-w-md">
        {/* Coin Flip Container */}
        <div className="relative h-auto min-h-96">
          {/* Login Form */}
          <div
            className={`transition-all duration-600 ${
              mode === "login"
                ? isFlipping
                  ? "coin-flip-exit-left"
                  : "coin-flip-enter-left"
                : "absolute inset-0 opacity-0 pointer-events-none"
            }`}
          >
            {mode === "login" && (
              <Card className="shadow-2xl border-border/40 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
                      <LogIn className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
                  </div>
                  <CardDescription>Sign in to your account to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => navigate("/forgot-password")}
                          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          name="password"
                          type={showLoginPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {loginError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginLoading}
                      size="lg"
                    >
                      {loginLoading ? "Logging in..." : "Sign In"}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        New here?
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleFlip("register")}
                    disabled={isFlipping}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Register Form */}
          <div
            className={`transition-all duration-600 ${
              mode === "register"
                ? isFlipping
                  ? "coin-flip-exit-right"
                  : "coin-flip-enter-right"
                : "absolute inset-0 opacity-0 pointer-events-none"
            }`}
          >
            {mode === "register" && (
              <Card className="shadow-2xl border-border/40 backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-2xl tracking-tight">Create account</CardTitle>
                  </div>
                  <CardDescription>
                    Shop as a customer or open a store to sell.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {/* Role pills */}
                    <div className="space-y-2">
                      <Label>I want to</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setRegisterData({ ...registerData, role: "customer" })
                          }
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition ${
                            !isVendor
                              ? "border-primary bg-primary/10 text-foreground shadow-sm"
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <User className="h-5 w-5" />
                          <span className="font-medium">Buy</span>
                          <span className="text-xs opacity-80">Customer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRegisterData({ ...registerData, role: "vendor" })
                          }
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition ${
                            isVendor
                              ? "border-primary bg-primary/10 text-foreground shadow-sm"
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Store className="h-5 w-5" />
                          <span className="font-medium">Sell</span>
                          <span className="text-xs opacity-80">Vendor</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        autoComplete="name"
                        value={registerData.name}
                        onChange={handleRegisterChange}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        placeholder="you@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        required
                        inputMode="tel"
                        placeholder="97798XXXXXXXX"
                        value={registerData.phone}
                        onChange={handleRegisterChange}
                      />
                    </div>

                    {isVendor && (
                      <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input
                          id="storeName"
                          name="storeName"
                          required
                          placeholder="Your shop or brand name"
                          value={registerData.storeName}
                          onChange={handleRegisterChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your store is reviewed by an admin before you can sell.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          name="password"
                          type={showRegisterPassword ? "text" : "password"}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                          aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showRegisterConfirmPassword ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterConfirmPassword((prev) => !prev)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                          aria-label={
                            showRegisterConfirmPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showRegisterConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {registerError && (
                      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {registerError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerLoading}
                      size="lg"
                    >
                      {registerLoading
                        ? "Creating account..."
                        : isVendor
                          ? "Register as Vendor"
                          : "Create Account"}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Already have an account?
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleFlip("login")}
                    disabled={isFlipping}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Coin Indicator */}
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => handleFlip("login")}
            disabled={mode === "login" || isFlipping}
            className={`h-2 w-2 rounded-full transition-all ${
              mode === "login"
                ? "w-6 bg-primary"
                : "bg-border/40 hover:bg-border/60"
            }`}
            aria-label="Login mode"
          />
          <button
            onClick={() => handleFlip("register")}
            disabled={mode === "register" || isFlipping}
            className={`h-2 w-2 rounded-full transition-all ${
              mode === "register"
                ? "w-6 bg-primary"
                : "bg-border/40 hover:bg-border/60"
            }`}
            aria-label="Register mode"
          />
        </div>
      </div>
    </div>
  );
}
