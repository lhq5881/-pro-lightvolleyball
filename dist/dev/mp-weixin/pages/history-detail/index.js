"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_history = require("../../stores/history.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const historyStore = stores_history.useHistoryStore();
    const matchId = common_vendor.ref("");
    const match = common_vendor.ref(null);
    common_vendor.onLoad((options) => {
      historyStore.loadHistory();
      if (options == null ? void 0 : options.id) {
        matchId.value = options.id;
        match.value = historyStore.getMatchById(options.id) ?? null;
      }
    });
    const teamAName = common_vendor.computed(() => {
      var _a;
      return ((_a = match.value) == null ? void 0 : _a.teamA.name) ?? "队A";
    });
    const teamBName = common_vendor.computed(() => {
      var _a;
      return ((_a = match.value) == null ? void 0 : _a.teamB.name) ?? "队B";
    });
    function formatDate(timestamp) {
      const d = new Date(timestamp);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    function getDuration() {
      var _a;
      if (!((_a = match.value) == null ? void 0 : _a.endTime))
        return "进行中";
      const diff = match.value.endTime - match.value.startTime;
      const minutes = Math.floor(diff / 6e4);
      return `${minutes}分钟`;
    }
    function getPlayerDisplay(player) {
      return player.number ? `${player.number} ${player.name}` : player.name;
    }
    function getPointProgress(set) {
      if (!set.pointLog || set.pointLog.length === 0)
        return [];
      const progress = [];
      let a = 0, b = 0;
      for (const team of set.pointLog) {
        if (team === "A")
          a++;
        else
          b++;
        progress.push(`${a}:${b}`);
      }
      return progress;
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: match.value
      }, match.value ? {
        b: common_vendor.t(formatDate(match.value.startTime)),
        c: common_vendor.t(getDuration()),
        d: common_vendor.t(teamAName.value),
        e: common_vendor.t(match.value.setsWonA),
        f: common_vendor.t(match.value.setsWonB),
        g: common_vendor.t(teamBName.value),
        h: common_vendor.f(match.value.setScores, (set, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: common_vendor.t(set.scoreA),
            c: set.winner === "A" ? 1 : "",
            d: common_vendor.t(set.scoreB),
            e: set.winner === "B" ? 1 : "",
            f: common_vendor.t(set.winner === "A" ? teamAName.value : teamBName.value),
            g: index
          };
        }),
        i: common_vendor.f(match.value.setScores, (set, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: common_vendor.t(set.scoreA),
            c: common_vendor.t(set.scoreB),
            d: common_vendor.f(getPointProgress(set), (score, pi, i1) => {
              return {
                a: common_vendor.t(score),
                b: pi,
                c: set.pointLog[pi] === "A" ? 1 : "",
                d: set.pointLog[pi] === "B" ? 1 : ""
              };
            }),
            e: "detail-" + index
          };
        }),
        j: common_vendor.f(match.value.setScores, (set, index, i0) => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
          return common_vendor.e({
            a: common_vendor.t(index + 1),
            b: (_b = (_a = set.teamAPlayers) == null ? void 0 : _a.startingPlayers) == null ? void 0 : _b.length
          }, ((_d = (_c = set.teamAPlayers) == null ? void 0 : _c.startingPlayers) == null ? void 0 : _d.length) ? {
            c: common_vendor.f(set.teamAPlayers.startingPlayers, (player, k1, i1) => {
              return {
                a: common_vendor.t(getPlayerDisplay(player)),
                b: player.id
              };
            })
          } : {}, {
            d: (_f = (_e = set.teamAPlayers) == null ? void 0 : _e.subPlayers) == null ? void 0 : _f.length
          }, ((_h = (_g = set.teamAPlayers) == null ? void 0 : _g.subPlayers) == null ? void 0 : _h.length) ? {
            e: common_vendor.f(set.teamAPlayers.subPlayers, (player, k1, i1) => {
              return {
                a: common_vendor.t(getPlayerDisplay(player)),
                b: player.id
              };
            })
          } : {}, {
            f: (_j = (_i = set.teamBPlayers) == null ? void 0 : _i.startingPlayers) == null ? void 0 : _j.length
          }, ((_l = (_k = set.teamBPlayers) == null ? void 0 : _k.startingPlayers) == null ? void 0 : _l.length) ? {
            g: common_vendor.f(set.teamBPlayers.startingPlayers, (player, k1, i1) => {
              return {
                a: common_vendor.t(getPlayerDisplay(player)),
                b: player.id
              };
            })
          } : {}, {
            h: (_n = (_m = set.teamBPlayers) == null ? void 0 : _m.subPlayers) == null ? void 0 : _n.length
          }, ((_p = (_o = set.teamBPlayers) == null ? void 0 : _o.subPlayers) == null ? void 0 : _p.length) ? {
            i: common_vendor.f(set.teamBPlayers.subPlayers, (player, k1, i1) => {
              return {
                a: common_vendor.t(getPlayerDisplay(player)),
                b: player.id
              };
            })
          } : {}, {
            j: "players-" + index
          });
        }),
        k: common_vendor.t(teamAName.value),
        l: common_vendor.t(teamBName.value)
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-24143b2e"]]);
wx.createPage(MiniProgramPage);
