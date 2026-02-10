import React, { useState } from "react";
import {
  FULL_DECK,
  Card,
  Suit,
  SUIT_EMOJI,
  SUIT_LABEL,
  COUNTER_MAP,
  COUNTER_BONUS,
} from "../engine/cardData";

interface CardGalleryProps {
  onBack: () => void;
}

type Filter = "all" | "major" | Suit;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "✦ All Cards" },
  { key: "major", label: "🌟 Major Arcana" },
  { key: "Wands", label: `${SUIT_EMOJI.Wands} Wands` },
  { key: "Cups", label: `${SUIT_EMOJI.Cups} Cups` },
  { key: "Swords", label: `${SUIT_EMOJI.Swords} Swords` },
  { key: "Pentacles", label: `${SUIT_EMOJI.Pentacles} Pentacles` },
];

export const CardGallery: React.FC<CardGalleryProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const filteredCards = FULL_DECK.filter((card) => {
    if (filter === "all") return true;
    if (filter === "major") return card.type === "major";
    return card.suit === filter;
  });

  const getStatLine = (card: Card): string => {
    if (card.type === "major" && card.effect) {
      return card.effect.description;
    }
    if (card.type === "minor" && card.suit && card.value !== undefined) {
      const dmg = card.value;
      const counters = COUNTER_MAP[card.suit];
      return `Base Damage: ${dmg}  |  Counters: ${SUIT_LABEL[counters]} (+${COUNTER_BONUS})`;
    }
    return "";
  };

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <button className="btn-secondary gallery-back" onClick={onBack}>
          ← Back
        </button>
        <h1 className="gallery-title">📖 Card Gallery</h1>
        <p className="gallery-subtitle">
          78 Tarot Cards — Tap a card to inspect
        </p>
      </div>

      {/* Filter bar */}
      <div className="gallery-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`gallery-filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Card count */}
      <div className="gallery-count">{filteredCards.length} cards</div>

      {/* Card grid */}
      <div className="gallery-grid">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className={`gallery-card ${card.type === "major" ? "major" : ""} ${selectedCard?.id === card.id ? "selected" : ""}`}
            onClick={() =>
              setSelectedCard(selectedCard?.id === card.id ? null : card)
            }
          >
            <img
              src={card.image}
              alt={card.name}
              className="gallery-card-img"
              draggable={false}
            />
            <div className="gallery-card-name">{card.name}</div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selectedCard && (
        <div className="gallery-detail" onClick={() => setSelectedCard(null)}>
          <div
            className="gallery-detail-card"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedCard.image}
              alt={selectedCard.name}
              className="gallery-detail-img"
              draggable={false}
            />
            <div className="gallery-detail-info">
              <h2 className="gallery-detail-name">{selectedCard.name}</h2>

              <div className="gallery-detail-type">
                {selectedCard.type === "major" ? (
                  <span className="detail-badge major-badge">
                    🌟 Major Arcana #{selectedCard.majorIndex}
                  </span>
                ) : (
                  <span className="detail-badge suit-badge">
                    {SUIT_EMOJI[selectedCard.suit!]}{" "}
                    {SUIT_LABEL[selectedCard.suit!]}
                  </span>
                )}
              </div>

              {selectedCard.type === "minor" &&
                selectedCard.value !== undefined && (
                  <div className="gallery-detail-stats">
                    <div className="stat-row">
                      <span className="stat-key">Base Damage</span>
                      <span className="stat-val">{selectedCard.value}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Counter Bonus vs</span>
                      <span className="stat-val">
                        {SUIT_EMOJI[COUNTER_MAP[selectedCard.suit!]]}{" "}
                        {COUNTER_MAP[selectedCard.suit!]} (+{COUNTER_BONUS})
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-key">Max Damage</span>
                      <span className="stat-val">
                        {selectedCard.value + COUNTER_BONUS}
                      </span>
                    </div>
                  </div>
                )}

              {selectedCard.type === "major" && selectedCard.effect && (
                <div className="gallery-detail-stats">
                  <div className="stat-row">
                    <span className="stat-key">Effect Type</span>
                    <span className="stat-val effect-type">
                      {selectedCard.effect.type}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-key">Description</span>
                    <span className="stat-val">
                      {selectedCard.effect.description}
                    </span>
                  </div>
                  {selectedCard.effect.value > 0 && (
                    <div className="stat-row">
                      <span className="stat-key">Value</span>
                      <span className="stat-val">
                        {selectedCard.effect.value}
                      </span>
                    </div>
                  )}
                  {selectedCard.effect.secondaryValue !== undefined && (
                    <div className="stat-row">
                      <span className="stat-key">Secondary</span>
                      <span className="stat-val">
                        {selectedCard.effect.secondaryValue}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn-secondary gallery-detail-close"
                onClick={() => setSelectedCard(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
