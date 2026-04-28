"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, QrCode, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AuthPanel } from "@/components/shared/auth-panel";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: SPRING, duration: 0.6 } },
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    // Mock delay
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    toast.success("Welcome back!", { description: "Redirecting to your dashboard…" });
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel */}
      <AuthPanel />

      {/* Right — form */}
      <div className="flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">QR Menu</span>
          </Link>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              No account?
            </span>
            <Link href="/signup" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sign up free
            </Link>
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
          <motion.div
            className="w-full max-w-md space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Heading */}
            <motion.div variants={item} className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground">
                Sign in to manage your restaurant
              </p>
            </motion.div>

            {/* Social sign-in (UI only) */}
            <motion.div variants={item}>
              <Button
                variant="outline"
                className="w-full gap-2 h-11"
                type="button"
                onClick={() => toast.info("Google sign-in coming soon")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={item} className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
              <Separator className="flex-1" />
            </motion.div>

            {/* Form */}
            <motion.form
              variants={item}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  autoComplete="email"
                  className={cn(
                    "h-11 transition-colors",
                    errors.email && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("email")}
                />
                {errors.email && (
                  <motion.p
                    className="text-xs text-destructive"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(
                      "h-11 pr-10 transition-colors",
                      errors.password && "border-destructive focus-visible:ring-destructive"
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    className="text-xs text-destructive"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <Checkbox id="remember" {...register("remember")} />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Keep me signed in for 30 days
                </Label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 gap-2 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.form>

            {/* Demo credentials hint */}
            <motion.div
              variants={item}
              className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground"
            >
              <span className="font-medium text-foreground">Demo: </span>
              demo@qrmenu.app · password:{" "}
              <span className="font-mono">demo1234</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
