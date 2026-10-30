<div align="center">

# 🦈 ASCII Shark Ocean
### A living ocean, written in characters.

**Procedural sharks · Natural swimming · Interactive ASCII art · Made for Framer**

[**🌊 Explore Live Demo**](https://asciisharkocean.framer.website/) · [**💻 Browse Component Code**](./KarimSaifNaturalASCIISharkOcean.tsx) · [**✉️ Get Support**](mailto:karimsaif010@gmail.com)

**Made with 💛 by Karim Saif**

</div>

---

## An ocean without images

**ASCII Shark Ocean** transforms typographic characters into swimming sharks. Instead of video, 3D models, or external image assets, a lightweight Canvas 2D renderer creates evolving silhouettes with character-based shading, natural body movement, and ambient ocean details.

Built as a customizable **Framer Code Component** for expressive hero sections, digital portfolios, experimental web experiences, and immersive backgrounds.

> **See it in motion:** https://asciisharkocean.framer.website/

## ✨ Highlights

| Experience | Details |
| --- | --- |
| 🦈 **Eight shark species** | Hammerhead, Great Hammerhead, Great White, Tiger, Mako, Thresher, Nurse, Zebra |
| 🔠 **Procedural ASCII** | Character-based silhouettes, adjustable glyph scale and density |
| 🌊 **Natural swimming** | Animated tails, curved trails, body flexibility, organic wandering |
| 🧭 **Collision-aware behavior** | Separation and avoidance help reduce shark intersections |
| 🖱️ **Cursor interaction** | Pointer proximity influences shark movement |
| 🎨 **Four presets** | Reference, Pearl, Chromatic, Midnight |
| 🐟 **Ambient life** | Optional small fish and ocean texture |
| 📱 **Responsive scene** | Layout-aware sizing and configurable boundaries |
| ♿ **Accessibility** | Reduced-motion handling and static render support |
| ⚡ **Performance options** | Frame-rate and DPR caps, offscreen and visibility pausing |

## 🎬 Live Preview

**[Launch the interactive ocean →](https://asciisharkocean.framer.website/)**

Try different shark species, experiment with typography density, and move your cursor across the canvas to see the ocean respond.

## 🎛️ Customize in Framer

Every property control includes a description in the Framer panel.

**Sharks & layout** — species, number of sharks, scale, contained/free boundaries.

**ASCII appearance** — character size, density, contrast, opacity, dissolve, background, primary/secondary/accent ink, and color variation.

**Natural movement** — swimming speed, curvature, roaming, tail speed and strength, body flex, turning, shark separation, predictive avoidance.

**Interaction & atmosphere** — cursor toggle, cursor radius and avoidance, fish toggle and count, optional grid texture.

**Performance** — pause, maximum frame rate, and pixel density.

## 🚀 How to Use

1. Open a Framer project and create a new **Code Component**.
2. Open [`KarimSaifNaturalASCIISharkOcean.tsx`](./KarimSaifNaturalASCIISharkOcean.tsx).
3. Copy the complete source into your Framer code file.
4. Add the component to a canvas or hero section.
5. Adjust the available controls from the right properties panel.

The component uses React and Framer's `addPropertyControls` / `useIsStaticRenderer` APIs. There are no image assets to configure.

> **Note:** Extremely crowded or very small canvases may limit shark size or movement. Collision avoidance is designed to reduce intersections; it is not a formal pixel-perfect non-overlap guarantee.

## ⚙️ Implementation

- **React + TypeScript (TSX)** for the Framer component
- **Canvas 2D** for the animated ASCII renderer
- **Path2D** for procedural silhouette masking
- **RequestAnimationFrame** for timed animation
- **ResizeObserver + IntersectionObserver** for sizing and in-view behavior
- **prefers-reduced-motion** and a static-renderer fallback for accessibility and Framer previews

## 💡 Great For

Creative portfolio heroes • Experimental websites • Generative typography • Marine-themed experiences • Interactive landing pages • Creative agency sites • Digital art showcases

## 💬 Support & Creator

Built by **Karim Saif** — Product & UI/UX Designer.

- **X:** [@karimsaif0](https://x.com/karimsaif0)
- **Email:** [karimsaif010@gmail.com](mailto:karimsaif010@gmail.com)
- **Live Demo:** [ASCII Shark Ocean](https://asciisharkocean.framer.website/)

---

<div align="center">

**An ocean made of characters. A little motion. A lot of personality.**

**Made with 💛 by Karim Saif**

</div>
