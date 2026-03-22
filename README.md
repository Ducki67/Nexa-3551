# Nexa 3551 (fork)

This is a fork of the Nexa backend with my additions, fixes, and configuration tweaks.

<details>
<summary>Features added by me</summary>

These additions are works-in-progress; I'll continue improving them over time.

<details>
<summary>MatchMaker</summary>

- S3+ support (partial)

**Tested versions:**
- 23.10 — Works
- 23.50 — Works
- 27.11 — Works
- 24.20 - Doesnt work for now
- 25.20 - Doesnt work for now



</details>

<details>
<summary>Discovery</summary>

- Added Arena playlist support for 24.20+.
- Fixed several discovery issues and improved overall behavior.

</details>

<details>
<summary>Configs</summary>

- Added `WaterStorm` timeline config for v12.61 (Chapter 2, Season 2).
- Added MatchMaker `port` and `ip` configs.
- Added `DevelopmentServerPort` config.

</details>

</details>

### About Nexa

The original Nexa project provides a private-server backend implementation. The original README is included below for reference.

<details>
<summary>Original info / About Nexa</summary>

If you want to contribute, fork this repository and make a pull request.

Join the Discord server for support: https://discord.gg/nexa-1229545680641462282

> Warning: We do not accept any liability for misuse. Epic Games prohibits the presence of cosmetics not purchased from the official item shop on private servers; using those may breach the game's EULA.

## TODO

- Complete MCP

## Installation

Install Bun: https://bun.sh/docs/installation

Install dependencies:

```bash
bun install
```

Run the server (development):

```bash
bun run src/index.ts
```

## APIs

Used APIs:

- <img src="https://api.nitestats.com/v1/static/ns-logo.png" width="23" alt="NiteStats logo"> [NiteStats API](https://nitestats.com/)


## Credits

- [Hybrid](https://github.com/HybridFNBR) — Discovery for 26.30+ and MOTD
- [Zetax](https://github.com/simplyzetax) — Error responses

</details>