import getVersion from "../utils/handlers/getVersion";
import { Nexa } from "../utils/handlers/errors";
import discoveryResponses from "../../static/discovery/events";
import path from "node:path";
import fs from "node:fs";
import crypto from "crypto";
import type { Hono } from "hono";

export default function (app: Hono) {
  const logReq = (c: any) => {
    try {
      const ua = c.req.header("user-agent") || "<no-ua>";
      console.log(`[DISCOVERY] ${new Date().toISOString()} ${c.req.method} ${c.req.url} UA=${ua}`);
    } catch (e) {
      console.log("[DISCOVERY] log error", e);
    }
  };

  app.get("/fortnite/api/discovery/accessToken/*", async (c) => {
    logReq(c);
    const useragent: any = c.req.header("user-agent");
    if (!useragent) return c.json(Nexa.internal.invalidUserAgent);
    const regex = useragent.match(/\+\+Fortnite\+Release-\d+\.\d+/);
    return c.json({
      branchName: regex[0],
      appId: "Fortnite",
      token: `${crypto.randomBytes(10).toString("hex")}=`,
    });
  });

  app.post("/api/v2/discovery/surface/*", async (c) => {
    logReq(c);
    const ver = getVersion(c);
    const Normal = require(`../../static/discovery/menu.json`);
    const latestMenu = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/menu.json"), "utf8"));
    const latestBr = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/brplaylist.json"), "utf8"));
    const Latest = Array.isArray(latestMenu) ? latestMenu.concat(latestBr || []) : [latestMenu].concat(latestBr || []);

    try {
      // For S27+ include ModeSets and also inject separate Arena playlists into the Panels so clients render them
      if (ver.season >= 27) {
        const clone = JSON.parse(JSON.stringify(Normal));
        const pages = clone.Panels && clone.Panels[0] && clone.Panels[0].Pages ? clone.Panels[0].Pages[0] : null;
        const makeEntry = (obj: any) => ({ linkData: obj, lastVisited: null, linkCode: obj.mnemonic || obj.linkCode || "", isFavorite: false });

        // populate ModeSets from Latest so the surface.ModeSets contains ModeSet objects
        try {
          clone.ModeSets = {};
          Latest.forEach((p: any) => {
            if (p && p.linkType === "ModeSet" && p.mnemonic) clone.ModeSets[p.mnemonic] = p;
          });
          // Remove the Arena ModeSet object to avoid the quick "Change Mode" selector
          // while keeping other ModeSets intact. This prevents the client showing
          // the multiple-modes quick UI for Arena while preserving S26 and below behavior.
          if (clone.ModeSets && clone.ModeSets["set_arena_playlists"]) delete clone.ModeSets["set_arena_playlists"];
        } catch (e) {
          clone.ModeSets = {};
        }

        if (pages) {
          const wanted = ["playlist_showdownalt_solo", "playlist_showdownalt_duos", "playlist_showdownalt_trios"];
          wanted.forEach((mn) => {
            const exists = pages.results.find((r: any) => r.linkData && (r.linkData.mnemonic === mn || r.linkCode === mn));
            if (!exists) {
              const fromLatest = Latest.find((p: any) => p.mnemonic === mn);
              const entryObj = fromLatest || { namespace: "fn", accountId: "epic", creatorName: "Epic", mnemonic: mn, linkType: "BR:Playlist", metadata: { image_url: "", image_urls: { url_s: "", url_xs: "", url_m: "", url: "" }, matchmaking: { override_playlist: mn } }, version: 95, active: true, disabled: false };
              // set a conservative tile size hint to help the client render a nicer thumbnail
              entryObj.metadata = entryObj.metadata || {};
              if (!entryObj.metadata.tileSize) entryObj.metadata.tileSize = "medium";
              pages.results.push(makeEntry(entryObj));
            }
          });
        }

        return c.json(clone);
      }

      // older clients: return the Normal discovery payload (keeps previous behavior)
      return c.json(Normal);
    } catch (e) {
      return c.json(Normal);
    }
  });

  app.post("/api/v1/assets/Fortnite/*", async (c) => {
    const assets = {
      FortCreativeDiscoverySurface: {
        meta: {
          promotion: 26,
        },
        assets: {
          CreativeDiscoverySurface_Frontend: {
            meta: {
              revision: 32,
              headRevision: 32,
              revisedAt: "2023-04-25T19:30:52.489Z",
              promotion: 26,
              promotedAt: "2023-04-25T19:31:12.618Z",
            },
            assetData: {
              AnalyticsId: "v538",
              TestCohorts: [
                {
                  AnalyticsId: "c-1v2_v2_c727",
                  CohortSelector: "PlayerDeterministic",
                  PlatformBlacklist: [],
                  CountryCodeBlocklist: [],
                  ContentPanels: [
                    {
                      NumPages: 1,
                      AnalyticsId: "p1114",
                      PanelType: "AnalyticsList",
                      AnalyticsListName: "ByEpicNoBigBattle",
                      CuratedListOfLinkCodes: [],
                      ModelName: "",
                      PageSize: 7,
                      PlatformBlacklist: [],
                      PanelName: "ByEpicNoBigBattle6Col",
                      MetricInterval: "",
                      CountryCodeBlocklist: [],
                      SkippedEntriesCount: 0,
                      SkippedEntriesPercent: 0,
                      SplicedEntries: [],
                      PlatformWhitelist: [],
                      MMRegionBlocklist: [],
                      EntrySkippingMethod: "None",
                      PanelDisplayName: {
                        Category: "Game",
                        NativeCulture: "",
                        Namespace: "CreativeDiscoverySurface_Frontend",
                        LocalizedStrings: [],
                        bIsMinimalPatch: false,
                        NativeString: "LTMS",
                        Key: "ByEpicNoBigBattle6Col",
                      },
                      PlayHistoryType: "RecentlyPlayed",
                      bLowestToHighest: false,
                      PanelLinkCodeBlacklist: [],
                      CountryCodeAllowlist: [],
                      PanelLinkCodeWhitelist: [],
                      FeatureTags: [],
                      MMRegionAllowlist: [],
                      MetricName: "",
                    },
                    {
                      NumPages: 2,
                      AnalyticsId: "p969|88dba0c4e2af76447df43d1e31331a3d",
                      PanelType: "AnalyticsList",
                      AnalyticsListName: "EventPanel",
                      CuratedListOfLinkCodes: [],
                      ModelName: "",
                      PageSize: 25,
                      PlatformBlacklist: [],
                      PanelName: "EventPanel",
                      MetricInterval: "",
                      CountryCodeBlocklist: [],
                      SkippedEntriesCount: 0,
                      SkippedEntriesPercent: 0,
                      SplicedEntries: [],
                      PlatformWhitelist: [],
                      MMRegionBlocklist: [],
                      EntrySkippingMethod: "None",
                      PanelDisplayName: {
                        Category: "Game",
                        NativeCulture: "",
                        Namespace: "CreativeDiscoverySurface_Frontend",
                        LocalizedStrings: [],
                        bIsMinimalPatch: false,
                        NativeString: "Event LTMS",
                        Key: "EventPanel",
                      },
                      PlayHistoryType: "RecentlyPlayed",
                      bLowestToHighest: false,
                      PanelLinkCodeBlacklist: [],
                      CountryCodeAllowlist: [],
                      PanelLinkCodeWhitelist: [],
                      FeatureTags: ["col:6"],
                      MMRegionAllowlist: [],
                      MetricName: "",
                    },
                  ],
                  PlatformWhitelist: [],
                  SelectionChance: 0.1,
                  TestName: "testing",
                },
              ],
              GlobalLinkCodeBlacklist: [],
              SurfaceName: "CreativeDiscoverySurface_Frontend",
              TestName: "20.10_4/11/2022_hero_combat_popularConsole",
              primaryAssetId: "FortCreativeDiscoverySurface:CreativeDiscoverySurface_Frontend",
              GlobalLinkCodeWhitelist: [],
            },
          },
        },
      },
    };

    return c.json(assets);
  });

  app.post("/fortnite/api/game/v2/creative/discovery/surface/*", async (c) => {
    logReq(c);
    const ver = getVersion(c);
    const Normal = require(`../../static/discovery/menu.json`);
    const latestMenu = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/menu.json"), "utf8"));
    const latestBr = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/brplaylist.json"), "utf8"));
    const Latest = Array.isArray(latestMenu) ? latestMenu.concat(latestBr || []) : [latestMenu].concat(latestBr || []);

    // Version-specific discovery shaping:
    // - S27+: return Latest (ModeSets + selectors)
    // - S25-26: show Arena Solo/Duos/Trios as separate playlist tiles (first row)
    // - S23-24: show Arena Solo/Duos/Trios as separate playlist tiles (second row if possible)
    try {
      // For S27+ clients we want to show separate Arena playlist tiles (avoid only ModeSet)
      if (ver.season >= 27) {
        const clone = JSON.parse(JSON.stringify(Normal));
        const pages = clone.Panels[0].Pages[0];
        const makeEntry = (obj: any) => ({ linkData: obj, lastVisited: null, linkCode: obj.mnemonic || obj.linkCode || "", isFavorite: false });
        const removeModeSet = () => {
          const idx = pages.results.findIndex((r: any) => r.linkData && r.linkData.mnemonic === "set_arena_playlists");
          if (idx !== -1) pages.results.splice(idx, 1);
        };

        const ensurePlaylistsPresent = () => {
          const wanted = ["playlist_showdownalt_solo", "playlist_showdownalt_duos", "playlist_showdownalt_trios"];
          wanted.forEach((mn) => {
            const exists = pages.results.find((r: any) => r.linkData && r.linkData.mnemonic === mn);
            if (!exists) {
              const fromLatest = Latest.find((p: any) => p.mnemonic === mn);
              if (fromLatest) pages.results.push(makeEntry(fromLatest));
              else pages.results.push(makeEntry({ namespace: "fn", accountId: "epic", creatorName: "Epic", mnemonic: mn, linkType: "BR:Playlist", metadata: { image_url: "", matchmaking: { override_playlist: mn } }, version: 95, active: true, disabled: false }));
            }
          });
        };

        // For newer clients we also include ModeSet objects so the surface includes ModeSets:{...}
        try {
          clone.ModeSets = {};
          Latest.forEach((p: any) => {
            if (p && p.linkType === "ModeSet" && p.mnemonic) clone.ModeSets[p.mnemonic] = p;
          });
          // remove Arena ModeSet so the client doesn't show the quick "Change Mode" selector
          if (clone.ModeSets && clone.ModeSets["set_arena_playlists"]) delete clone.ModeSets["set_arena_playlists"];
        } catch (e) {
          clone.ModeSets = {};
        }

        removeModeSet();
        ensurePlaylistsPresent();
        return c.json(clone);
      }

      const clone = JSON.parse(JSON.stringify(Normal));
      const pages = clone.Panels[0].Pages[0];

      // helper to create default playlist entry
      const makeEntry = (obj: any) => ({ linkData: obj, lastVisited: null, linkCode: obj.mnemonic || obj.linkCode || "", isFavorite: false });

      // ensure no ModeSet tile when we want separate playlist tiles
      const removeModeSet = () => {
        const idx = pages.results.findIndex((r: any) => r.linkData && r.linkData.mnemonic === "set_arena_playlists");
        if (idx !== -1) pages.results.splice(idx, 1);
      };

      const ensurePlaylistsPresent = () => {
        const wanted = ["playlist_showdownalt_solo", "playlist_showdownalt_duos", "playlist_showdownalt_trios"];
        wanted.forEach((mn) => {
          const exists = pages.results.find((r: any) => r.linkData && r.linkData.mnemonic === mn);
          if (!exists) {
            const fromLatest = Latest.find((p: any) => p.mnemonic === mn);
            const entryObj = fromLatest || { namespace: "fn", accountId: "epic", creatorName: "Epic", mnemonic: mn, linkType: "BR:Playlist", metadata: { image_url: "", image_urls: { url_s: "", url_xs: "", url_m: "", url: "" }, matchmaking: { override_playlist: mn } }, version: 95, active: true, disabled: false };
            entryObj.metadata = entryObj.metadata || {};
            if (!entryObj.metadata.tileSize) entryObj.metadata.tileSize = "medium";
            pages.results.push(makeEntry(entryObj));
          }
        });
      };

      if (ver.season >= 25 && ver.season < 27) {
        // S25-26: first row - ensure separate playlists and remove ModeSet
        removeModeSet();
        ensurePlaylistsPresent();
        return c.json(clone);
      }

      if (ver.season >= 23 && ver.season < 25) {
        // S23-24: prefer second-row placement; we'll append to results (clients often display later results in second row)
        removeModeSet();
        ensurePlaylistsPresent();
        return c.json(clone);
      }

      return c.json(Normal);
    } catch (e) {
      return c.json(Normal);
    }
  });

  app.post("/api/v1/discovery/surface/*", async (c) => {
    logReq(c);
    const ver = getVersion(c);
    const Normal = require(`../../static/discovery/menu.json`);
    const latestMenu = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/menu.json"), "utf8"));
    const latestBr = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/brplaylist.json"), "utf8"));
    const Latest = Array.isArray(latestMenu) ? latestMenu.concat(latestBr || []) : [latestMenu].concat(latestBr || []);

      try {
      // For S27+ clients, return a Normal-shaped payload with separate Arena playlists injected
      if (ver.season >= 27) {
        const clone = JSON.parse(JSON.stringify(Normal));
        const pages = clone.Panels[0].Pages[0];
        const makeEntry = (obj: any) => ({ linkData: obj, lastVisited: null, linkCode: obj.mnemonic || obj.linkCode || "", isFavorite: false });
        const removeModeSet = () => {
          const idx = pages.results.findIndex((r: any) => r.linkData && r.linkData.mnemonic === "set_arena_playlists");
          if (idx !== -1) pages.results.splice(idx, 1);
        };
        const ensurePlaylistsPresent = () => {
          const wanted = ["playlist_showdownalt_solo", "playlist_showdownalt_duos", "playlist_showdownalt_trios"];
          wanted.forEach((mn) => {
            const exists = pages.results.find((r: any) => r.linkData && r.linkData.mnemonic === mn);
            if (!exists) {
              const fromLatest = Latest.find((p: any) => p.mnemonic === mn);
              const entryObj = fromLatest || { namespace: "fn", accountId: "epic", creatorName: "Epic", mnemonic: mn, linkType: "BR:Playlist", metadata: { image_url: "", image_urls: { url_s: "", url_xs: "", url_m: "", url: "" }, matchmaking: { override_playlist: mn } }, version: 95, active: true, disabled: false };
              entryObj.metadata = entryObj.metadata || {};
              if (!entryObj.metadata.tileSize) entryObj.metadata.tileSize = "medium";
              pages.results.push(makeEntry(entryObj));
            }
          });
        };

        // include ModeSets for newer clients so the surface lists ModeSets as well
        try {
          clone.ModeSets = {};
          Latest.forEach((p: any) => {
            if (p && p.linkType === "ModeSet" && p.mnemonic) clone.ModeSets[p.mnemonic] = p;
          });
          // remove Arena ModeSet so the client doesn't show the quick "Change Mode" selector
          if (clone.ModeSets && clone.ModeSets["set_arena_playlists"]) delete clone.ModeSets["set_arena_playlists"];
        } catch (e) {
          clone.ModeSets = {};
        }

        removeModeSet();
        ensurePlaylistsPresent();
        return c.json(clone);
      }

      const clone = JSON.parse(JSON.stringify(Normal));
      const pages = clone.Panels[0].Pages[0];

      const makeEntry = (obj: any) => ({ linkData: obj, lastVisited: null, linkCode: obj.mnemonic || obj.linkCode || "", isFavorite: false });
      const removeModeSet = () => {
        const idx = pages.results.findIndex((r: any) => r.linkData && r.linkData.mnemonic === "set_arena_playlists");
        if (idx !== -1) pages.results.splice(idx, 1);
      };
      const ensurePlaylistsPresent = () => {
        const wanted = ["playlist_showdownalt_solo", "playlist_showdownalt_duos", "playlist_showdownalt_trios"];
        wanted.forEach((mn) => {
          const exists = pages.results.find((r: any) => r.linkData && r.linkData.mnemonic === mn);
          if (!exists) {
            const fromLatest = Latest.find((p: any) => p.mnemonic === mn);
            if (fromLatest) pages.results.push(makeEntry(fromLatest));
            else pages.results.push(makeEntry({ namespace: "fn", accountId: "epic", creatorName: "Epic", mnemonic: mn, linkType: "BR:Playlist", metadata: { image_url: "", matchmaking: { override_playlist: mn } }, version: 95, active: true, disabled: false }));
          }
        });
      };

      if (ver.season >= 25 && ver.season < 27) {
        removeModeSet();
        ensurePlaylistsPresent();
        return c.json(clone);
      }

      if (ver.season >= 23 && ver.season < 25) {
        removeModeSet();
        ensurePlaylistsPresent();
        return c.json(clone);
      }

      return c.json(Normal);
    } catch (e) {
      return c.json(Normal);
    }
  });

  app.post("/links/api/fn/mnemonic", async (c) => {
    logReq(c);
    const ver = getVersion(c);
    const Normal = require(`../../static/discovery/menu.json`);
    const latestMenu = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/menu.json"), "utf8"));
    // also include brplaylist.json (contains set_br_playlists) so clients get ModeSet objects
    const latestBr = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/brplaylist.json"), "utf8"));
    const Latest = Array.isArray(latestMenu) ? latestMenu.concat(latestBr || []) : [latestMenu].concat(latestBr || []);

    const DefaultLinks = Normal.Panels[0].Pages[0].results.map((result: any) => result.linkData);

    // Only serve the "latest" discovery payload for season 27 and newer
    if (ver.season >= 27) {
      return c.json(Latest);
    } else {
      return c.json(DefaultLinks);
    }
  });

  app.get("/links/api/fn/mnemonic/:playlist", async (c) => {
    logReq(c);
    const playlist = c.req.param("playlist");
    const ver = getVersion(c);
    const Normal = require(`../../static/discovery/menu.json`);
    const latestMenu = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/menu.json"), "utf8"));
    const latestBr = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/brplaylist.json"), "utf8"));
    const Latest = Array.isArray(latestMenu) ? latestMenu.concat(latestBr || []) : [latestMenu].concat(latestBr || []);

    // For newer clients, look up in Latest array; older clients get the Normal menu structure
    if (ver.season >= 27) {
      // Hide/disable the Arena ModeSet object for newer clients so the quick-mode selector
      // does not appear even if the client requests the ModeSet directly.
      if (playlist === "set_arena_playlists") {
        const found = Latest.find((p: any) => p.mnemonic === playlist);
        if (found) {
          const safe = JSON.parse(JSON.stringify(found));
          safe.metadata = safe.metadata || {};
          safe.metadata.sub_link_codes = [];
          safe.active = false;
          safe.disabled = true;
          return c.json(safe);
        }
      }
      const found = Latest.find((p: any) => p.mnemonic === playlist);
      if (found) return c.json(found);
    } else {
      // search Normal (Panels -> Pages -> results[].linkData.mnemonic)
      try {
        const results = Normal.Panels[0].Pages[0].results;
        for (const r of results) {
          if (r.linkData && r.linkData.mnemonic === playlist) return c.json(r.linkData);
        }
      } catch (e) {
        // fallthrough to default
      }
    }

    return c.json({
      namespace: "fn",
      accountId: "epic",
      creatorName: "Epic",
      mnemonic: playlist,
      linkType: "BR:Playlist",
      metadata: {
        image_url: "",
        image_urls: {
          url_s: "",
          url_xs: "",
          url_m: "",
          url: "",
        },
        matchmaking: {
          override_playlist: playlist,
        },
      },
      version: 95,
      active: true,
      disabled: false,
      created: "2021-10-01T00:56:45.010Z",
      published: "2021-08-03T15:27:20.251Z",
      descriptionTags: [],
      moderationStatus: "Approved",
    });
  });

  app.get("/links/api/fn/mnemonic/:playlistId/related", async (c) => {
    logReq(c);
    const playlistId = c.req.param("playlistId");
    const ver = getVersion(c);
    const Normal = require("../../static/discovery/menu.json");
    const latestMenu = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/menu.json"), "utf8"));
    const latestBr = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "static/discovery/latest/brplaylist.json"), "utf8"));
    const Latest = Array.isArray(latestMenu) ? latestMenu.concat(latestBr || []) : [latestMenu].concat(latestBr || []);

    // default response entry for the requested playlist
    const makeEntry = (mnemonic: string) => ({
      namespace: "fn",
      accountId: "epic",
      creatorName: "Epic",
      mnemonic,
      linkType: "BR:Playlist",
      metadata: {
        image_url: "",
        image_urls: { url_s: "", url_xs: "", url_m: "", url: "" },
        matchmaking: { override_playlist: mnemonic },
      },
      version: 95,
      active: true,
      disabled: false,
      created: "2021-10-01T00:56:45.010Z",
      published: "2021-08-03T15:27:20.251Z",
      descriptionTags: [],
      moderationStatus: "Approved",
    });

    const links: any = {};
    // always include the requested playlist as a fallback
    links[playlistId] = makeEntry(playlistId);

    // map BR defaults to Arena (ShowdownAlt) equivalents so the client can switch
    const arenaMap: Record<string, string[]> = {
      playlist_defaultsolo: ["playlist_showdownalt_solo"],
      playlist_defaultduo: ["playlist_showdownalt_duos"],
      playlist_trios: ["playlist_showdownalt_trios"],
    };

    const extras = arenaMap[playlistId];
    if (extras && extras.length) {
      extras.forEach((mn) => {
        let found: any = null;
        if (ver.season >= 27) {
          // prefer the full object from Latest if available
          found = Latest.find((p: any) => p.mnemonic === mn);
        } else {
          // search Normal
          try {
            const results = Normal.Panels[0].Pages[0].results;
            const r = results.find((x: any) => x.linkData && x.linkData.mnemonic === mn);
            if (r) found = r.linkData;
          } catch (e) {
            found = null;
          }
        }

        links[mn] = found || makeEntry(mn);
      });
    }

    return c.json({ parentLinks: [], links });
  });
}
