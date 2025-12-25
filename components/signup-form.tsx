'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { signupAction } from '@/app/(auth)/actions';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SignupState } from '@/types';

const initialState: SignupState = {};

export function SignupForm({ className, ...props }: React.ComponentProps<'form'>) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';

  useEffect(() => {
    if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <h1 className="text-2xl font-bold text-center">Create an account</h1>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            aria-describedby={state.errors?.name ? 'name-error' : undefined}
          />
          {state.errors?.name && <FieldError id="name-error">{state.errors.name[0]}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            aria-describedby={state.errors?.email ? 'email-error' : undefined}
          />
          {state.errors?.email && <FieldError id="email-error">{state.errors.email[0]}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            aria-describedby={state.errors?.password ? 'password-error' : undefined}
          />
          <FieldDescription>Must be at least 8 characters long.</FieldDescription>
          {state.errors?.password && (
            <FieldError id="password-error">{state.errors.password[0]}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            aria-describedby={state.errors?.confirmPassword ? 'confirm-password-error' : undefined}
          />
          {state.errors?.confirmPassword && (
            <FieldError id="confirm-password-error">{state.errors.confirmPassword[0]}</FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </Field>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <GoogleSignInButton callbackURL={callbackUrl || '/'} label="Sign up with Google" />
        <FieldDescription className="text-center">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
