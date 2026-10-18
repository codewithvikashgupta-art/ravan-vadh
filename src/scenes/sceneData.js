/**
 * The twelve scenes of the cinematic, in narrative order.
 *
 * Titles are original Devanagari text derived from the public-domain Ramayana
 * epic. `duration` is in seconds and drives the GSAP master timeline.
 */
export const scenes = [
  {
    id: 'opening',
    titleHi: '॥ श्री रामाय नमः ॥',
    titleEn: 'Divine Invocation',
    subtitle: 'The golden city of Lanka awakens beneath a sea of stars.',
    duration: 10,
    mood: 'devotional',
  },
  {
    id: 'ram-puja',
    titleHi: 'श्री राम पूजा',
    titleEn: 'Shri Ram Ji Puja',
    subtitle: 'Before the decisive battle, Ram Ji prays with a calm and steady heart.',
    duration: 10,
    mood: 'devotional',
  },
  {
    id: 'hanuman',
    titleHi: 'हनुमान की भक्ति',
    titleEn: "Hanuman Ji's Devotion",
    subtitle: 'Hanuman Ji bows in reverence and receives Ram Ji’s blessing.',
    duration: 10,
    mood: 'devotional',
  },
  {
    id: 'war-prep',
    titleHi: 'युद्ध की तैयारी',
    titleEn: 'Preparing for War',
    subtitle: 'The bow is raised, the arrow glows, and the winds turn cold.',
    duration: 9,
    mood: 'tension',
  },
  {
    id: 'ravan-entrance',
    titleHi: 'रावण का प्रवेश',
    titleEn: "Ravan's Grand Entrance",
    subtitle: 'The ten-headed king arrives upon his golden chariot, laughing.',
    duration: 10,
    mood: 'menace',
  },
  {
    id: 'first-arrow',
    titleHi: 'पहला दिव्य बाण',
    titleEn: 'The First Divine Arrow',
    subtitle: 'Ram Ji’s arrow strikes true — yet Ravan does not fall.',
    duration: 9,
    mood: 'battle',
  },
  {
    id: 'arrow-battles',
    titleHi: 'बाणयुद्ध',
    titleEn: 'Epic Arrow Battles',
    subtitle: 'Volley after volley lights the sky, and still the tyrant stands.',
    duration: 14,
    mood: 'battle',
  },
  {
    id: 'battle-peak',
    titleHi: 'युद्ध चरम सीमा',
    titleEn: 'The Battle Reaches Its Peak',
    subtitle: 'Thunder splits the heavens as Ravan unleashes his counterattack.',
    duration: 11,
    mood: 'battle',
  },
  {
    id: 'final-arrow',
    titleHi: 'दिव्यास्त्र — अंतिम बाण',
    titleEn: "Ram Ji's Divine Final Arrow",
    subtitle: 'A silence falls. The final arrow is drawn in golden light.',
    duration: 12,
    mood: 'climax',
  },
  {
    id: 'ravan-vadh',
    titleHi: 'रावण वध',
    titleEn: 'Ravan Vadh — The Final Victory',
    subtitle: 'Truth triumphs over untruth. The tyrant is defeated.',
    duration: 11,
    mood: 'victory',
  },
  {
    id: 'fireworks',
    titleHi: 'विजयोत्सव',
    titleEn: 'Victory Celebration',
    subtitle: 'Lanka erupts into the festival of Vijayadashami.',
    duration: 12,
    mood: 'celebration',
  },
  {
    id: 'ending',
    titleHi: 'सत्य की असत्य पर विजय',
    titleEn: 'Divine Ending',
    subtitle: 'जय श्री राम — शुभ विजयादशमी',
    duration: 10,
    mood: 'peace',
  },
];

export const TOTAL_DURATION = scenes.reduce((sum, s) => sum + s.duration, 0);

/** Cumulative start times, used to map absolute time -> scene + progress. */
export const sceneStarts = (() => {
  const starts = [];
  let cursor = 0;
  for (const s of scenes) {
    starts.push(cursor);
    cursor += s.duration;
  }
  return starts;
})();

/** Convert an absolute timeline time into `{ index, progress }`. */
export function locateScene(time) {
  const clamped = Math.min(Math.max(time, 0), TOTAL_DURATION);
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (clamped >= sceneStarts[i]) {
      const progress = (clamped - sceneStarts[i]) / scenes[i].duration;
      return { index: i, progress: Math.min(1, Math.max(0, progress)) };
    }
  }
  return { index: 0, progress: 0 };
}

/** Map a scene-local time (0..duration) of a scene to absolute time. */
export function sceneLabelStart(index) {
  return sceneStarts[Math.max(0, Math.min(scenes.length - 1, index))];
}
