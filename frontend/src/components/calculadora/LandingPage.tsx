import { Footer } from './Footer';
import { LandingNarrative } from './LandingNarrative';

export function LandingPage() {
  return (
    <div className="landing-page">
      <LandingNarrative position="top" />
      <main>
        <LandingNarrative position="bottom" />
      </main>
      <Footer />
    </div>
  );
}
