"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_sync = require("../../stores/sync.js");
const stores_match = require("../../stores/match.js");
const stores_indoorMatch = require("../../stores/indoor-match.js");
const stores_beachMatch = require("../../stores/beach-match.js");
const services_syncService = require("../../services/sync-service.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const syncStore = stores_sync.useSyncStore();
    const mode = common_vendor.ref("create");
    const role = common_vendor.ref("recorder");
    const inputCodes = common_vendor.ref(["", "", "", ""]);
    const focusIndex = common_vendor.ref(0);
    const selectedType = common_vendor.ref(null);
    const matchStore = common_vendor.computed(() => {
      const matchType = syncStore.matchType;
      switch (matchType) {
        case "indoor":
          return stores_indoorMatch.useIndoorMatchStore();
        case "beach":
          return stores_beachMatch.useBeachMatchStore();
        default:
          return stores_match.useMatchStore();
      }
    });
    const roomCodeChars = common_vendor.computed(() => {
      const code = syncStore.roomCode || "";
      return code.split("");
    });
    const isCodeComplete = common_vendor.computed(() => {
      return inputCodes.value.every((c) => c.length === 1);
    });
    function selectType(type) {
      selectedType.value = type;
      handleCreate();
    }
    common_vendor.onLoad(async (query) => {
      syncStore.reset();
      hasNavigated = false;
      lastStatus = "";
      lastIsLive = false;
      if (query == null ? void 0 : query.role) {
        role.value = query.role;
      }
      if ((query == null ? void 0 : query.mode) === "join") {
        mode.value = "join";
      } else {
        mode.value = "create";
      }
      startStatusPolling();
    });
    async function handleCreate() {
      if (!selectedType.value)
        return;
      try {
        await services_syncService.syncService.createRoom(selectedType.value);
      } catch {
      }
    }
    async function handleJoin() {
      const code = inputCodes.value.join("");
      try {
        await services_syncService.syncService.joinRoom(code, role.value);
      } catch {
      }
    }
    function onCodeInput(index, e) {
      var _a;
      const val = ((_a = e.detail) == null ? void 0 : _a.value) || "";
      inputCodes.value[index] = val.slice(-1);
      if (val && index < 3) {
        focusIndex.value = index + 1;
      }
    }
    let statusCheckTimer = null;
    let lastStatus = "";
    let lastIsLive = false;
    let hasNavigated = false;
    function startStatusPolling() {
      if (statusCheckTimer) {
        clearInterval(statusCheckTimer);
        statusCheckTimer = null;
      }
      statusCheckTimer = setInterval(() => {
        if (hasNavigated) {
          if (statusCheckTimer) {
            clearInterval(statusCheckTimer);
            statusCheckTimer = null;
          }
          return;
        }
        const currentStatus = syncStore.status;
        console.log("[Room] 状态轮询, status:", currentStatus, "mode:", mode.value, "hasNavigated:", hasNavigated);
        if (currentStatus === "connected" && mode.value === "create") {
          console.log("[Room] 创建者已连接，准备跳转到比赛设置");
          hasNavigated = true;
          if (statusCheckTimer) {
            clearInterval(statusCheckTimer);
            statusCheckTimer = null;
          }
          const setupUrl = getSetupUrl();
          console.log("[Room] 跳转到:", setupUrl);
          common_vendor.index.redirectTo({
            url: `${setupUrl}?sync=true&role=recorder`,
            success: () => {
              console.log("[Room] 跳转成功");
            },
            fail: (err) => {
              console.error("[Room] 跳转失败:", err);
              common_vendor.index.navigateTo({
                url: `${setupUrl}?sync=true&role=recorder`,
                success: () => console.log("[Room] navigateTo 成功"),
                fail: (err2) => console.error("[Room] navigateTo 失败:", err2)
              });
            }
          });
          return;
        }
        const currentIsLive = matchStore.value.isLive;
        console.log("[Room] 检测 isLive:", currentIsLive, "matchType:", syncStore.matchType);
        if (currentIsLive && mode.value === "join") {
          console.log("[Room] 加入者检测到比赛开始");
          hasNavigated = true;
          if (statusCheckTimer) {
            clearInterval(statusCheckTimer);
            statusCheckTimer = null;
          }
          const isFlipped = role.value === "referee1" ? "true" : "false";
          const scoringUrl = getScoringUrl();
          console.log("[Room] 跳转到:", scoringUrl);
          common_vendor.index.redirectTo({
            url: `${scoringUrl}?flipped=${isFlipped}`,
            fail: () => {
              common_vendor.index.navigateTo({ url: `${scoringUrl}?flipped=${isFlipped}` });
            }
          });
          return;
        }
        if (currentStatus !== lastStatus) {
          lastStatus = currentStatus;
          console.log("[Room] 状态变化:", currentStatus);
        }
        lastIsLive = currentIsLive;
      }, 300);
    }
    function getSetupUrl() {
      switch (selectedType.value) {
        case "indoor":
          return "/pages-indoor/match-setup/index";
        case "beach":
          return "/pages-beach/match-setup/index";
        default:
          return "/pages/match-setup/index";
      }
    }
    function getScoringUrl() {
      const matchType = syncStore.matchType || "qipai";
      switch (matchType) {
        case "indoor":
          return "/pages-indoor/scoring/index";
        case "beach":
          return "/pages-beach/scoring/index";
        default:
          return "/pages/scoring/index";
      }
    }
    common_vendor.onHide(() => {
      if (statusCheckTimer) {
        clearInterval(statusCheckTimer);
        statusCheckTimer = null;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: mode.value === "create" && !selectedType.value
      }, mode.value === "create" && !selectedType.value ? {
        b: common_vendor.o(($event) => selectType("qipai"), "73"),
        c: common_vendor.o(($event) => selectType("indoor"), "22"),
        d: common_vendor.o(($event) => selectType("beach"), "62")
      } : mode.value === "create" && selectedType.value ? common_vendor.e({
        f: common_vendor.unref(syncStore).status === "creating"
      }, common_vendor.unref(syncStore).status === "creating" ? {} : common_vendor.unref(syncStore).status === "waiting" ? {
        h: common_vendor.f(roomCodeChars.value, (char, i, i0) => {
          return {
            a: common_vendor.t(char),
            b: i
          };
        })
      } : common_vendor.unref(syncStore).status === "connected" ? {} : common_vendor.unref(syncStore).status === "error" ? {
        k: common_vendor.t(common_vendor.unref(syncStore).errorMessage),
        l: common_vendor.o(handleCreate, "a3")
      } : {}, {
        g: common_vendor.unref(syncStore).status === "waiting",
        i: common_vendor.unref(syncStore).status === "connected",
        j: common_vendor.unref(syncStore).status === "error"
      }) : {}, {
        e: mode.value === "create" && selectedType.value,
        m: mode.value === "join"
      }, mode.value === "join" ? common_vendor.e({
        n: common_vendor.unref(syncStore).status === "idle" || common_vendor.unref(syncStore).status === "error"
      }, common_vendor.unref(syncStore).status === "idle" || common_vendor.unref(syncStore).status === "error" ? common_vendor.e({
        o: common_vendor.f(4, (i, k0, i0) => {
          return {
            a: i,
            b: inputCodes.value[i - 1] || "",
            c: common_vendor.o(($event) => onCodeInput(i - 1, $event), i),
            d: focusIndex.value === i - 1
          };
        }),
        p: !isCodeComplete.value,
        q: common_vendor.o(handleJoin, "ef"),
        r: common_vendor.unref(syncStore).status === "error"
      }, common_vendor.unref(syncStore).status === "error" ? {
        s: common_vendor.t(common_vendor.unref(syncStore).errorMessage)
      } : {}) : common_vendor.unref(syncStore).status === "joining" ? {} : common_vendor.unref(syncStore).status === "connected" ? {} : {}, {
        t: common_vendor.unref(syncStore).status === "joining",
        v: common_vendor.unref(syncStore).status === "connected"
      }) : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6ec0a429"]]);
wx.createPage(MiniProgramPage);
