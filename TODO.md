- RAM / perf in electron
- overlay sometimes needs a long time to appear? Same for the "loading window" (might be better to use an always on top non-overlay window to have it appear sooner, and don't flag it as "ready" until the overlay is ready?)

- "tab" in BG should only work for premium users
- when user is logged in: hashedEmails (https://dev.overwolf.com/ow-electron/monetization/advertising/user-identity/) (to be tested)
- overlay default size on smaller resolutions is too big?

- lazy loading for services?
- ow installer
- support for non-premium users
    - CMP
    - link other account

- improve the "time to first BG sim result in the UI"
  - DONE: boardsVisible→paint 2742ms p50 → 1270ms p50 (−54%), N=4 — see knowledge/bg-first-sim-latency.md
  - round 2: GameEvents FIFO flush on battle-start + receive-time stamp; visible→kickoff p50 703ms (best samples 158–269ms)
  - live: window.bgsSimLatencyStats() after fakeGame
