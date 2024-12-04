import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "cgen",
  base: "/cgen/",
  description: "cgen - An Event Generator",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/getting-started' }
    ],

    sidebar: [
      {
        text: 'Docs',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
        ]
      },
      {
        text: 'Using',
        items: [
          {
            text: 'Config File',
            link: '/config.md'
          },
          {
            text: 'Token Replacement',
            link: '/pipeline/functions/token.md'
          }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/bdalpe/cgen' }
    ]
  }
})
