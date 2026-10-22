export const siteConfig = {
  name: "Dekho Prime",
  tagline: "Free Live TV, Sports, Movies & Shows",
  description: "Official portal for Dekho Prime — stream 100+ Live TV channels, live cricket & sports, movies, and TV shows online in HD. Download Android mobile and Android TV apps.",
  siteUrl: process.env.SITE_URL || "https://dplive.pages.dev",
  blogBaseUrl: process.env.BLOG_URL || "https://dplive.pages.dev",
  author: "Dekho Prime Team",
  twitterHandle: "@dekhoprime",
  fbAppId: "1636364628119609",
  googleSiteVerification: "j32TdHhf2XF0EB5R6uWoHhQI78YGMhqRsXyEffqX8pw",
  defaultOgImage: "/uploads/dekho-prime-og-1200x630.webp",
  logoUrl: "/uploads/dekho-prime-icon-header-128.webp",
  horizontalLogo: "/uploads/dekho-prime-horizontal-logo.webp",
  horizontalLogoPng: "/uploads/dekho-prime-horizontal-logo.png",
  icon192: "/uploads/dekho-prime-icon-192.webp",
  icon512: "/uploads/dekho-prime-512x512.webp",

  // Minimalist Color Palette (Max 3 Color Types)
  // 1. Accent: Dekho Prime Crimson Red (#ea383e)
  // 2. Dark Background: Obsidian Black (#09090b / #121215)
  // 3. Text & Borders: Clean Silver & White (#f4f4f5 / #a1a1aa / #27272a)
  colors: {
    accent: "#ea383e",
    accentHover: "#f04e54",
    bgDark: "#09090b",
    bgCard: "#121215",
    border: "#27272a",
    textPrimary: "#f4f4f5",
    textMuted: "#a1a1aa",
  },

  // Key External & Internal Links
  links: {
    webApp: "https://dekhoprime.live",
    livePlayer: "https://play.dekhoprime.live",
    mobileApk: "https://github.com/imShakil/bdix/releases/latest/download/dekho-prime-mobile.apk",
    tvApk: "https://github.com/imShakil/bdix/releases/latest/download/dekho-prime-tv.apk",
    apkPure: "https://apkpure.com/p/com.imshakil.bdiptv",
    githubRepo: "https://github.com/imShakil/bdix",
    githubReleases: "https://github.com/imShakil/bdix/releases",
    githubIssues: "https://github.com/imShakil/bdix/issues",
    telegram: "https://t.me/dekhoprime",
    telegramGroup: "https://t.me/+DBjA_AdCuoY1MTQ9",
    facebook: "https://fb.com/dekhoprime.live",
    instagram: "https://instagram.com/dekhoprime.live",
    email: "mailto:hello@dekhoprime.live",
    m3uPlaylistBlog: "https://blog.dekhoprime.live/search/label/IPTV",
  },

  nav: [
    { label: "Home", href: "/" },
    { label: "Web App", href: "https://dekhoprime.live", external: true },
    { label: "Live Player", href: "https://play.dekhoprime.live", external: true },
    { label: "Downloads", href: "/downloads/" },
    { label: "Changelog", href: "/changelog/" },
    { label: "Articles & Blog", href: "/article/" }
  ],

  latestRelease: {
    version: "v4.3.0",
    releaseDate: "October 2026",
    status: "Latest Stable Release",
    changelog: [
      {
        platform: "Android Mobile",
        tag: "Mobile",
        items: [
          "Arena Clash Card: Reimagined live sports broadcast cards with national flags, team emblems, and clean duel layouts.",
          "Smart Sports Alerts: High-priority notification filter for FIFA World Cup, Cricket World Cup, ICC & Continental tournaments.",
          "Zero-Drain Notification Settings: Granular toggle controls for Football, Cricket, and Generic sports alerts with smart battery background worker standby.",
          "Brand Alignment: Redesigned dark-crimson luxury splash screen, authentic Google sign-in button, and premium squircle branding."
        ]
      },
      {
        platform: "Android TV / Google TV",
        tag: "TV",
        items: [
          "Real-Time Stream Health: Automated stream latency, buffering, and recovery telemetry reported directly for seamless failovers.",
          "Smart Fallback Switching: Instant automatic recovery when a TV broadcast stream experiences degradation or audio dropouts.",
          "TV Remote Optimization: Faster D-pad responsiveness and numeric channel jumping for quick channel surfing."
        ]
      },
      {
        platform: "Web & Core",
        tag: "Web",
        items: [
          "Stream Health Dashboard: Integrated Firestore stream health metrics with crowdsourced playback telemetry.",
          "Security & Performance: Enhanced ad-block handling resilience and strict Sonarqube compliant code optimization."
        ]
      }
    ]
  },

  features: [
    {
      icon: "tv",
      title: "1000+ Free Live Channels",
      description: "Stream Bangladeshi channels, 24/7 news, kids entertainment, music, and international channels with multi-server failover."
    },
    {
      icon: "trophy",
      title: "Live Sports Center",
      description: "Never miss a match. Real-time fixtures, kickoff times, team emblems, and direct channel links for Cricket, Football & Mega Tournaments."
    },
    {
      icon: "film",
      title: "Movies, Shows & Anime",
      description: "Vast library of movies, drama series, and Japanese anime streamed seamlessly directly in-browser or on our apps."
    },
    {
      icon: "devices",
      title: "Cross-Platform Ecosystem",
      description: "Dedicated touch app for Android phones and leanback D-pad optimized app for Android TV, Google TV, and Firestick."
    },
    {
      icon: "cloud",
      title: "Cloud Sync Watch History",
      description: "Sign in with Google once. Your favorite channels, bookmarked shows, and watch progress sync automatically across all your devices."
    },
    {
      icon: "bolt",
      title: "Ultra Lightweight & Super Fast",
      description: "Zero bloat, instant stream buffering, BDIX-friendly speeds, and built-in Bengali and English language localization."
    }
  ]
};
