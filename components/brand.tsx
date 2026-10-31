import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline">
      <div className="grid h-6 w-6 grid-cols-2 gap-[3px]">
        <div className="rounded-[2px] bg-zinc-900" />
        <div className="rounded-[2px] bg-amber-500" />
        <div className="rounded-[2px] bg-zinc-900" />
        <div className="rounded-[2px] bg-zinc-900" />
      </div>
      <span className="text-xl font-extrabold tracking-[-0.04em] text-zinc-900">
        kerokero
      </span>
    </Link>
  );
}
