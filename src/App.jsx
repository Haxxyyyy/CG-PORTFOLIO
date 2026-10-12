import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';

const services = ['Live concerts', 'Private celebrations', 'Collaborations', 'Studio sessions'];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return <>
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Chinmay Goud home"><span className="mark">चि</span><span>CHINMAY GOUD<small>BANSURI · MUSICIAN</small></span></a>
      <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? 'nav open' : 'nav'}>
        <a href="#about" onClick={() => setMenuOpen(false)}>The artist</a><a href="#music" onClick={() => setMenuOpen(false)}>Listen & watch</a><a href="#booking" className="nav-cta" onClick={() => setMenuOpen(false)}>Enquire <ArrowUpRight size={15} /></a>
      </nav>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-grain" />
        <div className="hero-copy"><p className="eyebrow"><span /> INDIAN BAMBOO FLUTE</p><h1>Breath becomes<br /><em>music.</em></h1><p className="hero-sub">Chinmay Goud is a bansuri player performing with professional bands and live shows.</p><a className="button button-gold" href="#music">Enter the sound <ArrowDown size={16} /></a></div>
        <div className="hero-art" aria-label="Abstract illustration of a bamboo flute"><div className="sun-disc"/><div className="raga-line line-one"/><div className="raga-line line-two"/><div className="flute"><span/><span/><span/><span/><span/><span/><span/></div><p className="art-caption">A living tradition<br />in the present tense</p></div>
        <div className="hero-index"><span>01</span><i /> PORTFOLIO</div>
      </section>

      <section className="intro section" id="about"><div className="section-kicker">01 / THE ARTIST</div><div className="intro-content"><h2>A voice shaped<br />by <em>breath.</em></h2><div className="intro-text"><p>Rooted in the expressive voice of the bansuri, Chinmay brings the bamboo flute to the stage with professional bands and live shows.</p><p>This is a space for the performances, collaborations, and musical moments that make his practice his own.</p><a className="text-link" href="#booking">Start a conversation <ArrowRight size={16}/></a></div></div></section>

      <section className="music section" id="music"><div className="section-top"><div><div className="section-kicker">02 / SOUND & STAGE</div><h2>In the <em>moment.</em></h2></div><p>Selected performances and recordings<br/>will find their home here.</p></div><div className="media-grid">
        <article className="media-card media-main"><div className="media-placeholder"><div className="play-icon">▶</div><span>PERFORMANCE VIDEO PLACEHOLDER</span></div><div className="media-meta"><div><h3>Live performance</h3><p>Video coming soon · Chinmay’s approved footage</p></div><span className="media-count">FILM 01</span></div></article>
        <article className="media-card"><div className="media-placeholder audio-placeholder"><div className="wave"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><span>AUDIO RECORDING PLACEHOLDER</span></div><div className="media-meta"><div><h3>Listen closely</h3><p>Audio coming soon · Approved recording</p></div><span className="media-count">AUDIO 01</span></div></article>
      </div></section>

      <section className="quote-band"><div className="quote-mark">“</div><p>Every note begins<br />with a breath.</p><span>A thought on the bansuri</span></section>

      <section className="booking section" id="booking"><div className="section-kicker">03 / BOOKING INQUIRIES</div><div className="booking-grid"><div><h2>Let’s make<br />something <em>resonate.</em></h2><p className="booking-copy">Planning a show, celebration, or collaboration? Share a few details and Chinmay can follow up about availability and next steps.</p><div className="booking-note"><span className="note-dot"/> An inquiry is a first conversation, not a confirmed booking.</div></div>
        <form className="inquiry-form" onSubmit={handleSubmit}>
          {submitted ? <div className="success-state"><span>✳</span><h3>Thank you for reaching out.</h3><p>This demo form is ready to connect to Chinmay’s inbox. No message has been sent yet.</p><button type="button" className="text-link" onClick={() => setSubmitted(false)}>Send another inquiry <ArrowRight size={16}/></button></div> : <>
            <div className="form-heading"><span>BOOKING ENQUIRY</span><span>01 — 05</span></div>
            <label>Your name<input name="name" placeholder="How should we address you?" required /></label>
            <label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label>
            <div className="form-row"><label>Event type<select name="event" defaultValue=""><option value="" disabled>Select an occasion</option>{services.map(item => <option key={item}>{item}</option>)}</select></label><label>Event date<input type="date" name="date" /></label></div>
            <label>A little about the event<textarea name="details" placeholder="Location, audience, set length, or anything else to share…" rows="3" /></label>
            <button className="button button-gold submit-button" type="submit">Send inquiry <ArrowRight size={16}/></button>
            <p className="form-disclaimer">Demo only · Connect an email service before accepting live inquiries.</p>
          </>}
        </form></div></section>
    </main>
    <footer className="footer"><a className="wordmark" href="#home"><span className="mark">चि</span><span>CHINMAY GOUD<small>BANSURI · MUSICIAN</small></span></a><span className="footer-note">Music, made present.</span><span className="footer-copy">© {new Date().getFullYear()} Chinmay Goud</span></footer>
  </>;
}

export default App;
