import Link from "next/link";

export function TopBar() {
  return (
    <div className="bg-gradient-to-b from-[#0a0e13] to-[#121820] border-b border-border sticky top-0 z-50">
      <div className="max-w-[1320px] mx-auto flex items-center gap-7 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg tracking-wide no-underline">
          <div className="w-9 h-9 rounded-md grid place-items-center text-[#0f1419] font-black text-lg font-serif"
               style={{ background: "linear-gradient(135deg, #d4a44a, #c8372d)" }}>W</div>
          <div>
            <div className="text-gold2 leading-none">EasyTech Wiki</div>
            <div className="text-muted text-[11px] font-semibold uppercase tracking-widest mt-0.5">La référence FR</div>
          </div>
        </Link>
        <nav className="flex gap-0.5 ml-3 flex-1">
          <NavLink href="/world-conqueror-4">World Conqueror 4</NavLink>
          <NavLink href="#" disabled>European War 7</NavLink>
          <NavLink href="#" disabled>Great Conqueror Rome</NavLink>
          <NavLink href="#" disabled>Guides</NavLink>
          <NavLink href="#" disabled>Tier Lists</NavLink>
        </nav>
        <div className="flex items-center gap-2 bg-bg3 border border-border rounded-md px-3 py-1.5 w-[260px]">
          <span>🔍</span>
          <input className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted text-ink" placeholder="Rechercher une unité, général..." />
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, children, disabled }: { href: string; children: React.ReactNode; disabled?: boolean }) {
  if (disabled) {
    return <span className="px-3.5 py-2 text-dim text-sm font-semibold rounded-md opacity-50 cursor-not-allowed">{children}</span>;
  }
  return (
    <Link href={href} className="px-3.5 py-2 text-dim text-sm font-semibold rounded-md hover:bg-gold/10 hover:text-gold2 no-underline">
      {children}
    </Link>
  );
}
