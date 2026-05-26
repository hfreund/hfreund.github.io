import Script from "next/script";

export default function Home() {
  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-YHM3G6YENT" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag() {
            dataLayer.push(arguments);
          }
          gtag("js", new Date());
          gtag("config", "G-YHM3G6YENT");
        `}
      </Script>
      <Script src="/assets/landing/landing.js?v=18" strategy="afterInteractive" />
      <div className="bg-center-radial" id="bg-center-radial" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />
      <div className="crt-lines" aria-hidden="true" />
      <div className="edge-border" id="edge-border" aria-hidden="true" />

      <main>
        <div className="terminal-wrap" id="terminal-block">
          <p className="terminal-line">
            <span id="typed" />
            <span className="cursor" aria-hidden="true" />
          </p>
        </div>
      </main>

      <footer className="site-status" role="contentinfo">
        <div className="site-status__row">
          <nav className="site-status__nav" aria-label="Contact links">
            <a
              className="site-status__link"
              href="https://www.linkedin.com/in/hughfreund/"
              rel="noopener noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>
            <span className="site-status__sep" aria-hidden="true">
              ·
            </span>
            <a
              className="site-status__link"
              href="https://github.com/hfreund"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
            <span className="site-status__sep" aria-hidden="true">
              ·
            </span>
            <a className="site-status__link" href="mailto:hugh.freund@gmail.com">
              Email
            </a>
          </nav>
          <button type="button" className="site-status__mute" id="mute-btn" aria-pressed="false" hidden>
            Sound on
          </button>
        </div>
      </footer>

      <div id="sr-status" className="visually-hidden" role="status" aria-live="polite" />

      <button
        type="button"
        className="crt-debug-backdrop"
        id="crt-debug-backdrop"
        aria-hidden="true"
        tabIndex={-1}
        title="Close scene tuning"
      />

      <div
        className="crt-debug-drawer"
        id="crt-debug-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crt-debug-title"
        aria-hidden="true"
      >
        <aside className="crt-debug-panel" id="crt-debug-panel" aria-label="Scene tuning controls">
          <header>
            <h2 id="crt-debug-title">Scene tuning</h2>
            <div className="crt-debug-actions">
              <button type="button" id="crt-debug-copy">
                Copy settings
              </button>
              <button type="button" id="crt-debug-reset">
                Reset defaults
              </button>
            </div>
          </header>
          <div className="crt-debug-grid">
            <div className="crt-debug-field">
              <label>
                Spacing <span className="crt-debug-value" id="crt-debug-val-gap">3px</span>
              </label>
              <input id="crt-debug-gap" type="range" min="0.5" max="24" step="0.5" defaultValue="3" />
            </div>
            <div className="crt-debug-field">
              <label>
                Line width <span className="crt-debug-value" id="crt-debug-val-line-w">1px</span>
              </label>
              <input id="crt-debug-line-w" type="range" min="0.5" max="8" step="0.5" defaultValue="1" />
            </div>
            <div className="crt-debug-field">
              <label>
                Diffusion <span className="crt-debug-value" id="crt-debug-val-diffusion">5.5</span>
                <span className="visually-hidden">(blur and glow spread)</span>
              </label>
              <input id="crt-debug-diffusion" type="range" min="0" max="100" step="0.5" defaultValue="5.5" />
            </div>
            <div className="crt-debug-field">
              <label>
                Line opacity <span className="crt-debug-value" id="crt-debug-val-opacity">30%</span>
              </label>
              <input id="crt-debug-opacity" type="range" min="0" max="100" step="1" defaultValue="30" />
            </div>
          </div>

          <h3 className="crt-debug-subhead">Center radial (behind vignette)</h3>
          <div className="crt-debug-grid">
            <div className="crt-debug-field">
              <label>
                Center opacity <span className="crt-debug-value" id="crt-debug-val-center-op">15%</span>
              </label>
              <input id="crt-debug-center-op" type="range" min="0" max="100" step="1" defaultValue="15" />
            </div>
            <div className="crt-debug-field">
              <label>
                Fade end <span className="crt-debug-value" id="crt-debug-val-center-fade">35%</span>
              </label>
              <input id="crt-debug-center-fade" type="range" min="25" max="80" step="1" defaultValue="35" />
            </div>
            <div className="crt-debug-field">
              <label>
                Ellipse W <span className="crt-debug-value" id="crt-debug-val-center-w">70%</span>
              </label>
              <input id="crt-debug-center-w" type="range" min="40" max="140" step="1" defaultValue="70" />
            </div>
            <div className="crt-debug-field">
              <label>
                Ellipse H <span className="crt-debug-value" id="crt-debug-val-center-h">100%</span>
              </label>
              <input id="crt-debug-center-h" type="range" min="40" max="140" step="1" defaultValue="100" />
            </div>
            <div className="crt-debug-field">
              <label>
                Center Y <span className="crt-debug-value" id="crt-debug-val-center-y">45%</span>
              </label>
              <input id="crt-debug-center-y" type="range" min="30" max="60" step="1" defaultValue="45" />
            </div>
          </div>

          <h3 className="crt-debug-subhead">Viewport border + glow</h3>
          <div className="crt-debug-grid">
            <div className="crt-debug-field">
              <label>
                Border opacity <span className="crt-debug-value" id="crt-debug-val-edge-border-op">30%</span>
              </label>
              <input id="crt-debug-edge-border-op" type="range" min="0" max="100" step="1" defaultValue="30" />
            </div>
            <div className="crt-debug-field">
              <label>
                Border width <span className="crt-debug-value" id="crt-debug-val-edge-bw">1px</span>
              </label>
              <input id="crt-debug-edge-bw" type="range" min="0.5" max="4" step="0.5" defaultValue="1" />
            </div>
            <div className="crt-debug-field">
              <label>
                Glow blur <span className="crt-debug-value" id="crt-debug-val-edge-glow">24px</span>
              </label>
              <input id="crt-debug-edge-glow" type="range" min="0" max="80" step="1" defaultValue="24" />
            </div>
            <div className="crt-debug-field">
              <label>
                Glow opacity <span className="crt-debug-value" id="crt-debug-val-edge-glow-op">28%</span>
              </label>
              <input id="crt-debug-edge-glow-op" type="range" min="0" max="100" step="1" defaultValue="28" />
            </div>
          </div>
          <pre className="crt-debug-output" id="crt-debug-output" aria-live="polite" />
          <p className="crt-debug-hint">
            Defaults match <code>:root</code> in <code>landing.css</code>. Copy settings to update source.
          </p>
        </aside>
      </div>
    </>
  );
}
