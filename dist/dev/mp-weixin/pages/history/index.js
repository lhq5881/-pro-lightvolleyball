"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_history = require("../../stores/history.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const historyStore = stores_history.useHistoryStore();
    common_vendor.onShow(() => {
      historyStore.loadHistory();
    });
    function goToDetail(id) {
      common_vendor.index.navigateTo({ url: `/pages/history-detail/index?id=${id}` });
    }
    function deleteMatch(id) {
      common_vendor.index.showModal({
        title: "删除",
        content: "确定删除这条比赛记录？",
        success: (res) => {
          if (res.confirm) {
            historyStore.deleteMatch(id);
          }
        }
      });
    }
    function shareMatch(match) {
      const setScoresText = match.setScores.map((s) => `${s.scoreA}:${s.scoreB}`).join("、");
      const winnerName = match.winner === "A" ? match.teamA.name : match.teamB.name;
      const shareText = `【排球裁判助手】
${match.teamA.name} vs ${match.teamB.name}
局分 ${match.setsWonA}:${match.setsWonB}
各局比分：${setScoresText}
${winnerName} 获胜`;
      common_vendor.index.showShareMenu({
        withShareTicket: true,
        menus: ["shareAppMessage"]
      });
      common_vendor.index.share({
        provider: "weixin",
        scene: "WXSceneSession",
        type: 0,
        summary: shareText,
        success: () => {
          console.log("分享成功");
        },
        fail: (err) => {
          console.log("分享失败", err);
          common_vendor.index.setClipboardData({
            data: shareText,
            success: () => {
              common_vendor.index.showToast({ title: "已复制到剪贴板", icon: "success" });
            }
          });
        }
      });
    }
    function formatDate(timestamp) {
      const d = new Date(timestamp);
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    function getWinnerName(match) {
      return match.winner === "A" ? match.teamA.name : match.teamB.name;
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(historyStore).matches.length === 0
      }, common_vendor.unref(historyStore).matches.length === 0 ? {} : {
        b: common_vendor.f(common_vendor.unref(historyStore).matches, (match, k0, i0) => {
          return {
            a: common_vendor.t(formatDate(match.startTime)),
            b: common_vendor.o(($event) => shareMatch(match), match.id),
            c: common_vendor.o(($event) => deleteMatch(match.id), match.id),
            d: common_vendor.t(match.teamA.name),
            e: match.winner === "A" ? 1 : "",
            f: common_vendor.t(match.setsWonA),
            g: common_vendor.t(match.setsWonB),
            h: common_vendor.f(match.setScores, (s, i, i1) => {
              return {
                a: common_vendor.t(s.scoreA),
                b: common_vendor.t(s.scoreB),
                c: i,
                d: s.winner === "A" ? 1 : "",
                e: s.winner === "B" ? 1 : ""
              };
            }),
            i: common_vendor.t(match.teamB.name),
            j: match.winner === "B" ? 1 : "",
            k: common_vendor.t(getWinnerName(match)),
            l: match.id,
            m: common_vendor.o(($event) => goToDetail(match.id), match.id)
          };
        })
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-530ef1ab"]]);
wx.createPage(MiniProgramPage);
