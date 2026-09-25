"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/destinations", label: "Discover" }, { href: "/plan", label: "Trip planner" },
  { href: "/map", label: "Map" }, { href: "/culture", label: "Know before you go" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><nav className="nav-inner" aria-label="Main navigation">
    <Link href="/" className="brand-mark" onClick={() => setOpen(false)}><span>বাংলা</span><b>Bangladesh<br />Travel Guide</b></Link>
    <div className={`nav-links ${open ? "is-open" : ""}`}>{links.map((link) => <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""} onClick={() => setOpen(false)}>{link.label}</Link>)}<Link href="/emergency" className="mobile-only" onClick={() => setOpen(false)}>Emergency help</Link></div>
    <div className="nav-actions"><Link href="/emergency" className="nav-help"><span /> Travel help</Link><Link href="/plan" className="nav-plan">Plan a trip <span>↗</span></Link><button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">{open ? "×" : "☰"}</button></div>
  </nav></header>;
}
