// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Physical AI & Humanoid Robotics Textbook',
  tagline: 'AI-powered interactive learning for embodied intelligence',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Handle broken links during build
  onBrokenLinks: 'warn', // Change from 'throw' to 'warn' to allow build to continue
  onBrokenMarkdownLinks: 'warn',

  // Set the production url of your site here
  url: 'https://localhost:3000',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Panaversity', // Usually your GitHub org/user name.
  projectName: 'AI-native-textbook', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    // Custom plugin to configure webpack devServer proxy
    function myPlugin() {
      return {
        name: 'webpack-config-plugin',
        configureWebpack(config, isServer, { devServer }) {
          if (devServer) {
            devServer.proxy = {
              '/api': {
                target: 'http://localhost:8001',
                changeOrigin: true,
                secure: false, // Set to true in production with proper SSL
              },
            };
          }
          return {};
        },
      };
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Physical AI Textbook',
        logo: {
          alt: 'Physical AI & Humanoid Robotics Textbook Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Physical AI',
          },
          {
            to: '/docs/humanoid-robotics/intro',
            label: 'Humanoid Robotics',
            position: 'left',
          },
          {
            to: '/login',
            label: '🔐 Login',
            position: 'right',
          },
          {
            to: '/signup',
            label: '🤖 Sign Up',
            position: 'right',
            className: 'navbar-signup-button',
          },
          {
            href: 'https://github.com/Naveed247365/AI-native-textbook1',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Physical AI',
            items: [
              {
                label: 'Introduction to Physical AI',
                to: '/docs/intro',
              },
              {
                label: 'Embodied Intelligence',
                to: '/docs/embodied-intelligence',
              },
            ],
          },
          {
            title: 'Humanoid Robotics',
            items: [
              {
                label: 'Humanoid Robotics Intro',
                to: '/docs/humanoid-robotics/intro',
              },
              {
                label: 'Control Systems',
                to: '/docs/humanoid-robotics/control-systems',
              },
            ],
          },
          {
            title: 'Resources',
            items: [
              {
                label: 'Research Papers',
                href: 'https://scholar.google.com',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/Naveed247365/AI-native-textbook1',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} AI-native Physical AI & Humanoid Robotics Textbook. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

module.exports = config;