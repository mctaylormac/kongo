const fs = require('fs');
const path = require('path');

const filePath = 'c:\\web\\meji\\kongo\\KonGO Bus Booking Platform\\src\\components\\AgencyDirectory.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// List of broken sequences found in view_file and their fixes
const replacements = [
  { from: /à‰valuez/g, to: 'Évaluez' },
  { from: /à‰valuation/g, to: 'Évaluation' },
  { from: /à‰valuations/g, to: 'Évaluations' },
  { from: /à‰quateur/g, to: 'Équateur' },
  { from: /Kasaà¯-Oriental/g, to: 'Kasaï-Oriental' },
  { from: /Kasaà¯-Occidental/g, to: 'Kasaï-Occidental' },
  { from: /â °/g, to: '🕒' },
  { from: /ðŸ’º/g, to: '💺' },
  { from: /ðŸ›¡ï¸ /g, to: '🛡️' },
  { from: /ðŸ’°/g, to: '💰' },
  { from: /ðŸ‘¥/g, to: '👥' },
  { from: /ðŸŽ‰/g, to: '🎉' },
  { from: /â­ /g, to: '⭐' },
  { from: /â˜…/g, to: '★' },
  { from: /ðŸ ¢/g, to: '🏢' },
  { from: /ðŸšŒ/g, to: '🚌' },
  { from: /ðŸ“‹/g, to: '📋' },
  { from: /ðŸ’Ž/g, to: '💎' },
  { from: /ðŸ †/g, to: '🏆' },
  { from: /ðŸ¥ˆ/g, to: '🥈' },
  { from: /ðŸ¥‰/g, to: '🥉' },
  { from: /ðŸ”¤/g, to: '🔤' },
  { from: /ðŸ“…/g, to: '📅' },
  { from: /ðŸš›/g, to: '🚚' },
  { from: /ðŸ‘ /g, to: '👍' }
];

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Encoding fixed.');
