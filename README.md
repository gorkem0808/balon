# KORGEM Panda & Pig — Balloon Fun Arcade

Professional layered HTML5 arcade game prepared for GitHub Pages.

## Game flow

1. Attract/demo mode displays **PLEASE INSERT COIN**.
2. Press **C** to add a credit.
3. Press **SPACE** to start.
4. A large balloon rises from either basket.
5. Press **A** for the panda/left basket or **L** for the pig/right basket.
6. A correct hit adds score, pops the balloon, triggers confetti and a short character celebration.
7. A wrong side triggers a wrong-basket sound/reaction.
8. Final seconds use a warning sound.
9. **GAME OVER** is shown, then the game returns to **PLEASE INSERT COIN** demo mode.

## Keyboard

- `C` — Insert coin
- `SPACE` — Start game
- `A` — Left / Panda basket
- `L` — Right / Pig basket
- `P` — Pause / resume
- `F8` — Service settings
- `F11` — Full screen

## Professional visual layers

The approved carnival scene is the base visual. Runtime motion is split into independent DOM layers: Ferris-wheel motion, clouds, blinking lights, flags, decorative balloons, ambient confetti, character reaction overlays, eye/blink overlays, gameplay balloons, basket foreground overlays, hit/confetti effects and HUD/UI.

## F8 service settings

Game timing, scoring, balloon size/speed, fullscreen behavior, visual effects, master/music/voice/effects volumes and individual event volumes are stored in browser `localStorage`.

## GitHub Pages

Upload the **contents of this folder** to the repository root. In **Settings → Pages**, choose:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/(root)`

The project uses relative paths and requires no build step.

> Browser note: music/voice playback starts after the first user interaction due to browser autoplay rules.
