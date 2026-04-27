export function replaceSlackEmojis(text: string): string {
  return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, p1) => {
    return emojiMap[p1] || match; // If not found, leave it as-is
  });
}
export const emojiMap = {
  // Basic smileys
  smile: "😄",
  grinning: "😀",
  grin: "😁",
  joy: "😂",
  rofl: "🤣",
  smiley: "😃",
  sweat_smile: "😅",
  laughing: "😆",
  wink: "😉",
  blush: "😊",
  innocent: "😇",

  // Love & hearts
  heart: "❤️",
  heart_eyes: "😍",
  kissing_heart: "😘",
  kissing: "😗",
  kissing_smiling_eyes: "😙",
  kissing_closed_eyes: "😚",
  cupid: "💘",
  gift_heart: "💝",
  sparkling_heart: "💖",
  heartpulse: "💗",
  heartbeat: "💓",
  revolving_hearts: "💞",
  two_hearts: "💕",

  // Happy emotions
  thumbsup: "👍",
  clap: "👏",
  raised_hands: "🙌",
  ok_hand: "👌",
  muscle: "💪",
  tada: "🎉",
  party: "🎊",

  // Negative emotions
  cry: "😢",
  sob: "😭",
  disappointed: "😞",
  angry: "😠",
  rage: "😡",
  confused: "😕",
  pensive: "😔",
  worried: "😟",
  fearful: "😨",
  scream: "😱",

  // Objects
  fire: "🔥",
  rocket: "🚀",
  star: "⭐",
  bulb: "💡",
  moneybag: "💰",
  gem: "💎",
  gift: "🎁",
  trophy: "🏆",

  // Animals
  dog: "🐶",
  cat: "🐱",
  mouse: "🐭",
  hamster: "🐹",
  rabbit: "🐰",
  bear: "🐻",
  panda_face: "🐼",
  koala: "🐨",

  // Food & drink
  pizza: "🍕",
  hamburger: "🍔",
  fries: "🍟",
  spaghetti: "🍝",
  taco: "🌮",
  burrito: "🌯",
  ramen: "🍜",
  doughnut: "🍩",
  cookie: "🍪",
  cake: "🍰",
  coffee: "☕",
  beer: "🍺",
  cocktail: "🍸",

  // Activities & sports
  soccer: "⚽",
  basketball: "🏀",
  football: "🏈",
  baseball: "⚾",
  tennis: "🎾",
  bowling: "🎳",
  golf: "⛳",

  // Travel & places
  car: "🚗",
  bus: "🚌",
  train: "🚆",
  airplane: "✈️",
  ship: "🚢",
  house: "🏠",
  hotel: "🏨",

  // Time & weather
  sunny: "☀️",
  cloud: "☁️",
  rain_cloud: "🌧️",
  snow_cloud: "🌨️",
  partly_sunny: "⛅",
  umbrella: "☂️",
  snowman: "⛄",

  // Symbols
  white_check_mark: "✅",
  x: "❌",
  warning: "⚠️",
  question: "❓",
  exclamation: "❗",
  arrows_counterclockwise: "🔄",
  arrow_right: "➡️",
  arrow_left: "⬅️",
  100: "💯",

  // Work & tech
  computer: "💻",
  desktop_computer: "🖥️",
  keyboard: "⌨️",
  telephone: "☎️",
  iphone: "📱",
  email: "📧",
  mailbox: "📫",
  memo: "📝",
  books: "📚",
  open_book: "📖",
  mag: "🔍",
  wrench: "🔧",
  hammer: "🔨",
  gear: "⚙️",
  hourglass: "⌛",
};