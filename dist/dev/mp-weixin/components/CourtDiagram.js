"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "CourtDiagram",
  props: {
    positions: {},
    players: {},
    servingTeamSide: {},
    highlightServer: { type: Boolean },
    compact: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    function getPlayerShortName(playerId) {
      const player = props.players.find((p) => p.id === playerId);
      return player ? player.number || player.name.slice(0, 2) : "?";
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(getPlayerShortName(_ctx.positions[3])),
        b: _ctx.highlightServer && false ? 1 : "",
        c: common_vendor.t(getPlayerShortName(_ctx.positions[2])),
        d: common_vendor.t(getPlayerShortName(_ctx.positions[1])),
        e: common_vendor.t(getPlayerShortName(_ctx.positions[4])),
        f: common_vendor.t(getPlayerShortName(_ctx.positions[0])),
        g: _ctx.highlightServer
      }, _ctx.highlightServer ? {} : {}, {
        h: _ctx.compact ? 1 : ""
      });
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-75dced7b"]]);
wx.createComponent(Component);
