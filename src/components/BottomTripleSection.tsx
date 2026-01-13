import Link from "next/link";

export default function BottomTripleSection() {
  return (
    
    <section className="section no-bg">
      
        <div className="bt-copy">
            <p className="bt-eyebrow">test</p>
                <h2 className="bt-headline">
                    test
                    <br />
                    <span className="bt-accent">test</span> test
                </h2>
                <p className="bt-lead">test</p>
            </div>


        <div className="bt-grid">
          <article className="bt-card">
            <h3 className="bt-h3">test</h3>
            <div className="bt-image" />
            <ul className="bt-list">
              <li>test</li>
              <li>test</li>
              <li>
                test
                <ul className="bt-sublist">
                  <li>test</li>
                  <li>test</li>
                </ul>
              </li>
            </ul>
            <div className="bt-cta">
              <Link className="bt-btn" href="/test1">test</Link>
            </div>
          </article>

          <article className="bt-card">
            <h3 className="bt-h3">test</h3>
            <div className="bt-image" />
            <ul className="bt-list">
              <li>test</li>
              <li>test</li>
              <li>test</li>
            </ul>
            <div className="bt-cta">
              <Link className="bt-btn" href="/test2">test</Link>
            </div>
          </article>

          <article className="bt-card">
            <h3 className="bt-h3">test</h3>
            <div className="bt-image" />
            <ul className="bt-list">
              <li>test</li>
              <li>test</li>
            </ul>
            <div className="bt-cta">
              <Link className="bt-btn" href="/test3">test</Link>
            </div>
          </article>
        </div>
    </section>
  );
}
