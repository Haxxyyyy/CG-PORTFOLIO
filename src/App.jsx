import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, Music2, Play, X } from 'lucide-react';

const formats = ['Live shows', 'Private celebrations', 'Band collaborations', 'Studio sessions'];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return <>
    <header className="site-header glass-surface">
      <a className="wordmark" href="#home" aria-label="Chinmay Goud home"><span className="brand-seal">चि</span><span className="brand-name">CHINMAY GOUD<small>BANSURI · MUSICIAN</small></span></a>
      <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      <nav className={menuOpen ? 'nav open' : 'nav'}><a href="#artist" onClick={closeMenu}>The artist</a><a href="#music" onClick={closeMenu}>Selected music</a><a href="#booking" className="nav-cta" onClick={closeMenu}>Make an inquiry <ArrowUpRight size={14}/></a></nav>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-ambient ambient-one"/><div className="hero-ambient ambient-two"/><div className="hero-grain"/>
        <div className="hero-layout"><div className="hero-copy"><p className="eyebrow"><i/> BANSURI · INDIAN BAMBOO FLUTE</p><h1>An ancient voice<br/>in the <em>now.</em></h1><p className="hero-sub">Chinmay Goud is a bansuri player, student of the instrument, and performing musician with professional bands and live shows.</p><div className="hero-actions"><a className="button button-gold" href="#music">Enter the sound <ArrowDown size={14}/></a><a className="text-link" href="#booking">Enquire for a performance <ArrowRight size={14}/></a></div><div className="hero-signature"><span>CLASSICAL ROOTS</span><i/><span>LIVE STAGE</span><i/><span>CHINMAY GOUD</span></div></div>
          <div className="hero-art"><div className="photo-glass glass-surface"><div className="photo-atmosphere"><div className="photo-orbit orbit-a"/><div className="photo-orbit orbit-b"/><div className="photo-halo"/><div className="photo-flute"><i/><i/><i/><i/><i/><i/><i/><b/></div><div className="photo-vignette"/></div><div className="photo-glass-label"><span className="label-dot"/> CHINMAY’S APPROVED PERFORMANCE PHOTO</div><div className="photo-id">CG <span>·</span> 01</div></div><div className="art-side-note">A PRACTICE IN BREATH & PRESENCE</div><div className="art-caption"><span>PORTRAIT SLOT</span><i/> HIS PHOTO WILL GO HERE</div></div></div>
        <a className="scroll-cue" href="#artist"><span>SCROLL TO DISCOVER</span><ArrowDown size={13}/></a><span className="hero-edition">ARTIST PORTFOLIO <i>✳</i></span>
      </section>

      <section className="artist section" id="artist"><div className="section-heading"><span className="section-index">01</span><div><p className="eyebrow"><i/> THE ARTIST</p><h2>Music with<br/><em>room to breathe.</em></h2></div><p className="section-aside">A STUDENT OF SOUND<br/>A PERFORMER ON STAGE</p></div><div className="artist-grid"><div className="artist-copy"><p className="lead">The bansuri carries centuries in its hollow. Each performance gives it a new place to speak.</p><p>Chinmay Goud studies the instrument and performs with professional bands and live shows. His practice brings the flute’s expressive voice into the energy of an ensemble and the intimacy of a live room.</p><p>This is a growing archive of those performances, recordings, and collaborations—shared with the care they deserve.</p><a className="text-link" href="#booking">Start a conversation <ArrowRight size={14}/></a></div><aside className="artist-card glass-surface"><span className="card-eyebrow">THE PRACTICE</span><div className="card-rule"/><div className="practice-row"><span>01</span><p><b>BANSURI</b><small>Bamboo flute · breath-led expression</small></p></div><div className="practice-row"><span>02</span><p><b>ENSEMBLE</b><small>Performing with professional bands</small></p></div><div className="practice-row"><span>03</span><p><b>LIVE</b><small>Shows · sessions · collaboration</small></p></div><div className="card-ornament">✳</div></aside></div></section>

      <section className="music section" id="music"><div className="section-heading"><span className="section-index">02</span><div><p className="eyebrow"><i/> SELECTED MUSIC</p><h2>Listen beyond<br/><em>the note.</em></h2></div><p className="section-aside">VIDEO · AUDIO · PERFORMANCE<br/>A CURATED ARCHIVE</p></div><div className="media-grid">
        <article className="media-card feature-card"><div className="media-art performance-art"><span className="media-number">01 / FILM</span><div className="stage-glow"/><div className="stage-ring ring-one"/><div className="stage-ring ring-two"/><div className="sound-bars">{Array.from({length:25},(_,i)=><i key={i} style={{'--bar':`${16+Math.abs(12-i)*5}px`}}/>)}</div><span className="play-seal" aria-hidden="true"><Play size={15} fill="currentColor"/></span><span className="asset-label">APPROVED PERFORMANCE VIDEO TO BE ADDED</span></div><div className="media-meta"><div><span>LIVE PERFORMANCE · VIDEO</span><h3>On stage, in the moment</h3></div><ArrowUpRight size={17}/></div></article>
        <article className="media-card"><div className="media-art audio-art"><span className="media-number">02 / SOUND</span><div className="audio-disc"><div className="disc-groove"/><Music2 size={24}/></div><div className="audio-wave">{Array.from({length:21},(_,i)=><i key={i} style={{'--bar':`${12+((i*17)%31)}px`}}/>)}</div><span className="asset-label">APPROVED AUDIO RECORDING TO BE ADDED</span></div><div className="media-meta"><div><span>SELECTED RECORDING · AUDIO</span><h3>A closer listen</h3></div><ArrowUpRight size={17}/></div></article>
        <article className="media-card still-card"><div className="media-art still-art"><span className="media-number">03 / STILL</span><div className="still-frame"><span>CHINMAY GOUD</span><i>PHOTO TO BE ADDED</i></div><span className="asset-label">APPROVED ARTIST PHOTOGRAPH</span></div><div className="media-meta"><div><span>PORTRAIT · PHOTOGRAPHY</span><h3>Behind the music</h3></div><ArrowUpRight size={17}/></div></article>
      </div><div className="archive-foot"><span>THE ARCHIVE IS IN PROGRESS</span><span>ONLY CHINMAY’S APPROVED MEDIA WILL APPEAR HERE</span></div></section>

      <section className="booking section" id="booking"><div className="section-heading"><span className="section-index">03</span><div><p className="eyebrow"><i/> BOOKING INQUIRIES</p><h2>Bring the music<br/><em>into the room.</em></h2></div><p className="section-aside">A FIRST CONVERSATION<br/>NO INSTANT CONFIRMATIONS</p></div><div className="booking-grid"><div className="booking-copy"><p>Planning a show, celebration, or collaboration? Share a few details and Chinmay can follow up about availability and the right musical fit.</p><div className="booking-formats"><span>PERFORMANCE FORMATS</span>{formats.map((format,i)=><div key={format}><i>0{i+1}</i>{format}<ArrowUpRight size={13}/></div>)}</div></div><div className="form-glass glass-surface"><div className="form-heading"><span>PERFORMANCE INQUIRY</span><span>CG / 001</span></div><form className="inquiry-form" onSubmit={handleSubmit}>{submitted ? <div className="success-state"><span>✳</span><h3>Thank you for reaching out.</h3><p>This is a preview. No inquiry has been sent; connect Chinmay’s inbox before accepting live requests.</p><button type="button" className="text-link" onClick={()=>setSubmitted(false)}>Start another inquiry <ArrowRight size={14}/></button></div> : <>
            <div className="form-row"><label><span>YOUR NAME</span><input name="name" placeholder="Name" required/></label><label><span>EMAIL ADDRESS</span><input name="email" type="email" placeholder="you@example.com" required/></label></div>
            <div className="form-row"><label><span>OCCASION</span><select name="event" defaultValue=""><option value="" disabled>Select an occasion</option>{formats.map(item=><option key={item}>{item}</option>)}</select></label><label><span>EVENT DATE</span><input type="date" name="date"/></label></div>
            <label><span>A FEW DETAILS</span><textarea name="details" rows="3" placeholder="Location, format, or anything else to share…"/></label><div className="form-submit"><button className="button button-gold" type="submit">Send an inquiry <ArrowRight size={14}/></button><span>REQUEST ≠ CONFIRMATION</span></div><p className="form-note">Preview form · Connect an email service before launch.</p>
          </>}</form></div></div></section>
    </main>
    <footer className="footer"><a className="wordmark" href="#home"><span className="brand-seal">चि</span><span className="brand-name">CHINMAY GOUD<small>BANSURI · MUSICIAN</small></span></a><span className="footer-note">MUSIC, WITH ROOM TO BREATHE.</span><a href="#home" className="back-top">BACK TO TOP ↑</a><span className="copyright">© {new Date().getFullYear()} CHINMAY GOUD</span></footer>
  </>;
}

export default App;
