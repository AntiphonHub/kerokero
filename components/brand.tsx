import Link from 'next/link';
import Image from 'next/image';

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center no-underline hover:opacity-90 transition-opacity">
      <Image
        src="/images/logo.png"
        alt="Bempedi"
        width={140}
        height={110}
        className="h-12 w-auto object-contain"
        priority
      />
    </Link>
  );
}
