"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

const destinations = [
  { name: "Cox's Bazar", region: "Chattogram", note: "Sea breeze · 3–4 days", image: "https://res.cloudinary.com/jerrick/image/upload/v1746852111/681ed90f4e0ef6001dc3ad35.jpg", className: "md:col-span-2" },
  { name: "Sundarbans", region: "Khulna", note: "Wildlife · Guided tours", image: "https://app.agilitywriter.ai/img/2023/11/05/Must-See-Tourist-Destinations-135860485.jpg", className: "" },
  { name: "Sylhet", region: "Sylhet", note: "Tea country · 2–3 days", image: "https://pohcdn.com/sites/default/files/styles/node__blog_post__bp_banner/public/live_banner/Sylhet_0.jpg", className: "" },
];

const essentials = [
  { icon: "৳", title: "Money & costs", text: "Live currency tools and realistic daily budgets.", href: "/budget", tone: "lime" },
  { icon: "↗", title: "Getting around", text: "Compare train, bus, launch and local transport.", href: "/transport", tone: "sky" },
  { icon: "+", title: "Stay safe", text: "Emergency numbers, hospitals and local guidance.", href: "/safety", tone: "coral" },
  { icon: "অ", title: "Speak locally", text: "Useful Bangla phrases with simple pronunciation.", href: "/culture", tone: "amber" },
];

export default function HomePage() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("5 days");

  function search(event: FormEvent) {
    event.preventDefault();
    window.location.href = destination ? `/destinations?q=${encodeURIComponent(destination)}` : "/destinations";
  }

  return (
    <div className="home-shell">
      <section className="hero-wrap">
        <div className="hero-noise" />
        <div className="home-container hero-grid">
          <div className="hero-copy animate-slide-up">
            <div className="eyebrow"><span /> Your local way into Bangladesh</div>
            <h1>Come for the colour.<br /><em>Stay for the stories.</em></h1>
            <p className="hero-lede">Build a personal trip across river cities, tea gardens, mangrove forests and the world&apos;s longest natural sea beach.</p>
            <form onSubmit={search} className="trip-search" aria-label="Find a Bangladesh destination">
              <div className="search-field search-main">
                <label htmlFor="destination">Where do you want to go?</label>
                <div><span aria-hidden="true">⌖</span><input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Dhaka, Sylhet, Cox's Bazar..." /></div>
              </div>
              <div className="search-field search-days">
                <label htmlFor="days">Trip length</label>
                <select id="days" value={days} onChange={(e) => setDays(e.target.value)}><option>3 days</option><option>5 days</option><option>7 days</option><option>10 days</option></select>
              </div>
              <button type="submit" aria-label="Search destinations">Explore <span>↗</span></button>
            </form>
            <div className="trust-row">
              <div className="visitor-stack" aria-hidden="true"><span>J</span><span>M</span><span>A</span></div>
              <p><strong>Loved by curious travellers</strong><br />Local insight, clearer decisions.</p>
            </div>
          </div>
          <div className="hero-visual animate-fade-in">
            <div className="sun-disc" />
            <div className="hero-photo">
              <Image src="https://res.cloudinary.com/jerrick/image/upload/v1746852111/681ed90f4e0ef6001dc3ad35.jpg" alt="Aerial view of Cox's Bazar coastline" fill priority sizes="(max-width: 768px) 92vw, 48vw" />
              <div className="photo-shade" />
              <div className="photo-label"><span>01</span><div><b>Cox&apos;s Bazar</b><small>Bay of Bengal</small></div></div>
            </div>
            <div className="floating-note note-top"><b>Best time</b><span>November — March</span></div>
            <div className="floating-note note-bottom"><span className="pulse-dot" /><div><b>Travel smart</b><span>Live safety & weather info</span></div></div>
          </div>
        </div>
        <div className="hero-marquee" aria-hidden="true"><span>RIVER JOURNEYS</span><i>✦</i><span>ANCIENT STORIES</span><i>✦</i><span>WILD COASTS</span><i>✦</i><span>TEA COUNTRY</span></div>
      </section>

      <section className="home-container discover-section">
        <div className="section-heading">
          <div><p>CURATED FOR FIRST-TIME VISITORS</p><h2>A country full of<br /><em>beautiful contrasts.</em></h2></div>
          <Link href="/destinations">See all destinations <span>↗</span></Link>
        </div>
        <div className="destination-grid">
          {destinations.map((place, index) => (
            <Link key={place.name} href={`/destinations?q=${encodeURIComponent(place.name)}`} className={`destination-card ${place.className}`}>
              <Image src={place.image} alt={`${place.name}, Bangladesh`} fill sizes={index === 0 ? "(max-width: 768px) 100vw, 55vw" : "(max-width: 768px) 100vw, 28vw"} />
              <div className="destination-overlay" /><span className="place-index">0{index + 1}</span>
              <div className="place-copy"><small>{place.region}</small><h3>{place.name}</h3><p>{place.note}</p></div><span className="place-arrow">↗</span>
            </Link>
          ))}
          <Link href="/map" className="map-card"><div className="map-lines" aria-hidden="true"><span /><span /><span /><i>●</i></div><p>Not sure where to begin?</p><h3>Explore the map</h3><span className="round-arrow">→</span></Link>
        </div>
      </section>

      <section className="essentials-section"><div className="home-container">
        <div className="essentials-intro"><p>GOOD TO KNOW</p><h2>Land prepared.<br /><em>Travel easy.</em></h2><span>Everything a foreign visitor needs, translated into simple, useful advice.</span></div>
        <div className="essential-grid">{essentials.map((item) => <Link href={item.href} key={item.title} className="essential-card"><span className={`essential-icon ${item.tone}`}>{item.icon}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><b>↗</b></Link>)}</div>
      </div></section>

      <section className="home-container planner-banner">
        <div><p>YOUR TRIP, YOUR PACE</p><h2>Turn your wishlist into<br /><em>a ready-to-go itinerary.</em></h2></div>
        <div className="planner-actions"><p>Tell us your dates, interests and budget. The planner handles the route.</p><Link href="/plan">Plan my Bangladesh trip <span>→</span></Link></div>
      </section>
      <footer className="home-footer"><div className="home-container footer-row"><Link href="/" className="footer-brand"><span>বাংলা</span><b>Bangladesh<br />Travel Guide</b></Link><p>Travel deeper. Tread lighter.</p><div><Link href="/about">About</Link><Link href="/safety">Safety</Link><Link href="/culture">Culture</Link></div></div></footer>
    </div>
  );
}
