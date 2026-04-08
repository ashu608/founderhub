// These files re-export from pages/index.jsx
// This keeps App.jsx imports clean: import Home from "@/pages/Home"

// src/pages/Home.jsx — just copy/use the Home export from index.jsx
// For a real project, split pages/index.jsx into individual files.
// The combined file above works perfectly for the MVP build.

// To split later:
//   mv src/pages/index.jsx src/pages/_all.jsx
//   Create individual files that import from _all.jsx:
//
//   src/pages/Home.jsx:
//     export { Home as default } from "./_all";
//
//   src/pages/IdeaDetail.jsx:
//     export { IdeaDetail as default } from "./_all";
//   ... etc

// For now, update App.jsx imports to use the named exports:
export { IdeaDetail, Submit, Profile, Dashboard, Battles, Leaderboard, Search, NotFound } from "./index";