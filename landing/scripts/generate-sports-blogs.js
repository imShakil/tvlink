import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT_DIR, 'content', 'articles');
const REGISTRY_PATH = path.join(ROOT_DIR, 'content', 'published-sports.json');

// Ensure content and articles directories exist
if (!fs.existsSync(ARTICLES_DIR)) {
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
}

// Load or initialize publication registry
function loadRegistry() {
  if (fs.existsSync(REGISTRY_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

// Convert string to safe filename slug
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// 1. Scrape Cricbuzz International Series (Excluding Past Months)
// ---------------------------------------------------------------------------
async function fetchCricketSeries() {
  console.log('🏏 Fetching international cricket series from Cricbuzz...');
  const res = await fetch('https://www.cricbuzz.com/cricket-schedule/series/international', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Cricbuzz: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const seriesList = [];

  $('div.w-full.flex').each((_, el) => {
    const monthHeader = $(el).find('div[class*="capitalize"]').first().text().trim();
    if (!monthHeader) return;

    // Parse month (e.g. "october 2026")
    const parsedMonthDate = new Date(Date.parse(monthHeader + " 01"));
    if (isNaN(parsedMonthDate.getTime())) return;

    const seriesYear = parsedMonthDate.getFullYear();
    const seriesMonth = parsedMonthDate.getMonth();

    $(el).find('a[href*="/cricket-series/"]').each((_, a) => {
      const title = $(a).find('.text-ellipsis').first().text().trim();
      const dateRange = $(a).find('.text-cbTxtSec').first().text().trim();
      const href = $(a).attr('href') || '';
      
      const idMatch = href.match(/\/cricket-series\/(\d+)\//);
      const seriesId = idMatch ? idMatch[1] : slugify(title);

      // Check if series is still active or future
      // If the month header is in the past, verify if dateRange spills into current month
      const isPastMonth = seriesYear < currentYear || (seriesYear === currentYear && seriesMonth < currentMonth);
      if (isPastMonth) {
        // Double check date range (e.g. "Sep 24 - Oct 31")
        const endMonthMatch = dateRange.match(/-\s*([A-Za-z]+)\s*(\d+)?/);
        if (endMonthMatch) {
          const endMonthName = endMonthMatch[1];
          const endDate = new Date(Date.parse(`${endMonthName} 01, ${seriesYear}`));
          if (!isNaN(endDate.getTime())) {
            const endYear = endDate.getFullYear();
            const endMonth = endDate.getMonth();
            if (endYear < currentYear || (endYear === currentYear && endMonth < currentMonth)) {
              return; // Expired series in past
            }
          } else {
            return;
          }
        } else {
          return;
        }
      }

      if (title && !seriesList.some(s => s.id === seriesId)) {
        seriesList.push({
          sport: 'cricket',
          id: seriesId,
          title,
          month: monthHeader,
          dateRange,
          url: href.startsWith('http') ? href : `https://www.cricbuzz.com${href}`
        });
      }
    });
  });

  console.log(`✅ Found ${seriesList.length} active or upcoming cricket series.`);
  return seriesList;
}

// ---------------------------------------------------------------------------
// 2. Scrape ESPN Football Competitions
// ---------------------------------------------------------------------------
async function fetchFootballCompetitions() {
  console.log('⚽ Fetching football competitions from ESPN...');
  const res = await fetch('https://www.espn.in/football/competitions', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ESPN: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const regex = /href="(https:\/\/www\.espn\.in\/football\/league\/_\/name\/([^"]+))"[^>]*>[\s\S]*?<h2 class="[^"]*TeamLinks__Name[^"]*">([^<]+)<\/h2>/g;

  const competitions = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const fullUrl = match[1];
    const leagueCode = match[2].trim();
    const name = match[3].trim();

    if (name && !competitions.some(c => c.id === leagueCode)) {
      competitions.push({
        sport: 'football',
        id: leagueCode,
        title: name,
        url: fullUrl
      });
    }
  }

  console.log(`✅ Found ${competitions.length} football leagues and competitions.`);
  return competitions;
}

// ---------------------------------------------------------------------------
// 3. AI Article Content Generation (Gemini / OpenAI / Fallback Template)
// ---------------------------------------------------------------------------
async function generateArticleWithLLM(event) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const today = new Date().toISOString().split('T')[0];
  const isCricket = event.sport === 'cricket';

  const prompt = `You are a professional sports journalist and SEO content specialist for "Dekho Prime" (a premier live TV & sports streaming platform).
Write an engaging, SEO-optimized blog article in Markdown promoting Dekho Prime for the following sports competition:

Sport: ${event.sport.toUpperCase()}
Event Name: ${event.title}
Dates/Timing: ${event.dateRange || event.month || 'Current Season'}
Official Reference URL: ${event.url}

Guidelines:
1. Include YAML frontmatter at the very top:
---
title: "How to Watch ${event.title} Live Stream: Schedule, TV Channels & Online on Dekho Prime"
description: "Stream ${event.title} live in HD on Dekho Prime. Get match schedules, TV broadcast channels (T Sports, Willow, Star Sports, Sky), and Android / TV app download links."
date: ${today}
author: Dekho Prime Sports Desk
lang: en
tags:
  - ${event.sport}
  - ${slugify(event.title)}
  - live-stream
  - sports
  - dekhoprime
image: ${isCricket ? '/uploads/cricket-background-picture_50KB.jpg' : '/uploads/sports-event.jpg'}
---

2. Content Requirements:
- Engaging H1 title
- Section 1: Tournament & Series Overview (context, participating teams/clubs, star players, why this tournament is thrilling).
- Section 2: Match Schedule, Key Dates & Fixtures (mention ${event.dateRange || 'upcoming match days'}).
- Section 3: Official TV Broadcast Channels (highlight channels available on Dekho Prime such as T Sports, Willow TV, Star Sports, Sky Sports, Sony Sports, beIN Sports, SuperSport depending on the sport).
- Section 4: Why Dekho Prime is the Ultimate Streaming Platform:
    * Redesigned "Arena Clash" live sports cards with kickoff countdowns and team badges.
    * 1000+ free live channels with multi-server failover.
    * Dedicated Android touch mobile app and leanback Android TV / Firestick app with D-pad navigation.
    * Low-buffer, BDIX-optimized 1080p streams with zero subscription fees.
- Section 5: Step-by-Step: How to Watch on Dekho Prime:
    * Option A: Stream on Browser via [Dekho Prime Player](https://play.dekhoprime.live) or [Official Website](https://dekhoprime.live).
    * Option B: Install the Android TV or Mobile APK directly from [Dekho Prime Downloads](https://dekhoprime.live/downloads/).
- Section 6: FAQ section with 3 common user questions (Is Dekho Prime free? Can I watch on Android TV? How to check live scores?).

Only return the Markdown content with frontmatter. No surrounding markdown backticks or commentary.`;

  // 1. Try Gemini
  if (geminiKey) {
    try {
      console.log(`🤖 Generating article using Gemini for "${event.title}"...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
          })
        }
      );
      if (response.ok) {
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          text = text.replace(/^```markdown\n/, '').replace(/\n```$/, '').trim();
          return text;
        }
      }
    } catch (err) {
      console.warn(`Gemini API generation failed: ${err.message}. Trying OpenAI/fallback...`);
    }
  }

  // 2. Try OpenAI
  if (openaiKey) {
    try {
      console.log(`🤖 Generating article using OpenAI for "${event.title}"...`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });
      if (response.ok) {
        const data = await response.json();
        let text = data.choices?.[0]?.message?.content;
        if (text) {
          text = text.replace(/^```markdown\n/, '').replace(/\n```$/, '').trim();
          return text;
        }
      }
    } catch (err) {
      console.warn(`OpenAI API generation failed: ${err.message}. Using built-in template...`);
    }
  }

  // 3. Fallback Built-in High-Conversion Template (Offline / Local test)
  console.log(`📝 Using high-quality built-in SEO template for "${event.title}"...`);
  return buildFallbackArticle(event, today);
}

function buildFallbackArticle(event, today) {
  const isCricket = event.sport === 'cricket';
  const eventName = event.title;
  const timing = event.dateRange || event.month || 'Upcoming Matches';
  const image = isCricket ? '/uploads/cricket-background-picture_50KB.jpg' : '/uploads/sports-event.jpg';

  const actionPhrase = isCricket
    ? 'catching every boundary, wicket, and thrilling super over'
    : 'catching every goal, counter-attack, and dramatic stoppage-time winner';

  const stakesPhrase = isCricket
    ? 'With explosive power hitting, clinical bowling spells, and nail-biting finishes, this series promises unforgettable cricket action.'
    : 'With world-class wonder goals, intense derby rivalries, and championship silverware on the line, every fixture is unmissable.';

  const southAsiaChannels = isCricket
    ? 'T Sports, Star Sports 1, Sony Sports Network'
    : 'Sony Sports Network (Sony Ten 1 & 2), Star Sports Select HD, T Sports';

  const ukChannels = isCricket
    ? 'Sky Sports Cricket, TNT Sports'
    : 'Sky Sports Premier League/Football, TNT Sports';

  const naChannels = isCricket
    ? 'Willow TV, ESPN+'
    : 'ESPN+, Peacock, Paramount+';

  const menaChannels = isCricket
    ? 'Criclife, beIN Sports'
    : 'beIN Sports 1 Premium, TOD';

  return `---
title: "How to Watch ${eventName} Live Stream: Schedule, TV Channels & Streaming on Dekho Prime"
description: "Watch ${eventName} live in HD on Dekho Prime. Complete schedule (${timing}), TV broadcast channels (${southAsiaChannels.split(',')[0]} & more), and free Android TV APK downloads."
date: ${today}
author: Dekho Prime Sports Desk
lang: en
tags:
  - ${event.sport}
  - ${slugify(eventName)}
  - live-stream
  - sports
  - dekhoprime
image: ${image}
---

# How to Watch ${eventName} Live Stream Free & HD on Dekho Prime

Sports fans around the world are gearing up for **${eventName}** (${timing}). Whether you are tuning in on your smartphone during your daily commute or relaxing in front of a big-screen Android TV at home, ${actionPhrase} live in flawless high definition is essential.

In this guide, we break down the complete match dates, official television broadcasting channels, and show you how to stream **${eventName}** completely free with multi-server failover using [Dekho Prime](https://dekhoprime.live).

---

## Tournament Overview: What's at Stake?

**${eventName}** brings together elite competitors contending for continental supremacy and championship silverware. ${stakesPhrase}

- **Sport:** ${event.sport.toUpperCase()}
- **Series / Tournament:** ${eventName}
- **Tournament Dates:** ${timing}
- **Official Coverage Link:** [${eventName} Official Hub](${event.url})

---

## Official TV Broadcast Channels

Depending on your region, **${eventName}** is carried live across premier international and domestic satellite television networks:

- **Bangladesh & South Asia:** ${southAsiaChannels}
- **United Kingdom & Europe:** ${ukChannels}
- **North America:** ${naChannels}
- **Middle East & North Africa:** ${menaChannels}

All of these sports networks are directly accessible through **Dekho Prime** with instant multi-server failover, so you never get interrupted by dead links during crucial match moments.

---

## Why Dekho Prime is the Best Way to Stream ${eventName}

Streaming live sports on ordinary websites is often frustrating due to pop-up ads, sudden lag, and dead links. **Dekho Prime** was built specifically to solve these issues:

### 1. Arena Clash Live Sports Cards
Dekho Prime features dedicated **Arena Clash cards** designed for live sports enthusiasts:
- Real-time team emblems and national badges.
- Localized kickoff countdowns and match timings in Bangladeshi Standard Time (BST).
- One-tap direct jump links into official broadcasting feeds.

### 2. Android TV & Firestick Leanback Experience
Experience the stadium atmosphere on your 4K television. Our dedicated Android TV application is completely optimized for D-pad remote controls, fast channel surfing, and ultra-crisp 1080p 60fps streaming.

### 3. Ultra-Low Buffering & BDIX Connectivity
Equipped with multi-CDN failover and high-speed local caching, streams start in milliseconds without tedious buffering or video stuttering.

---

## How to Start Streaming ${eventName} on Dekho Prime

You can enjoy live sports on Dekho Prime in two simple ways:

### Option 1: Direct In-Browser Player
No app installation required. Visit our web player from any mobile or desktop browser:
1. Open the [Dekho Prime Live Player](https://play.dekhoprime.live).
2. Navigate to the **Sports** category or click the **${eventName}** live banner in the Arena Clash tab.
3. Select your preferred channel server and enjoy the live match!

### Option 2: Download the Official Android / Android TV APK
For the smoothest experience with background zero-drain sports notifications and TV remote support:
1. Head over to our official [Downloads Page](https://dekhoprime.live/downloads/).
2. Grab the **Mobile APK** for Android phones or the **Android TV APK** for TV boxes, Google TV, or Fire TV Stick.
3. Install and log in with Google to sync your favorite channels across all devices.

---

## Frequently Asked Questions (FAQ)

### Is streaming ${eventName} on Dekho Prime free?
Yes. Dekho Prime provides free access to public sports broadcasts and live entertainment channels with zero subscription fees.

### Can I watch on Android TV and Google TV?
Absolutely! Download our dedicated leanback APK from the [Downloads Page](https://dekhoprime.live/downloads/). It features remote-friendly D-pad controls and fast channel switching.

### How do I receive kick-off reminders?
Enable high-priority sports alerts inside the Dekho Prime app. Our smart zero-drain background worker notifies you right before the match starts without draining your device's battery.
`;
}

// ---------------------------------------------------------------------------
// 4. Main Pipeline Controller
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const sportArg = args.find(a => a.startsWith('--sport='))?.split('=')[1] || 'all';
  const queryArg = args.find(a => a.startsWith('--query='))?.split('=')[1] || '';
  const limitArg = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '5', 10);
  const forceArg = args.includes('--force');

  console.log(`\n======================================================`);
  console.log(`🚀 Dekho Prime Sports Promo Blog Automation Generator`);
  console.log(`   Sport: ${sportArg} | Query: "${queryArg}" | Limit: ${limitArg} | Force: ${forceArg}`);
  console.log(`======================================================\n`);

  const registry = loadRegistry();
  const queue = [];

  const queryTerms = queryArg ? queryArg.toLowerCase().split(',').map(t => t.trim()).filter(Boolean) : [];

  function matchesQuery(item) {
    if (queryTerms.length === 0) return true;
    const target = `${item.title} ${item.id} ${item.sport}`.toLowerCase();
    return queryTerms.some(term => target.includes(term));
  }

  // 1. Gather Cricket
  if (sportArg === 'all' || sportArg === 'cricket') {
    try {
      const cricket = await fetchCricketSeries();
      for (const item of cricket) {
        if (!matchesQuery(item)) continue;
        const key = `cricket:${item.id}`;
        if (forceArg || !registry[key]) {
          queue.push({ ...item, key });
        }
      }
    } catch (err) {
      console.error(`❌ Error fetching cricket series:`, err.message);
    }
  }

  // 2. Gather Football
  if (sportArg === 'all' || sportArg === 'football') {
    try {
      const football = await fetchFootballCompetitions();
      for (const item of football) {
        if (!matchesQuery(item)) continue;
        const key = `football:${item.id}`;
        if (forceArg || !registry[key]) {
          queue.push({ ...item, key });
        }
      }
    } catch (err) {
      console.error(`❌ Error fetching football competitions:`, err.message);
    }
  }

  console.log(`\n📋 Total new eligible events to generate blogs for: ${queue.length}`);

  if (queue.length === 0) {
    console.log('✨ No new tournaments or series need articles at this time. Everything is up to date!\n');
    return;
  }

  // Pick top N from queue
  const itemsToProcess = queue.slice(0, limitArg);
  console.log(`Processing top ${itemsToProcess.length} items...\n`);

  let generatedCount = 0;

  for (const item of itemsToProcess) {
    const slug = `watch-${slugify(item.title)}-live-stream`;
    const filePath = path.join(ARTICLES_DIR, `${slug}.md`);

    console.log(`✍️ Generating blog for: [${item.sport.toUpperCase()}] ${item.title}...`);

    try {
      const articleContent = await generateArticleWithLLM(item);
      fs.writeFileSync(filePath, articleContent, 'utf-8');

      // Update registry
      registry[item.key] = {
        title: item.title,
        sport: item.sport,
        slug,
        generatedAt: new Date().toISOString()
      };
      saveRegistry(registry);

      console.log(`   ✅ Saved: ${filePath}`);
      generatedCount++;
    } catch (err) {
      console.error(`   ❌ Failed to generate for ${item.title}:`, err.message);
    }

    // Gentle delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n🎉 Successfully generated ${generatedCount} new promotional articles!`);
  console.log(`📄 Articles are ready in: landing/content/articles/`);
  console.log(`📦 Registry updated in: landing/content/published-sports.json\n`);
}

main().catch(err => {
  console.error('Fatal error during blog generation:', err);
  process.exit(1);
});
