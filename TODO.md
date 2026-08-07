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
  - DONE: board→first paint 3503ms p50 → 562ms p50 (−84%), N=4, full bg.log — see knowledge/bg-first-sim-latency.md
  - live: window.bgsSimLatencyStats() after fakeGame
