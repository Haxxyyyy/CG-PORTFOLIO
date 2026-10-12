import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, Music2, X } from 'lucide-react';

const services = ['Concert / live show', 'Private celebration', 'Band collaboration', 'Studio session'];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return <>
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Chinmay Goud home"><span className="brand-seal">चि</span><span className="brand-name">CHINMAY GOUD<small>BANSURI · MUSICIAN</small></span></a>
      <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      <nav className={menuOpen ? 'nav open' : 'nav'}><a href="#artist" onClick={closeMenu}>The artist</a><a href="#music" onClick={closeMenu}>Music & performances</a><a href="#booking" className="nav-cta" onClick={closeMenu}>Booking inquiries <ArrowUpRight size={14}/></a></nav>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-texture"/><div className="hero-ornament ornament-left">❧</div><div className="hero-ornament ornament-right">❧</div>
        <div className="hero-content"><p className="eyebrow"><span/> THE BANSURI · A CLASSICAL VOICE</p><h1>The art of<br/><em>a breath.</em></h1><p className="hero-sub">Chinmay Goud — bansuri player, student of the instrument, and performing musician with professional bands and live shows.</p><div className="hero-actions"><a className="button button-gold" href="#music">Discover the music <ArrowDown size={14}/></a><a className="text-link light-link" href="#booking">Enquire for a performance <ArrowRight size={14}/></a></div></div>
        <div className="hero-art" aria-label="Ornamental illustration of a bansuri flute"><div className="arch-outer"><div className="arch-inner"><div className="arch-glow"/><div className="arch-halo halo-one"/><div className="arch-halo halo-two"/><div className="arch-lineart">ॐ</div><div className="royal-flute"><i/><i/><i/><i/><i/><i/><i/><b/></div><div className="arch-caption"><span>CHINMAY GOUD</span><i/> BANSURI PLAYER</div></div></div><div className="art-number">01 <span>—</span> MUSIC IN THE MAKING</div></div>
        <div className="hero-bottom"><span>INDIAN CLASSICAL INSTRUMENT · CONTEMPORARY STAGES</span><a href="#artist">SCROLL TO EXPLORE <ArrowDown size={12}/></a></div>
      </section>

      <div className="gold-rule"><span>✦</span><i/><span>✦</span><i/><span>✦</span></div>

      <section className="artist section" id="artist"><div className="section-label"><span>01 / THE ARTIST</span><span>AN INTRODUCTION</span></div><div className="artist-grid"><div className="artist-heading"><p className="eyebrow dark-eyebrow">A STUDENT OF SOUND</p><h2>Rooted in<br/>tradition.<br/><em>Alive in the now.</em></h2><div className="artist-flourish">❧</div></div><div className="artist-copy"><p className="lead">The bansuri is shaped by breath: direct, expressive, and always in motion.</p><p>Chinmay Goud is a student and working musician who performs with professional bands and live shows. His practice brings the flute’s distinctive voice into the energy of an ensemble and the intimacy of a live room.</p><p>This portfolio gathers the performances, collaborations, and musical moments that tell his story—one note at a time.</p><a className="text-link dark-link" href="#booking">Begin a conversation <ArrowRight size={15}/></a></div></div><div className="artist-details"><span><small>INSTRUMENT</small>Bansuri · bamboo flute</span><span><small>PERFORMING WITH</small>Professional bands & shows</span><span><small>AVAILABLE FOR</small>Shows · sessions · collaborations</span></div></section>

      <section className="music section" id="music"><div className="section-label"><span>02 / MUSIC & PERFORMANCES</span><span>THE ARCHIVE</span></div><div className="music-heading"><h2>Moments<br/>in <em>raag.</em></h2><p>Listen, watch, and step inside the music.<br/>Approved recordings and performance footage are being gathered for this space.</p></div><div className="media-grid">
        <article className="media-card media-card-feature"><div className="media-visual visual-performance"><span className="media-index">01</span><div className="performance-arch"><div className="performance-flute"><i/><i/><i/><i/><i/><i/><b/></div><div className="play-seal">▶</div></div><span className="media-placeholder">APPROVED PERFORMANCE VIDEO TO BE ADDED</span></div><div className="media-caption"><div><span>LIVE PERFORMANCE · VIDEO</span><h3>The stage, in sound</h3></div><ArrowUpRight size={17}/></div></article>
        <article className="media-card"><div className="media-visual visual-audio"><span className="media-index">02</span><div className="audio-disc"><div className="audio-grooves"/><div className="disc-center"><Music2 size={25}/></div></div><div className="audio-bars">{Array.from({length:17},(_,i)=><i key={i} style={{'--n':i}}/>)}</div><span className="media-placeholder">APPROVED AUDIO RECORDING TO BE ADDED</span></div><div className="media-caption"><div><span>SELECTED RECORDING · AUDIO</span><h3>A closer listen</h3></div><ArrowUpRight size={17}/></div></article>
        <div className="media-note"><span>THE INSTRUMENT</span><p>A hollow reed.<br/><em>A universe of tone.</em></p><div className="note-flute"><i/><i/><i/><i/><i/><i/></div><small>BANSURI / BAMBOO FLUTE</small></div>
      </div><p className="archive-note">This archive will feature Chinmay’s approved media and credits. No placeholder represents a real performance.</p></section>

      <section className="booking section" id="booking"><div className="section-label"><span>03 / BOOKING INQUIRIES</span><span>LET THE CONVERSATION BEGIN</span></div><div className="booking-grid"><div className="booking-intro"><p className="eyebrow">FOR THE MOMENTS THAT MATTER</p><h2>Invite music<br/>into the <em>room.</em></h2><p>Planning a concert, celebration, or collaboration? Share a few details. Chinmay can follow up about availability and the right musical fit.</p><div className="booking-seal"><span>WITH<br/>REGARD</span><i>✦</i><span>AND<br/>RHYTHM</span></div></div><div className="form-panel"><div className="form-heading"><span>PERFORMANCE INQUIRY</span><span>01 — 05</span></div><form className="inquiry-form" onSubmit={handleSubmit}>{submitted ? <div className="success-state"><span>✦</span><h3>Thank you for reaching out.</h3><p>This is a visual preview. No inquiry has been sent. Connect Chinmay’s inbox to accept live requests.</p><button type="button" className="text-link dark-link" onClick={()=>setSubmitted(false)}>Start another inquiry <ArrowRight size={15}/></button></div> : <>
          <div className="form-row"><label><span>YOUR NAME</span><input name="name" placeholder="Name" required/></label><label><span>EMAIL ADDRESS</span><input name="email" type="email" placeholder="you@example.com" required/></label></div>
          <div className="form-row"><label><span>OCCASION</span><select name="event" defaultValue=""><option value="" disabled>Select an occasion</option>{services.map(item=><option key={item}>{item}</option>)}</select></label><label><span>EVENT DATE</span><input type="date" name="date"/></label></div>
          <label><span>SHARE A FEW DETAILS</span><textarea name="details" rows="3" placeholder="Location, format, or anything else to share…"/></label>
          <div className="form-submit"><button className="button button-gold" type="submit">Send an inquiry <ArrowRight size={14}/></button><span>AN INQUIRY IS NOT A CONFIRMED BOOKING</span></div><p className="form-note">Preview form · An email service must be connected before launch.</p>
        </>}</form></div></div></section>
    </main>
    <footer className="footer"><a className="wordmark" href="#home"><span className="brand-seal">चि</span><span className="brand-name">CHINMAY GOUD<small>BANSURI · MUSICIAN</small></span></a><span className="footer-note">MUSIC, MADE PRESENT.</span><a href="#home" className="back-top">BACK TO TOP ↑</a><span className="copyright">© {new Date().getFullYear()} CHINMAY GOUD</span></footer>
  </>;
}

export default App;
