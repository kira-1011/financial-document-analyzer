'use client';

import * as React from 'react';
import { useActionState, useEffect } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrganizationAction } from '@/app/(dashboard)/actions';
import type { CreateOrgState } from '@/types';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const router = useRouter();
  
  // Key counter to reset form state when dialog opens
  const [formKey, setFormKey] = React.useState(0);

  const [state, formAction, isPending] = useActionState<CreateOrgState, FormData>(
    createOrganizationAction,
    {}
  );

  // Auto-generate slug from name
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(generateSlug(value));
    }
  };

  // Handle open change - reset form when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFormKey((k) => k + 1);
      setName('');
      setSlug('');
      setSlugTouched(false);
    }
    onOpenChange(newOpen);
  };

  // Handle success/error
  const prevStateRef = React.useRef(state);
  useEffect(() => {
    if (prevStateRef.current === state) return;
    prevStateRef.current = state;

    if (state.success) {
      toast.success(state.message || 'Organization created!');
      queueMicrotask(() => onOpenChange(false));
      router.refresh();
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Organization
          </DialogTitle>
          <DialogDescription>
            Create a new organization to collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form key={formKey} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isPending}
            />
            {state.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/org/</span>
              <Input
                id="slug"
                name="slug"
                placeholder="acme-inc"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(generateSlug(e.target.value));
                }}
                disabled={isPending}
              />
            </div>
            {state.errors?.slug && (
              <p className="text-sm text-destructive">{state.errors.slug[0]}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
