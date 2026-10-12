import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Menu, MoveUpRight, X } from 'lucide-react';

const services = ['Concert / live show', 'Private celebration', 'Band collaboration', 'Studio session'];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  function closeMenu() { setMenuOpen(false); }

  return <>
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Chinmay Goud home"><span className="brand-seal">चि</span><span className="brand-name">CHINMAY<br/>GOUD<span className="brand-dot">.</span></span></a>
      <div className="header-note">BANSURI PLAYER <span>·</span> LIVE & COLLABORATIVE</div>
      <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      <nav className={menuOpen ? 'nav open' : 'nav'}>
        <a href="#artist" onClick={closeMenu}>The artist</a><a href="#sound" onClick={closeMenu}>Sound & stage</a><a href="#booking" className="nav-cta" onClick={closeMenu}>Book Chinmay <ArrowUpRight size={15}/></a>
      </nav>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-grid"/>
        <div className="hero-topline"><span>INDEPENDENT ARTIST PORTFOLIO</span><span>EST. IN THE MOMENT <i>✳</i></span></div>
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"/> THE BANSURI, REIMAGINED</p><h1>Let the<br/><span>air</span> <em>sing.</em></h1><p className="hero-sub">Chinmay Goud brings the bamboo flute to the bandstand, the big stage, and the moments that deserve a soundtrack.</p><div className="hero-actions"><a className="button button-acid" href="#sound">Feel the sound <ArrowDown size={16}/></a><a className="quiet-link" href="#booking">Invite Chinmay <MoveUpRight size={15}/></a></div></div>
        <div className="hero-visual" aria-label="Abstract stage illustration inspired by bansuri music"><div className="visual-halo halo-a"/><div className="visual-halo halo-b"/><div className="visual-sun"/><div className="beam beam-one"/><div className="beam beam-two"/><div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/><div className="sound-rings"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="hero-flute"><span/><span/><span/><span/><span/><span/><span/><b/></div><div className="visual-sticker"><AudioLines size={19}/><span>BREATH<br/>IN MOTION</span></div><span className="visual-caption">A LIVE MUSIC PRACTICE<br/>IN CONSTANT BLOOM</span></div>
        <div className="hero-side-label">BAMBOO FLUTE <span>↘</span></div>
        <div className="hero-bottom"><span>01 — INTRODUCTION</span><a href="#artist">SCROLL TO EXPLORE <ArrowDown size={13}/></a><span>CHINMAY GOUD / INDIA</span></div>
      </section>

      <div className="ticker" aria-label="Bansuri, live music, Chinmay Goud"><div className="ticker-track"><span>BANSURI</span><b>✳</b><span>LIVE MUSIC</span><b>✳</b><span>CHINMAY GOUD</span><b>✳</b><span>BANSURI</span><b>✳</b><span>LIVE MUSIC</span><b>✳</b><span>CHINMAY GOUD</span><b>✳</b></div></div>

      <section className="artist section" id="artist"><div className="section-label"><span>01 / THE ARTIST</span><span>AN INSTRUMENT WITH ROOM TO ROAM</span></div><div className="artist-grid"><div className="artist-title"><p className="pretitle">STUDENT. MUSICIAN. COLLABORATOR.</p><h2>Old soul.<br/><em>New air.</em></h2><div className="artist-glyph">ॐ<span>♪</span></div></div><div className="artist-copy"><p className="lead">The bansuri carries centuries in its hollow. Chinmay Goud brings it into the now.</p><p>A student and working musician, Chinmay performs with professional bands and live shows—moving between the expressive voice of the flute and the energy of an ensemble.</p><p>This portfolio is a growing archive of that practice: the stages, the sounds, and the people he gets to make music with.</p><a className="under-link" href="#booking">Have a show in mind? <ArrowRight size={16}/></a></div></div><div className="artist-bottomline"><span>INSTRUMENT <b>BANSURI / BAMBOO FLUTE</b></span><span>AT HOME <b>ON STAGE & IN ENSEMBLES</b></span><span>OPEN TO <b>SHOWS / SESSIONS / COLLABS</b></span></div></section>

      <section className="sound section" id="sound"><div className="section-label"><span>02 / SOUND & STAGE</span><span>TURN IT UP WHEN THE REAL RECORDINGS ARRIVE</span></div><div className="sound-heading"><h2>Not just<br/><em>background.</em></h2><p>Music is a place you enter.<br/>Here are the doors—more performances coming soon.</p></div><div className="media-grid">
        <article className="media-card media-card-large"><div className="media-art media-art-stage"><span className="art-index">01</span><div className="stage-sun"/><div className="stage-beams"/><div className="stage-lines"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="play-button">▶</div><span className="media-coming">CHINMAY’S APPROVED PERFORMANCE VIDEO</span></div><div className="media-meta"><div><span className="media-kicker">LIVE / FILM</span><h3>On stage, in the moment</h3></div><span className="media-arrow"><ArrowUpRight size={18}/></span></div></article>
        <article className="media-card"><div className="media-art media-art-audio"><span className="art-index">02</span><div className="audio-orbit"><div className="audio-bars">{Array.from({length:29},(_,i)=><i key={i} style={{'--i':i}}/>)}</div><AudioLines className="audio-glyph" size={32}/></div><span className="media-coming">APPROVED AUDIO RECORDING</span></div><div className="media-meta"><div><span className="media-kicker">LISTEN / AUDIO</span><h3>A closer listen</h3></div><span className="media-arrow"><ArrowUpRight size={18}/></span></div></article>
        <article className="media-card media-card-note"><div className="note-art"><span className="note-top">THE INSTRUMENT <i>03</i></span><div className="note-title">One breath.<br/><em>Infinite color.</em></div><div className="note-flute"><span/><span/><span/><span/><span/><span/></div><span className="note-foot">BANSURI / BAMBOO FLUTE</span></div><div className="media-meta"><div><span className="media-kicker">INSTRUMENT / NOTE</span><h3>Meet the bansuri</h3></div><span className="media-arrow"><ArrowUpRight size={18}/></span></div></article>
      </div><div className="sound-foot"><span>THE ARCHIVE IS IN PROGRESS</span><span>REAL MUSIC. REAL MOMENTS. NO FILLER.</span></div></section>

      <section className="booking section" id="booking"><div className="section-label"><span>03 / BOOKING INQUIRIES</span><span>LET’S MAKE A LITTLE NOISE</span></div><div className="booking-grid"><div className="booking-intro"><p className="pretitle">FOR THE STAGE, THE ROOM, THE RIGHT MOMENT</p><h2>Got a<br/>good <em>feeling?</em></h2><p className="booking-copy">Tell us what you’re putting together. Chinmay can follow up about the event, availability, and what might fit.</p><div className="booking-stamp"><span>OPEN</span><i>✳</i><span>TO PLAY</span></div></div><div className="form-wrap"><div className="form-top"><span>START THE CONVERSATION</span><span>NO. 001</span></div><form className="inquiry-form" onSubmit={handleSubmit}>{submitted ? <div className="success-state"><span className="success-symbol">✳</span><h3>Good things start here.</h3><p>This is a preview. The message hasn’t been sent yet—connect Chinmay’s inbox before taking real inquiries.</p><button type="button" className="under-link" onClick={()=>setSubmitted(false)}>Send another <ArrowRight size={16}/></button></div> : <>
          <div className="form-row"><label><span>YOUR NAME</span><input name="name" placeholder="Name" required/></label><label><span>EMAIL</span><input name="email" type="email" placeholder="you@example.com" required/></label></div>
          <div className="form-row"><label><span>WHAT ARE YOU PLANNING?</span><select name="event" defaultValue=""><option value="" disabled>Choose one</option>{services.map(item=><option key={item}>{item}</option>)}</select></label><label><span>WHEN?</span><input type="date" name="date"/></label></div>
          <label><span>THE DETAILS</span><textarea name="details" placeholder="Where, when, and what’s the vibe?" rows="3"/></label><div className="form-submit-row"><button className="button button-acid" type="submit">Send an inquiry <ArrowRight size={16}/></button><span>JUST AN INQUIRY<br/>NOT A CONFIRMED BOOKING</span></div><p className="form-disclaimer">Preview form · Connect an email service before accepting live inquiries.</p>
        </>}</form></div></div></section>
    </main>
    <footer className="footer"><a className="wordmark" href="#home"><span className="brand-seal">चि</span><span className="brand-name">CHINMAY<br/>GOUD<span className="brand-dot">.</span></span></a><span className="footer-tag">BANSURI PLAYER / LIVE & COLLABORATIVE</span><a className="footer-top" href="#home">BACK TO TOP ↑</a><span className="footer-copy">© {new Date().getFullYear()} CHINMAY GOUD</span></footer>
  </>;
}

export default App;
