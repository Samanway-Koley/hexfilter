# HexFilter

**HexFilter** is a free, privacy-first web tool that converts any hex color code into a ready-to-use CSS `filter` chain — letting you recolor black SVGs, PNGs, and font icons without touching an image editor.

🔗 **Live site:** [samanway-koley.github.io/hexfilter](https://samanway-koley.github.io/hexfilter/)

---

<img width="1097" height="496" alt="image" src="https://github.com/user-attachments/assets/634abf41-7942-488b-a1be-ee9f790fc1eb" />

---

## What it does

CSS filters (`invert()`, `sepia()`, `saturate()`, `hue-rotate()`, `brightness()`, `contrast()`) can transform a plain black icon into almost any color — but figuring out the right combination by hand is slow and imprecise. HexFilter solves that problem instantly:

1. Enter or pick any hex color.
2. The tool computes the exact filter chain needed to turn a black pixel into that color.
3. Copy the filter value (or the full CSS rule) and paste it straight into your stylesheet.

Everything runs client-side in the browser — no colors, icons, or data are ever sent to a server.

---

## Features

- **Hex → CSS filter conversion** — supports both `#RGB` and `#RRGGBB` formats, with or without the `#`.
- **Built-in color picker** — for visual color selection alongside manual hex input.
- **Live color-match preview** — see the computed result update in real time as you type.
- **Match accuracy readout** — live match percentage plus the resulting RGB/HSL values, so you can verify the output before using it.
- **One-click copy** — copy just the filter value or the entire `filter: ...;` CSS rule.
- **Real icon demo** — preview the generated filter applied to an actual SVG icon.
- **Contextual usage snippets** — ready-made code examples for SVG icons, font icons, PNG images, and CSS shapes.
- **Preset swatches** — quick-start buttons for common colors.
- **Privacy-first** — all computation happens locally in the browser; nothing is uploaded, stored, or tracked.
- **Fully responsive** — works across desktop and mobile viewports.
- **SEO-ready** — structured data (WebApplication, FAQPage, BreadcrumbList, Person schemas), Open Graph, and Twitter Card metadata included.

---

## Tech stack

- **HTML5** — semantic markup and structured data (JSON-LD)
- **CSS3** — custom styling, responsive layout, animations (`styles.css`)
- **JavaScript** — conversion logic and interactivity (`script.js`)
- **jQuery** — DOM manipulation and event handling
- **Google Fonts** — Schibsted Grotesk & Hanken Grotesk

No build tools, frameworks, or backend — it's a static site that runs entirely in the browser.

---

## Project structure

```
hexfilter/
├── index.html              # Main page: markup, content, structured data
├── styles.css              # All styling
├── script.js                # Conversion logic and UI interactivity
├── hexfilter.ico            # Favicon
├── hexfilter-preview.png    # Social preview / OG image
├── robots.txt                # Search engine crawling rules
├── sitemap.xml               # Sitemap for SEO
└── .github/workflows/        # GitHub Actions configuration
```

---

## Getting started locally

Since HexFilter is a static site with no dependencies to build, running it locally is simple:

```bash
# Clone the repository
git clone https://github.com/Samanway-Koley/hexfilter.git

# Move into the project directory
cd hexfilter

# Open index.html directly in your browser
open index.html   # macOS
# or
start index.html  # Windows
```

For a smoother local development experience (to avoid any file-protocol quirks), you can also serve it with a lightweight local server:

```bash
# Using Python
python3 -m http.server

# Using Node
npx serve
```

Then visit `http://localhost:8000` (or whichever port your server reports).

---

## Usage

1. Type a hex code (e.g. `EC2FA0`) into the input field, or use the color picker.
2. The tool instantly computes the closest matching CSS filter chain.
3. Check the **match percentage** and computed RGB/HSL to confirm accuracy.
4. Click **Copy value** for just the filter functions, or **Copy rule** for the full CSS declaration.
5. Paste it onto any element with a black source, for example:

```css
.icon {
  filter: invert(43%) sepia(52%) saturate(2344%) hue-rotate(305deg) brightness(95%) contrast(92%);
}
```

> **Note:** the source icon or image must be black (`#000000`) for the filter to reach the correct target color. This is why most icon fonts and libraries ship monochrome black glyphs — a filter can only transform existing pixels, not invent color from transparency.

---

## Contributing

Contributions, bug reports, and suggestions are welcome. If you'd like to improve HexFilter:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes and commit them
4. Push to your fork and open a pull request

---

## Contact

Have feedback, found a bug, or want to collaborate? Feel free to reach out:

- 📧 **Email:** [samanway.koley@gmail.com](mailto:samanway.koley@gmail.com)
- 💼 **LinkedIn:** [linkedin.com/in/samanway-koley](https://www.linkedin.com/in/samanway-koley)
