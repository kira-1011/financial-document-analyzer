"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/app/(auth)/actions";
import type { LoginState } from "@/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const initialState: LoginState = {};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
const searchParams = useSearchParams();
const callbackUrl = searchParams.get("callbackUrl") || "";


  useEffect(() => {
    if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        {/* Hidden input for callbackUrl */}
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            aria-describedby={state.errors?.email ? "email-error" : undefined}
          />
          {state.errors?.email && (
            <FieldError id="email-error">{state.errors.email[0]}</FieldError>
          )}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground"
            >
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            aria-describedby={state.errors?.password ? "password-error" : undefined}
          />
          {state.errors?.password && (
            <FieldError id="password-error">{state.errors.password[0]}</FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
