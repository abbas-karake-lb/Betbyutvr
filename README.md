# Betbyut VR — Little Lives

An original, early-stage WebXR household sandbox for Meta Quest 3 and desktop browsers. Inspired by classic life-simulation gameplay. It is **not a complete Sims 1 clone**, and is not affiliated with EA or Maxis. No original Sims artwork, models, sounds, or soundtrack is included.

## Play

After GitHub Pages is enabled, the game URL is:
https://abbas-karake-lb.github.io/Betbyutvr/

Open in the Quest browser and choose **Enter VR**. Desktop mode works without a headset.

### First-time GitHub Pages setup

Repository **Settings → Pages → Build and deployment → Source → GitHub Actions**.
If the initial deployment failed before Pages was enabled, open **Actions → Test and publish game → Run workflow**. Future pushes deploy automatically.

## Implemented

- Two furnished households and an empty building plot, saved separately.
- Up to six named people per household; clothing color selection on desktop, quick-add presets in VR.
- Six needs, automatic need care, click-to-command, bounded action queues, chatting and a basic relationship score.
- Pathfinding around furniture and walls with passable doorways.
- Work shifts, wages, daily household bills, furnishing costs, resale and undo.
- 30 original build/buy items: flooring, walls, doors, windows, furnishings and plants.
- Wall cutaways, full-height walls, tabletop zoom/orbit and first-person exploration.
- Native immersive controller rays and a world-space VR menu for building, household controls and neighborhood selection.
- Smooth stick movement/turning, walk-mode teleport, tabletop scale adjustment.
- Browser-local save/autosave. No account or cross-device sync.
- Two short original synthesized musical patterns for live/build mode, enabled by user action.
- Bundled Three.js 0.180.0; no runtime CDN dependency. Static geometry merged by material for lower draw-call cost.

## Controls

| Input | Action |
|---|---|
| Click / controller trigger | Select person, use furniture, walk, or place catalog item |
| Shift-click (desktop) | Queue an action |
| Drag (desktop) | Orbit tabletop or look around in walk view |
| Wheel / + / − | Desktop zoom |
| WASD / arrow keys | Move in desktop walk view |
| R | Rotate placement (walls alternate between two grid edges) |
| Space | Pause / resume |
| Left thumbstick | Move through the scene |
| Right thumbstick left/right | Smooth turn |
| Right thumbstick up/down | Scale tabletop |
| Either grip | Bring VR menu in front of you |
| VR menu → Teleport | In walk view, point and trigger on a free square |

Building pauses simulation. There is no grab-to-move tool; sell/erase and replace furnishings. People can share a usable object; interactions restore needs but do not include detailed seated/sleeping animation. Work is simulated off-lot.

## Run locally

Use Node 22+ for tests and Python 3 for a static local server:

```sh
npm test
python3 -m http.server 8080
```

Open http://localhost:8080. A remote Quest needs HTTPS, such as GitHub Pages.

## Scope and testing limitations

This release has single-story lots, simplified low-poly people and furnishings, basic actions and needs. It does not implement the full original game's catalog, expansions, careers, aging, complex relationships, detailed interaction animations, pools, terrain editing, custom texture import, or original soundtrack. Quest hardware frame rate and comfort require on-device testing; desktop/software rendering tests cannot establish those results.

Third-party engine license: `vendor/THREE-LICENSE.txt`. Engine documentation: https://threejs.org/docs/ . Pages workflow documentation: https://github.com/actions/configure-pages .
