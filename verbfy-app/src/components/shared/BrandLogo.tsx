import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandLogoProps {
  size?: number; // width/height in px
  withTitle?: boolean;
  href?: string;
  className?: string;
  titleClassName?: string;
}

export default function BrandLogo({
  size = 40,
  withTitle = false, // Default to false - no text
  href = '/',
  className = '',
  titleClassName = 'text-2xl font-extrabold text-gray-900 dark:text-white'
}: BrandLogoProps) {
  return (
    <Link href={href} className={`flex items-center justify-center ${className}`} aria-label="Verbfy Home">
      <Image
        src="/logo.png"
        alt="Verbfy logo"
        width={size}
        height={size}
        priority
        className="mx-auto" // Center the logo
      />
      {withTitle && <span className={titleClassName}>Verbfy</span>}
    </Link>
  );
}


