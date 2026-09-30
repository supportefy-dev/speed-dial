// Demo data only: no personal data, no real accounts. Mirrors the free tier's 3-group limit.
const auto = { type: 'auto', src: '', fit: 'contain' };
const tile = (id, groupId, url, title, image = auto, color = '') => ({ id, groupId, url, title, color, image });
export const DEMO = {
  version: 1,
  groups: [
    { id: 'work', name: 'Work', color: '#4f8ef7' },
    { id: 'dev', name: 'Dev', color: '#a06cf0' },
    { id: 'media', name: 'Media', color: '#f2555a' },
  ],
  tiles: [
    tile('w1', 'work', 'https://mail.google.com/', 'Gmail'),
    tile('w2', 'work', 'https://calendar.google.com/', 'Calendar'),
    tile('w3', 'work', 'https://drive.google.com/', 'Drive'),
    tile('w4', 'work', 'https://www.notion.so/', 'Notion'),
    tile('w5', 'work', 'https://www.figma.com/', 'Figma'),
    tile('w6', 'work', 'https://trello.com/', 'Trello'),
    tile('d1', 'dev', 'https://github.com/', 'GitHub'),
    tile('d2', 'dev', 'https://stackoverflow.com/', 'Stack Overflow'),
    tile('d3', 'dev', 'https://developer.mozilla.org/', 'MDN'),
    tile('d4', 'dev', 'https://www.npmjs.com/', 'npm'),
    tile('d5', 'dev', 'https://news.ycombinator.com/', 'Hacker News', { type: 'letter', src: '', fit: 'contain' }, '#f5a524'),
    tile('m1', 'media', 'https://www.youtube.com/', 'YouTube'),
    tile('m2', 'media', 'https://open.spotify.com/', 'Spotify'),
    tile('m3', 'media', 'https://www.reddit.com/', 'Reddit'),
    tile('m4', 'media', 'https://en.wikipedia.org/', 'Wikipedia'),
  ],
  settings: {
    theme: 'dark', layout: 'tabs', tileSize: 'm', maxColumns: 7, showTitles: true, showSearch: true,
    openInNewTab: false, remoteIcons: true, backgroundDim: 0.4, activeGroupId: 'work', collapsed: [],
  },
};
