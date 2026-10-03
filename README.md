# Lakshit Luhadia — personal site

A Formula 1 themed, asymmetric personal site. Plain HTML, CSS and JavaScript, so there is no build step and it deploys to GitHub Pages as-is.

## What's in it

| Page | What it does |
| --- | --- |
| `index.html` | Name, bio, internships, tyre-colour switcher, lights-out reaction test, and the circuit of the current race weekend behind the content |
| `work.html` | Projects as a timing tower. Pick one to read the problem and what was built. Deep links work, e.g. `work.html#shape-up` |
| `contact.html` | Copy-email button, GitHub and LinkedIn, live Waterloo clock |

Each page ends with a different race-weekend footer: the current and next race, the circuit facts, or the weekend's session times in the visitor's own time zone.

## Live F1 data

The footers read the 2026 calendar from the free [Jolpica F1 API](https://github.com/jolpica/jolpica-f1) (the maintained Ergast successor, no key needed). Responses are cached in the browser for 6 hours. If the API is unreachable, the site falls back to a built-in snapshot of the remaining 2026 rounds in `js/f1.js`, so the footers never break.

Circuit outlines are baked into `js/circuits.js` (traced from the open [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) dataset, CC BY 4.0). They cover every venue on the 2026 calendar. A new venue needs one entry added by hand.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

then visit http://localhost:8000.

## Deploy to GitHub Pages

1. Create a repository named `LakshitLuhadia.github.io` (a user site) or any repository with Pages enabled.
2. Copy this folder's contents into it. The `.gitignore` keeps the resume PDFs and the `_design/` folder out of the repo. Check `git status` before committing.
3. In the repository, open **Settings → Pages**, choose **Deploy from a branch**, then `main` and `/ (root)`.
4. The site goes live at `https://lakshitluhadia.github.io/` within a minute or two.

## Content you may want to update

- **Experience and bio:** `index.html`.
- **Projects:** the `PROJECTS` list at the top of `js/work.js`. A project without `href` simply shows no link.
- **Email, clock time zone:** `js/contact.js`.
- **Social preview image:** not included. Add `<meta property="og:image" content="https://.../preview.png">` to each page when you have one.
