import React from "react";

interface HowToPlayProps {
  onBack: () => void;
}

export const HowToPlay: React.FC<HowToPlayProps> = ({ onBack }) => {
  return (
    <div className="howto-container">
      <div className="howto-header">
        <button className="btn-secondary howto-back" onClick={onBack}>
          ← Back
        </button>
        <h1 className="howto-title">📜 How to Play</h1>
      </div>

      <div className="howto-content">
        {/* Overview */}
        <section className="howto-section">
          <h2 className="howto-section-title">⚔ Overview</h2>
          <p>
            <strong>Fate's Echo</strong> is a provably fair tarot battle game.
            You and an AI opponent each draw cards from a shared 78-card tarot
            deck. The battle lasts <strong>5 rounds</strong>. Each round, both
            players reveal a card and deal damage based on card values and
            effects.
          </p>
          <p>
            The player with <strong>more HP remaining</strong> after 5 rounds
            wins. Starting HP is <strong>30</strong>.
          </p>
        </section>

        {/* Seed & Fairness */}
        <section className="howto-section">
          <h2 className="howto-section-title">🔮 Provably Fair</h2>
          <p>
            Every battle outcome is determined by a <strong>seed</strong>. Enter
            any seed string before battle — the entire sequence of shuffles,
            draws, and effects is deterministic. Same seed = same result, every
            time.
          </p>
          <p>
            Share your seed with anyone for independent verification. No hidden
            randomness, no server manipulation.
          </p>
        </section>

        {/* The Deck */}
        <section className="howto-section">
          <h2 className="howto-section-title">🃏 The 78-Card Deck</h2>

          <div className="howto-cards-overview">
            <div className="howto-card-group">
              <h3>🌟 22 Major Arcana</h3>
              <p>
                Powerful event cards with unique special effects: dodge attacks,
                deal massive damage, heal, swap HP, drain life force, and more.
                When a Major Arcana appears, its effect overrides normal combat.
              </p>
            </div>

            <div className="howto-card-group">
              <h3>🂡 56 Minor Arcana</h3>
              <p>
                Standard combat cards divided into 4 suits of 14 cards each (Ace
                through King). Card value = base damage dealt.
              </p>
            </div>
          </div>
        </section>

        {/* Suits & Counters */}
        <section className="howto-section">
          <h2 className="howto-section-title">🔥 Suits & Element Counters</h2>
          <p>
            Each suit has an elemental attribute. Countering an opposing suit
            grants <strong>+3 bonus damage</strong>:
          </p>

          <div className="howto-counter-chain">
            <div className="counter-item">
              <span className="counter-emoji">🔥</span>
              <span className="counter-name">Wands (Fire)</span>
              <span className="counter-arrow">beats</span>
              <span className="counter-emoji">🌍</span>
              <span className="counter-name">Pentacles (Earth)</span>
            </div>
            <div className="counter-item">
              <span className="counter-emoji">🌍</span>
              <span className="counter-name">Pentacles (Earth)</span>
              <span className="counter-arrow">beats</span>
              <span className="counter-emoji">🌪️</span>
              <span className="counter-name">Swords (Air)</span>
            </div>
            <div className="counter-item">
              <span className="counter-emoji">🌪️</span>
              <span className="counter-name">Swords (Air)</span>
              <span className="counter-arrow">beats</span>
              <span className="counter-emoji">💧</span>
              <span className="counter-name">Cups (Water)</span>
            </div>
            <div className="counter-item">
              <span className="counter-emoji">💧</span>
              <span className="counter-name">Cups (Water)</span>
              <span className="counter-arrow">beats</span>
              <span className="counter-emoji">🔥</span>
              <span className="counter-name">Wands (Fire)</span>
            </div>
          </div>
        </section>

        {/* Combat Resolution */}
        <section className="howto-section">
          <h2 className="howto-section-title">⚡ Combat Resolution</h2>
          <ul className="howto-list">
            <li>
              <strong>Minor vs Minor:</strong> Both players deal damage equal to
              their card value. Element counter bonus (+3) applies if one suit
              counters the other.
            </li>
            <li>
              <strong>Major vs Minor:</strong> The Major Arcana's special effect
              activates. The Minor card's damage is still dealt to the Major
              holder.
            </li>
            <li>
              <strong>Major vs Major:</strong> Both special effects activate.
              Chaos ensues!
            </li>
          </ul>
        </section>

        {/* Betting */}
        <section className="howto-section">
          <h2 className="howto-section-title">💰 Betting</h2>
          <ul className="howto-list">
            <li>
              <strong>Win:</strong> ×2 payout (double your bet)
            </li>
            <li>
              <strong>Draw:</strong> ×1 payout (bet returned)
            </li>
            <li>
              <strong>Lose:</strong> ×0 payout (bet lost)
            </li>
          </ul>
        </section>

        {/* Tips */}
        <section className="howto-section">
          <h2 className="howto-section-title">💡 Tips</h2>
          <ul className="howto-list">
            <li>
              Check the <strong>Card Gallery</strong> to learn all 78 cards and
              their effects.
            </li>
            <li>
              Major Arcana can swing the game dramatically — The World (20 dmg)
              or The Magician (16 dmg) are devastating.
            </li>
            <li>Wheel of Fortune swaps HP — use it when you're losing!</li>
            <li>Click anywhere during battle to skip animations.</li>
            <li>Try different seeds to explore different battle outcomes.</li>
          </ul>
        </section>
      </div>

      <button className="btn-primary howto-home-btn" onClick={onBack}>
        🏠 Return Home
      </button>
    </div>
  );
};
