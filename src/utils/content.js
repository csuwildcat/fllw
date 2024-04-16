

export const socialApps = {
  x: {
    profileUrl: 'https://twitter.com/',
    icon: 'twitter'
  },
  linkedin: {
    profileUrl: 'https://www.linkedin.com/in/',
  },
  github: {
    profileUrl: 'https://github.com/'
  },
  cash: {
    profileUrl: 'https://cash.app/$',
    icon: 'cash-app'
  }
}

const matchTitleRegex = /\s*#\s+([^\n]+)/;

export const storyUtils = {
  getTitle: (markdown = '', empty = 'Untitled') => markdown?.match?.(matchTitleRegex)?.[1] || empty
}