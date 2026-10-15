# Shah Zaib - Portfolio

Personal portfolio for Shah Zaib, Senior Full-Stack Engineer & AI Product Engineer.

**Live site:** https://shah743.github.io/

A responsive, buildless site with semantic HTML, CSS, JavaScript, and a locally
bundled Three.js r186 accent. Includes current product work, career experience,
contact links, and a downloadable two-page PDF resume.

## Local preview

```sh
python3 -m http.server 8768 --bind 127.0.0.1
```

Open http://127.0.0.1:8768/. No package installation or build is required.

## Files

- `index.html`: content, navigation, contact links, and SVG icons.
- `styles.css`: responsive styles and print layout.
- `script.js`: navigation, section tracking, and email copying.
- `motion.js`: entrance effects and a persistent Pause/Resume control.
- `scene.js`: optional Three.js portrait accent.
- `assets/Shah-Zaib-Resume.pdf`: current downloadable resume.
- `vendor/three/`: pinned Three.js files with MIT license and source notes.

Motion respects reduced-motion preferences. The 3D accent pauses when the hero
is outside the viewport or the tab is hidden, and has a static SVG fallback.

GitHub Pages serves this repository's root from `master`. `.nojekyll` keeps the
site's static assets intact. The supplied portrait is cropped in CSS.
