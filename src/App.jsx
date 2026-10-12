import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, Music2, X } from 'lucide-react';

const formats = ['Live shows', 'Private celebrations', 'Band collaborations', 'Studio sessions'];

const dust = Array.from({ length: 360 }, (_, index) => {
  const progress = index / 359;
  const wave = Math.sin(progress * 12.5) * 40 + Math.sin(progress * 27) * 12;
  const drift = Math.sin(index * 2.31) * (13 + Math.sin(progress * Math.PI) * 55);

  return {
    x: 80 + progress * 1280 + Math.sin(index * 1.53) * 16,
    y: 275 + wave + drift,
    radius: 0.8 + ((index * 17) % 13) / 10,
    opacity: 0.22 + ((index * 11) % 70) / 100,
    ruby: index % 7 === 0 || index % 13 === 0,
  };
});

function SoundDust() {
  return (
    <svg className="sound-dust" viewBox="0 0 1440 560" aria-hidden="true">
      <defs>
        <linearGradient id="fluteGold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f5e6bd" />
          <stop offset=".38" stopColor="#bc9552" />
          <stop offset=".6" stopColor="#6e4c35" />
          <stop offset="1" stopColor="#e5c989" />
        </linearGradient>
        <filter id="softGlow" x="-40%" y="-100%" width="180%" height="300%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <g className="dust-field">
        {dust.map((particle, index) => (
          <circle
            key={index}
            cx={particle.x}
            cy={particle.y}
            r={particle.radius}
            fill={particle.ruby ? '#a83d47' : '#e9cb87'}
            opacity={particle.opacity}
          />
        ))}
      </g>
      <g className="flute-illustration" transform="rotate(-8 720 280)">
        <rect x="180" y="270" width="1080" height="17" rx="9" fill="#e4bd72" opacity=".28" filter="url(#softGlow)" />
        <rect x="180" y="270" width="1080" height="17" rx="9" fill="url(#fluteGold)" />
        <ellipse cx="183" cy="278.5" rx="11" ry="9" fill="#e4c98b" />
        <ellipse cx="1257" cy="278.5" rx="11" ry="9" fill="#bc9552" />
        {[330, 455, 580, 705, 830, 955, 1080].map((x) => (
          <ellipse key={x} cx={x} cy="276" rx="7" ry="3.3" fill="#2b0a10" opacity=".9" />
        ))}
        <path d="M214 273h1007" stroke="#fff1cd" strokeWidth="1" opacity=".62" />
      </g>
    </svg>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="Chinmay Goud home">
          <span className="brand-seal">चि</span>
          <span className="brand-name">CHINMAY GOUD<small>BANSURI · MUSICIAN</small></span>
        </a>
        <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? 'nav open' : 'nav'}>
          <a href="#artist" onClick={closeMenu}>THE ARTIST</a>
          <a href="#music" onClick={closeMenu}>PERFORMANCES</a>
          <a href="#booking" className="nav-cta" onClick={closeMenu}>MAKE AN INQUIRY <ArrowUpRight size={13} /></a>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-vignette" />
          <div className="hero-center">
            <p className="hero-kicker"><i /> BANSURI · INDIAN BAMBOO FLUTE</p>
            <div className="hero-artwork">
              <SoundDust />
              <h1>CHINMAY <em>GOUD</em></h1>
            </div>
            <p className="hero-line">Breath, made luminous.</p>
          </div>
          <a className="scroll-cue" href="#artist"><span>SCROLL TO DISCOVER</span><ArrowDown size={12} /></a>
          <span className="hero-index">01 <i>·</i> AN ARTIST IN SOUND</span>
          <div className="hero-edge-note">CLASSICAL ROOTS <i /> LIVE STAGE</div>
        </section>

        <section className="manifesto" id="artist">
          <div className="section-overline reveal"><span>I · THE ARTIST</span><i /></div>
          <p className="manifesto-copy reveal">The bansuri carries centuries in its hollow. In Chinmay Goud’s hands, <em>each breath finds a new room to resonate.</em></p>
          <div className="manifesto-foot reveal"><span>A STUDENT OF THE INSTRUMENT</span><span>PERFORMING WITH PROFESSIONAL BANDS & SHOWS</span></div>
        </section>

        <section className="music-section" id="music">
          <div className="section-head reveal">
            <div><span className="section-overline">II · SELECTED PERFORMANCES</span><h2>The music,<br /><em>in its element.</em></h2></div>
            <p>Live moments, recordings, and portraits—gathered with care. Chinmay’s approved media will take its place here.</p>
          </div>
          <div className="media-grid">
            <article className="media-card media-feature reveal">
              <div className="media-art stage-art">
                <span className="media-number">01 / LIVE</span>
                <div className="stage-orb" /><div className="stage-lines"><i /><i /><i /><i /><i /></div>
                <div className="stage-flute" />
                <span className="asset-label">APPROVED PERFORMANCE VIDEO TO BE ADDED</span>
              </div>
              <div className="media-meta"><span>LIVE PERFORMANCE · VIDEO</span><h3>A moment on stage</h3></div>
            </article>
            <article className="media-card reveal">
              <div className="media-art sound-art">
                <span className="media-number">02 / SOUND</span>
                <div className="sound-ring"><Music2 size={24} /></div>
                <div className="sound-wave">{Array.from({ length: 25 }, (_, index) => <i key={index} style={{ '--wave-height': `${12 + ((index * 19) % 43)}px` }} />)}</div>
                <span className="asset-label">APPROVED AUDIO RECORDING TO BE ADDED</span>
              </div>
              <div className="media-meta"><span>SELECTED RECORDING · AUDIO</span><h3>A closer listen</h3></div>
            </article>
            <article className="media-card reveal">
              <div className="media-art portrait-art">
                <span className="media-number">03 / PORTRAIT</span>
                <div className="portrait-arch"><span>CHINMAY GOUD</span><i>APPROVED PHOTO TO BE ADDED</i></div>
                <span className="asset-label">ARTIST PHOTOGRAPH</span>
              </div>
              <div className="media-meta"><span>PORTRAIT · PHOTOGRAPHY</span><h3>Behind the music</h3></div>
            </article>
          </div>
          <div className="archive-note"><span>THE ARCHIVE IS IN PROGRESS</span><span>ONLY APPROVED MEDIA WILL APPEAR HERE</span></div>
        </section>

        <section className="instrument-section">
          <div className="instrument-copy reveal">
            <span className="section-overline">III · THE INSTRUMENT</span>
            <h2>A river<br />of <em>breath.</em></h2>
            <p>The bansuri is a simple length of bamboo transformed by air, touch, and attention. Its voice can be intimate or expansive, meeting the stillness of a room and the pulse of a live ensemble.</p>
            <a className="text-link" href="#booking">Invite the music <ArrowRight size={14} /></a>
          </div>
          <div className="instrument-visual reveal" aria-label="Abstract bansuri illustration">
            <div className="instrument-glow" /><div className="instrument-orbit orbit-one" /><div className="instrument-orbit orbit-two" />
            <div className="instrument-flute"><i /><i /><i /><i /><i /><i /><i /></div>
            <span className="instrument-caption">BANSURI / BAMBOO FLUTE</span>
            <span className="instrument-stamp">CG <i>✳</i> 02</span>
          </div>
        </section>

        <section className="booking-section" id="booking">
          <div className="booking-heading reveal">
            <span className="section-overline">IV · PRIVATE & LIVE BOOKINGS</span>
            <h2>Let the music<br /><em>meet the moment.</em></h2>
            <p>Planning a show, celebration, or collaboration? Share a few details. Chinmay can follow up about availability and the right musical fit.</p>
          </div>
          <div className="booking-layout">
            <div className="booking-formats reveal"><span>PERFORMANCE FORMATS</span>{formats.map((format, index) => <div key={format}><i>0{index + 1}</i>{format}<ArrowUpRight size={13} /></div>)}</div>
            <div className="form-panel reveal">
              <div className="form-heading"><span>PERFORMANCE INQUIRY</span><span>CG / 001</span></div>
              <form className="inquiry-form" onSubmit={handleSubmit}>
                {submitted ? <div className="success-state"><span>✳</span><h3>Thank you for reaching out.</h3><p>This is a preview. No inquiry has been sent; connect Chinmay’s inbox before accepting live requests.</p><button type="button" className="text-link" onClick={() => setSubmitted(false)}>Start another inquiry <ArrowRight size={14} /></button></div> : <>
                  <div className="form-row"><label><span>YOUR NAME</span><input name="name" placeholder="Name" required /></label><label><span>EMAIL ADDRESS</span><input name="email" type="email" placeholder="you@example.com" required /></label></div>
                  <div className="form-row"><label><span>OCCASION</span><select name="event" defaultValue=""><option value="" disabled>Select an occasion</option>{formats.map((format) => <option key={format}>{format}</option>)}</select></label><label><span>EVENT DATE</span><input type="date" name="date" /></label></div>
                  <label><span>A FEW DETAILS</span><textarea name="details" rows="3" placeholder="Location, format, or anything else to share…" /></label>
                  <div className="form-submit"><button className="button button-gold" type="submit">Send an inquiry <ArrowRight size={14} /></button><span>AN INQUIRY IS NOT A CONFIRMED BOOKING</span></div>
                  <p className="form-note">Preview form · Connect an email service before launch.</p>
                </>}
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="wordmark" href="#home"><span className="brand-seal">चि</span><span className="brand-name">CHINMAY GOUD<small>BANSURI · MUSICIAN</small></span></a>
        <span className="footer-note">THE NOTE ENDS. THE MUSIC LINGERS.</span>
        <a href="#home" className="back-top">BACK TO TOP ↑</a>
        <span className="copyright">© {new Date().getFullYear()} CHINMAY GOUD</span>
      </footer>
    </div>
  );
}

export default App;
