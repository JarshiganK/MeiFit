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
    privacyTitle: 'Privacy and deletion',
    privacyLink: 'Privacy',
    privacyHint: 'What’s stored, what’s sent and how to delete it.',
    deleteLink: 'Delete all data',
    deleteHint: 'Remove everything from this device.',
  },
  data: {
    title: 'Your data',
    intro: 'Everything stays on this device. Export a backup each week and keep it somewhere safe.',
    export: 'Export backup',
    import: 'Import backup',
    exporting: 'Preparing backup…',
    lastBackup: (daysAgo: number | null) => {
      if (daysAgo === null) return 'No backup yet'
      if (daysAgo <= 0) return 'Last backup: today'
      if (daysAgo === 1) return 'Last backup: yesterday'
      return `Last backup: ${daysAgo} days ago`
    },
    nudge: 'A fresh backup keeps your progress safe.',
    exported: 'Backup saved.',
    exportFailed: 'Couldn’t create the backup. Please try again.',
    reviewTitle: 'Restore this backup?',
    reviewBody: (date: string) =>
      `This replaces everything on this device with the backup from ${date}.`,
    reviewFor: (nickname: string) => `Profile: ${nickname}`,
    reviewCounts: (c: {
      meals: number
      weighIns: number
      sleeps: number
      studySessions: number
      workoutSets: number
    }) => [
      `${c.meals} meals`,
      `${c.weighIns} weigh-ins`,
      `${c.sleeps} nights of sleep`,
      `${c.studySessions} study sessions`,
      `${c.workoutSets} workout sets`,
    ],
    reviewConfirm: 'Replace my data',
    reviewCancel: 'Keep my current data',
    imported: 'Backup restored.',
    importErrors: {
      'not-json': 'That file isn’t a Daily Quest backup. Nothing was changed.',
      'not-backup': 'That file isn’t a Daily Quest backup. Nothing was changed.',
      'newer-version':
        'This backup comes from a newer version of Daily Quest. Update the app, then try again. Nothing was changed.',
      'bad-version': 'This backup looks damaged, so nothing was changed. Try an older backup.',
      'bad-data': 'This backup looks damaged, so nothing was changed. Try an older backup.',
      'read-failed': 'Couldn’t read that file. Nothing was changed.',
      'write-failed': 'Couldn’t restore the backup. Your data hasn’t changed.',
    },
    storageTitle: 'Storage',
    storageProtected: 'Protected: your browser won’t clear this data to free up space.',
    storageNotProtected:
      'Not protected yet. Your browser may clear data if the phone runs low on space.',
    storageUnsupported: 'This browser decides when to clear storage, so keep exporting backups.',
    storageProtect: 'Protect my data',
    storageDenied:
      'Your browser said no for now. Using the app from the Home Screen usually helps. Keep exporting backups.',
    storageUsage: (bytes: number) => {
      const megabytes = bytes / 1_000_000
      return megabytes < 0.1 ? 'Using less than 0.1 MB' : `Using about ${megabytes.toFixed(1)} MB`
    },
  },
  privacy: {
    title: 'Privacy',
    sections: [
      {
        title: 'What’s stored',
        paragraphs: [
          'Everything you enter stays on this device, in the app’s own storage. There’s no account, no server, and no tracking or analytics. The app’s developer can’t see your data.',
          'Your theme choice is kept in your browser’s local storage on this device.',
        ],
      },
      {
        title: 'What’s sent',
        paragraphs: [
          'Nothing, by default. The app makes no network requests except to download its own updates.',
          'The one exception is optional and off by default. Photo meal recognition (coming in a later version) will only work if you turn it on and add your own Google Gemini API key. Then the app sends food photos, shrunk to about 800 px wide, and your menu item names to Google’s Gemini API. Nothing else is sent. On Gemini’s free tier, Google may use what you send to improve its models. Your API key stays on this device and is never included in backups.',
        ],
      },
      {
        title: 'Export or delete everything',
        paragraphs: ['You can take a copy of your data, or remove it, at any time.'],
        bullets: [
          'Export: Settings → Your data → Export backup saves one file with all your data. Keep it somewhere safe, such as Files → iCloud Drive.',
          'Delete: Settings → Delete all data removes everything from this device after you type DELETE to confirm. This can’t be undone, so export a backup first if you might want your data back.',
          'Deleting the Home Screen app, or clearing Safari’s website data, also removes your data.',
        ],
      },
      {
        title: 'Health note',
        paragraphs: [
          'Every number in Daily Quest is an estimate, not medical advice. If you have a medical condition, see a doctor before changing how you eat or train.',
        ],
      },
    ],
  },
  deleteAll: {
    title: 'Delete all data',
    body: 'This removes every meal, workout, weigh-in, study session and setting from this device. It can’t be undone.',
    exportFirst: 'Export a backup first',
    confirmWord: 'DELETE',
    confirmLabel: 'Type DELETE to confirm',
    button: 'Delete everything',
    done: 'All data deleted.',
    failed: 'Couldn’t delete the data. Please try again.',
  },
  loading: 'Loading…',
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
