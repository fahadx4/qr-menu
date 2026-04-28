"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, Loader2, QrCode, ArrowRight, Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthPanel } from "@/components/shared/auth-panel";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const signupSchema = z.object({
  restaurant_name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  country: z.string().min(1, "Please select your country"),
});

type SignupForm = z.infer<typeof signupSchema>;

const countries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "PK", name: "Pakistan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "ES", name: "Spain" },
  { code: "IN", name: "India" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "TR", name: "Turkey" },
  { code: "EG", name: "Egypt" },
];

const SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: SPRING, duration: 0.6 } },
};

const perks = [
  "14-day Pro trial — no credit card",
  "Set up in under 15 minutes",
  "WhatsApp ordering included",
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <motion.div
      className="flex flex-wrap gap-2 mt-2"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {checks.map((c) => (
        <span
          key={c.label}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
            c.ok
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Check className={cn("h-3 w-3", !c.ok && "opacity-0")} />
          {c.label}
        </span>
      ))}
    </motion.div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    toast.success("Account created!", {
      description: "Starting your 14-day Pro trial…",
    });
    try { localStorage.setItem("qrmenu_signup_country", data.country); } catch {}
    router.push("/onboarding");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel */}
      <AuthPanel />

      {/* Right — form */}
      <div className="flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-10">
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
              Have an account?
            </span>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
          <motion.div
            className="w-full max-w-md space-y-7"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Heading */}
            <motion.div variants={item} className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Start for free
              </h1>
              <p className="text-muted-foreground">
                Create your restaurant account in minutes
              </p>
            </motion.div>

            {/* Perks */}
            <motion.ul variants={item} className="space-y-1.5">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {perk}
                </li>
              ))}
            </motion.ul>

            <motion.div variants={item}>
              <Button
                variant="outline"
                className="w-full gap-2 h-11"
                type="button"
                onClick={() => toast.info("Google sign-up coming soon")}
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

            <motion.div variants={item} className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
              <Separator className="flex-1" />
            </motion.div>

            <motion.form
              variants={item}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Restaurant name */}
              <div className="space-y-1.5">
                <Label htmlFor="restaurant_name">Restaurant name</Label>
                <Input
                  id="restaurant_name"
                  placeholder="Burger House"
                  className={cn(
                    "h-11",
                    errors.restaurant_name && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("restaurant_name")}
                />
                {errors.restaurant_name && (
                  <motion.p className="text-xs text-destructive" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    {errors.restaurant_name.message}
                  </motion.p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  autoComplete="email"
                  className={cn(
                    "h-11",
                    errors.email && "border-destructive focus-visible:ring-destructive"
                  )}
                  {...register("email")}
                />
                {errors.email && (
                  <motion.p className="text-xs text-destructive" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Select onValueChange={(v) => setValue("country", v as string)}>
                  <SelectTrigger
                    id="country"
                    className={cn(
                      "h-11",
                      errors.country && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <motion.p className="text-xs text-destructive" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    {errors.country.message}
                  </motion.p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className={cn(
                      "h-11 pr-10",
                      errors.password && "border-destructive focus-visible:ring-destructive"
                    )}
                    {...register("password", {
                      onChange: (e) => setPassword(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
                {errors.password && !password && (
                  <motion.p className="text-xs text-destructive" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 gap-2 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Start 14-day free trial
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By creating an account you agree to our{" "}
                <Link href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                .
              </p>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
