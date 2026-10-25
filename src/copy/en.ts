/**
 * Every user-facing string lives here so the app can be translated later.
 * Tone: short, plain and encouraging. Calories are always shown as ≈ estimates.
 */
export const en = {
  app: {
    name: 'Daily Quest',
    skipToContent: 'Skip to content',
  },
  nav: {
    label: 'Main',
    status: 'Status',
    food: 'Food',
    train: 'Train',
    study: 'Study',
    progress: 'Progress',
    settings: 'Settings',
  },
  common: {
    close: 'Close',
    back: 'Back',
    dismiss: 'Dismiss',
    undo: 'Undo',
    increase: (label: string) => `Increase ${label}`,
    decrease: (label: string) => `Decrease ${label}`,
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
  },
  stats: {
    str: 'STR',
    vit: 'VIT',
    int: 'INT',
    strName: 'Strength',
    vitName: 'Vitality',
    intName: 'Intellect',
  },
  status: {
    title: 'Status',
    emptyTitle: 'Your quest board is on its way',
    emptyBody:
      'Setup, daily quests and XP arrive in the next updates. Everything you log stays on this device.',
  },
  food: {
    title: 'Food',
    emptyTitle: 'Meals will live here',
    emptyBody: 'One-tap meal logging with ≈ calorie estimates is coming soon.',
  },
  train: {
    title: 'Train',
    emptyTitle: 'Your training plan goes here',
    emptyBody: 'Build a plan, then tick off each set with a tap.',
  },
  study: {
    title: 'Study',
    emptyTitle: 'Focus blocks start here',
    emptyBody: 'A focus timer and study log are coming soon. Studies always come first.',
  },
  progress: {
    title: 'Progress',
    emptyTitle: 'Progress shows up over time',
    emptyBody: 'Your weight trend and records appear once you start logging.',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeHint: 'System follows your phone’s light or dark setting.',
    debugTitle: 'Debugging',
    debug: 'Debug console',
    debugHint: 'Shows an on-screen console for reporting problems. It loads only while this is on.',
    about: 'About',
    version: (version: string, date: string) => `Version ${version} · built ${date}`,
    healthTitle: 'Health note',
    healthBody:
      'Every number in Daily Quest is an estimate, not medical advice. If you have a medical condition, see a doctor before changing how you eat or train.',
  },
  offline: {
    banner: 'You’re offline. Everything still works and saves on this device.',
  },
  update: {
    available: 'Update available',
    reload: 'Reload',
    offlineReady: 'Ready to work offline.',
  },
  error: {
    title: 'Something went wrong',
    body: 'Your data is safe on this device. Reloading usually fixes this.',
    reload: 'Reload app',
  },
  notFound: {
    title: 'This page doesn’t exist',
    body: 'The link may be old. Your quests are on the Status screen.',
    action: 'Go to Status',
  },
} as const
