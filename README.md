# Tournament Manager

**Live site:** https://rahulsyed.github.io/tournament-manager/

A complete tournament management platform for running pickleball tournaments, leagues, and social events — built for the India Association of Greenville (IAG) and available for community and corporate use.

---

## What's Here

| File / Folder | Purpose |
|---------------|---------|
| `index.html` | IAG event landing page |
| `tournament-workflow.html` | 🔧 **Owner tool** — 6-step wizard to generate any tournament format |
| `player-match-finder.html` | Player match lookup utility |
| `tournaments/` | Generated tournament HTML pages (live scoring) |
| `data/registry.json` | Index of all tournaments generated |
| `proposal.html` | Services & pricing proposal for clients |
| `google-apps-script.gs` | Google Sheets registration form backend |

---

## Tournament Formats Supported

- **Round Robin** (fixed pairs or rotating partners)
- **Group Stage** (pools → knockout)
- **Swiss** (points-based pairing)
- **Double Elimination** (winners + losers brackets + grand final)
- **Ongoing League** (multi-week, same or rotating partners)
- **Ladder League** (rank-ordered challenges)
- **Team Match League** (4–8 lines per team, tie scoring)

---

## How to Use

### As Owner (Rahul)
1. Open `tournament-workflow.html` locally or at the GitHub Pages URL
2. Fill in the 6-step wizard — name, teams, courts, format, schedule, review
3. Click **Generate Tournament Page** — downloads the HTML + saves metadata
4. Place the downloaded HTML in `tournaments/`
5. Tell Claude **"checkin"** to push everything to GitHub Pages

### For Participants
Share the tournament URL:
```
https://rahulsyed.github.io/tournament-manager/tournaments/[tournament-name].html
```

---

## Technology Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Hosting | GitHub Pages | Free |
| Live score sync | Firebase Realtime Database | Free (Spark tier) |
| Registration forms | Google Apps Script + Sheets | Free |
| Domain (optional) | Custom domain via Cloudflare | ~$12/year |

---

## Checkin Workflow

After making changes or adding new tournaments, tell Claude:
> "checkin: [brief description of what changed]"

Claude will run `git add`, `git commit`, and `git push` — GitHub Pages updates automatically within ~2 minutes.

---

*Built with vanilla HTML/CSS/JS. No frameworks, no build tools, no monthly fees.*
