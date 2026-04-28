"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, Mail, CheckCircle2, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotForm = z.infer<typeof schema>;

const SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: SPRING, duration: 0.6 } },
};

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: ForgotForm) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setSentEmail(email);
    setSent(true);
    toast.success("Reset link sent!");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <QrCode className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">QR Menu</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Center */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                className="space-y-7"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
                variants={{ show: { transition: { staggerChildren: 0.07 } } }}
              >
                <motion.div variants={item}>
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 -ml-2 mb-4")}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </Link>

                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Enter the email you signed up with and we'll send you a link to reset your password.
                    </p>
                  </div>
                </motion.div>

                <motion.form variants={item} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@restaurant.com"
                      autoComplete="email"
                      autoFocus
                      className={cn(
                        "h-11",
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

                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending…
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                </motion.form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                className="space-y-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
              >
                <motion.div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </motion.div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Check your inbox</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We sent a password reset link to{" "}
                    <span className="font-medium text-foreground">{sentEmail}</span>.
                    It expires in 24 hours.
                  </p>
                </div>

                <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                  <Mail className="mx-auto mb-2 h-5 w-5" />
                  Didn't get it? Check your spam folder or{" "}
                  <button
                    onClick={() => setSent(false)}
                    className="font-medium text-primary hover:underline"
                  >
                    try again
                  </button>
                  .
                </div>

                <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}>
                  Back to sign in
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
