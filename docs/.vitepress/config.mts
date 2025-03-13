import { defineConfig } from 'vitepress'
import {generateSidebar} from "vitepress-sidebar";

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
            link: '/config'
          },
          {
            text: 'Generators',
            link: '/config/generator'
          },
          {
            text: 'Token Replacement',
            link: '/config/token'
          }
        ]
      },
      {
        text: 'Replacement Functions',
        base: '/config/pipeline/functions/',
        items: generateSidebar({
          scanStartPath: 'config/pipeline/functions',
          excludePattern: ['token.md'],
          useTitleFromFileHeading: true,
          useTitleFromFrontmatter: true,
        })
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/bdalpe/cgen' }
    ]
  }
})
