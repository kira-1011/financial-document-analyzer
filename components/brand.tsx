import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandProps {
  /** Show logo only, hide text */
  iconOnly?: boolean;
  /** Custom className */
  className?: string;
  /** Logo size - width in pixels */
  size?: 'sm' | 'md' | 'lg';
  /** Make the brand a link to home */
  asLink?: boolean;
}

const sizes = {
  sm: { width: 24, height: 24, text: 'text-base' },
  md: { width: 32, height: 32, text: 'text-lg' },
  lg: { width: 40, height: 40, text: 'text-xl' },
};

export function Brand({ iconOnly = false, className, size = 'md', asLink = true }: BrandProps) {
  const { width, height, text } = sizes[size];

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/docu-finance-logo.svg"
        alt="DocuFinance"
        width={width}
        height={height}
        priority
      />
      {!iconOnly && <span className={cn('font-semibold tracking-tight', text)}>DocuFinance</span>}
    </div>
  );

  if (asLink) {
    return (
      <Link href="/" className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
