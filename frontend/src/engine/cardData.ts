/**
 * Card Data Definitions — 78 Tarot Cards
 *
 * 22 Major Arcana  (id  0 – 21)  — "Event Cards" with special effects
 * 56 Minor Arcana  (id 22 – 77)  — "Combat Cards" with suit + value
 *   Cups 1-14, Pentacles 1-14, Swords 1-14, Wands 1-14
 *
 * Image filenames match the resources/Tarot Playing Cards/PNG directory.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Suit = "Wands" | "Cups" | "Swords" | "Pentacles";
export type CardType = "major" | "minor";
export type EffectType =
  | "dodge" // Take zero damage this round
  | "damage" // Deal fixed damage to opponent
  | "heal" // Heal self
  | "both_heal" // Both players heal
  | "drain" // Steal HP from opponent
  | "swap" // Swap HP values
  | "average" // Set both HP to average
  | "both_damage" // Both players take damage
  | "skip" // No combat; both heal a little
  | "conditional" // Damage depends on HP comparison
  | "damage_heal"; // Deal damage AND heal self

export interface MajorEffect {
  type: EffectType;
  value: number; // primary value (damage/heal amount)
  secondaryValue?: number; // for damage_heal: heal amount
  description: string;
}

export interface Card {
  id: number;
  type: CardType;
  name: string;
  image: string;

  // Minor-only
  suit?: Suit;
  value?: number; // 1-14

  // Major-only
  majorIndex?: number;
  effect?: MajorEffect;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_HP = 30;
export const TOTAL_ROUNDS = 5;
export const COUNTER_BONUS = 3;

/** Element counter chain: key counters value */
export const COUNTER_MAP: Record<Suit, Suit> = {
  Wands: "Pentacles", // Fire  > Earth
  Pentacles: "Swords", // Earth > Air
  Swords: "Cups", // Air   > Water
  Cups: "Wands", // Water > Fire
};

export const SUIT_EMOJI: Record<Suit, string> = {
  Wands: "🔥",
  Cups: "💧",
  Swords: "🌪️",
  Pentacles: "🌍",
};

export const SUIT_LABEL: Record<Suit, string> = {
  Wands: "Wands (Fire)",
  Cups: "Cups (Water)",
  Swords: "Swords (Air)",
  Pentacles: "Pentacles (Earth)",
};

// ─── Major Arcana Effects ────────────────────────────────────────────────────

// Major effects match contract: cardId%2 → 0=damage, 1=heal; value = 5+(cardId*3)%16
const MAJOR_EFFECTS: MajorEffect[] = [
  /* 00 */ { type: "damage", value: 5, description: "The Fool opens the void — Deal 5 damage" },
  /* 01 */ { type: "heal", value: 8, description: "Arcane restoration — Heal 8 HP" },
  /* 02 */ { type: "damage", value: 11, description: "Foresight pierces — Deal 11 damage" },
  /* 03 */ { type: "heal", value: 14, description: "Nature's embrace — Heal 14 HP" },
  /* 04 */ { type: "damage", value: 17, description: "Imperial decree — Deal 17 damage" },
  /* 05 */ { type: "heal", value: 20, description: "Divine blessing — Heal 20 HP" },
  /* 06 */ { type: "damage", value: 7, description: "Love's arrow — Deal 7 damage" },
  /* 07 */ { type: "heal", value: 10, description: "Victorious charge — Heal 10 HP" },
  /* 08 */ { type: "damage", value: 13, description: "Mighty strike — Deal 13 damage" },
  /* 09 */ { type: "heal", value: 16, description: "Hermit's wisdom — Heal 16 HP" },
  /* 10 */ { type: "damage", value: 19, description: "Fate's reckoning — Deal 19 damage" },
  /* 11 */ { type: "heal", value: 6, description: "Balanced scales — Heal 6 HP" },
  /* 12 */ { type: "damage", value: 9, description: "Suspended sacrifice — Deal 9 damage" },
  /* 13 */ { type: "heal", value: 12, description: "Death's renewal — Heal 12 HP" },
  /* 14 */ { type: "damage", value: 15, description: "Tempered blade — Deal 15 damage" },
  /* 15 */ { type: "heal", value: 18, description: "Dark pact heals — Heal 18 HP" },
  /* 16 */ { type: "damage", value: 5, description: "Tower crashes — Deal 5 damage" },
  /* 17 */ { type: "heal", value: 8, description: "Star's light — Heal 8 HP" },
  /* 18 */ { type: "damage", value: 11, description: "Lunar illusion — Deal 11 damage" },
  /* 19 */ { type: "heal", value: 14, description: "Solar radiance — Heal 14 HP" },
  /* 20 */ { type: "damage", value: 17, description: "Final judgement — Deal 17 damage" },
  /* 21 */ { type: "heal", value: 20, description: "World's harmony — Heal 20 HP" },
];

// ─── Major Arcana Card Names / Filenames ─────────────────────────────────────

const MAJOR_NAMES: { name: string; filename: string }[] = [
  { name: "The Fool", filename: "00-TheFool" },
  { name: "The Magician", filename: "01-TheMagician" },
  { name: "The High Priestess", filename: "02-TheHighPriestess" },
  { name: "The Empress", filename: "03-TheEmpress" },
  { name: "The Emperor", filename: "04-TheEmperor" },
  { name: "The Hierophant", filename: "05-TheHierophant" },
  { name: "The Lovers", filename: "06-TheLovers" },
  { name: "The Chariot", filename: "07-TheChariot" },
  { name: "Strength", filename: "08-Strength" },
  { name: "The Hermit", filename: "09-TheHermit" },
  { name: "Wheel of Fortune", filename: "10-WheelOfFortune" },
  { name: "Justice", filename: "11-Justice" },
  { name: "The Hanged Man", filename: "12-TheHangedMan" },
  { name: "Death", filename: "13-Death" },
  { name: "Temperance", filename: "14-Temperance" },
  { name: "The Devil", filename: "15-TheDevil" },
  { name: "The Tower", filename: "16-TheTower" },
  { name: "The Star", filename: "17-TheStar" },
  { name: "The Moon", filename: "18-TheMoon" },
  { name: "The Sun", filename: "19-TheSun" },
  { name: "Judgement", filename: "20-Judgement" },
  { name: "The World", filename: "21-TheWorld" },
];

// ─── Value Display Names ─────────────────────────────────────────────────────

export const VALUE_NAMES: Record<number, string> = {
  1: "Ace",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "Page",
  12: "Knight",
  13: "Queen",
  14: "King",
};

// ─── Build the Full 78-Card Deck ─────────────────────────────────────────────

function buildDeck(): Card[] {
  const deck: Card[] = [];

  // Major Arcana (id 0-21)
  for (let i = 0; i < 22; i++) {
    deck.push({
      id: i,
      type: "major",
      name: MAJOR_NAMES[i].name,
      image: `/cards/${MAJOR_NAMES[i].filename}.png`,
      majorIndex: i,
      effect: MAJOR_EFFECTS[i],
    });
  }

  // Minor Arcana (id 22-77)
  // Order matches contract enum: Wands=0, Cups=1, Swords=2, Pentacles=3
  const suits: Suit[] = ["Wands", "Cups", "Swords", "Pentacles"];
  let id = 22;
  for (const suit of suits) {
    for (let value = 1; value <= 14; value++) {
      const paddedValue = value.toString().padStart(2, "0");
      deck.push({
        id: id++,
        type: "minor",
        name: `${VALUE_NAMES[value]} of ${suit}`,
        image: `/cards/${suit}${paddedValue}.png`,
        suit,
        value,
      });
    }
  }

  return deck;
}

export const FULL_DECK: Card[] = buildDeck();
