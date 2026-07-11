// Transparent text analysis: keyword detection + small-lexicon sentiment.
// Deliberately not a language model: every hit can be pointed at and explained.

// Ambiguous idiom words are deliberately excluded ("fall is coming",
// "sick of this heat", "walked down to the park", "miss summer", "blue sky"
// must not read as symptoms). Only low-ambiguity terms make the lexicons.
const HEALTH_WORDS = new Set([
  'dizzy', 'dizziness', 'faint', 'fainted', 'unsteady', 'wobbly',
  'tired', 'exhausted', 'fatigue', 'fatigued', 'weak', 'weakness',
  'ache', 'aches', 'aching', 'pain', 'pains', 'painful', 'hurts', 'sore',
  'fell', 'tripped', 'stumbled',
  'breathless', 'wheezing', 'cough', 'coughing',
  'nausea', 'nauseous', 'vomited', 'fever', 'chills',
  'headache', 'migraine', 'swollen', 'swelling', 'numb', 'numbness',
  'skipped', 'skipping',
]);

const ISOLATION_WORDS = new Set([
  'lonely', 'alone', 'isolated', 'sad', 'bored',
  'nobody', 'empty', 'hopeless',
]);

const POSITIVE_WORDS = new Set([
  'good', 'great', 'fine', 'better', 'best', 'happy', 'well', 'okay', 'ok',
  'lovely', 'wonderful', 'nice', 'enjoyed', 'fun', 'walk', 'walked',
  'visited', 'laughed', 'strong', 'rested', 'energetic', 'grateful',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'worse', 'worst', 'awful', 'terrible', 'rough',
  'sad', 'lonely', 'tired', 'pain', 'hurt', 'scared', 'worried',
  'anxious', 'struggled', 'struggling', 'cant', "can't", 'sleepless',
]);

const NEGATORS = new Set([
  'no', 'not', 'never', 'without', 'none', 'hardly', 'barely',
  "don't", 'dont', "didn't", 'didnt', "isn't", 'isnt', "wasn't", 'wasnt',
  "haven't", 'havent', "hasn't", 'hasnt', 'stopped', 'less',
]);

function tokenize(note) {
  return (note || '')
    .toLowerCase()
    .replace(/[^a-z' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// A word is treated as negated if any of the 3 preceding tokens is a negator
// ("no dizziness today", "didn't feel any pain").
function isNegated(tokens, i) {
  for (let k = Math.max(0, i - 3); k < i; k++) {
    if (NEGATORS.has(tokens[k])) return true;
  }
  return false;
}

export function analyzeNote(note) {
  const tokens = tokenize(note);
  const healthHits = [];
  const isolationHits = [];
  const negatedHits = [];
  let sentimentSum = 0;
  let sentimentCount = 0;

  tokens.forEach((tok, i) => {
    const negated = isNegated(tokens, i);

    if (HEALTH_WORDS.has(tok)) {
      if (negated) {
        negatedHits.push(tok);
        sentimentSum += 0.5; // reporting the absence of a symptom is mild good news
        sentimentCount++;
      } else {
        healthHits.push(tok);
      }
    }
    if (ISOLATION_WORDS.has(tok)) {
      if (negated) negatedHits.push(tok);
      else isolationHits.push(tok);
    }
    if (POSITIVE_WORDS.has(tok)) {
      sentimentSum += negated ? -1 : 1;
      sentimentCount++;
    }
    if (NEGATIVE_WORDS.has(tok)) {
      sentimentSum += negated ? 1 : -1;
      sentimentCount++;
    }
  });

  const sentiment = sentimentCount === 0
    ? 0
    : Math.max(-1, Math.min(1, sentimentSum / sentimentCount));

  return { healthHits, isolationHits, negatedHits, sentiment };
}
