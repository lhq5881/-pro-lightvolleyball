module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1781105330897, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.initUniAppXHarmonyPlugin = exports.initUniAppJsEngineDom1CssPlugin = exports.transformExtApiVueFile = exports.transformVue = exports.genClassName = void 0;
const plugins_1 = require("./plugins");
exports.default = () => {
    if (process.env.UNI_UTS_PLATFORM === 'app-android' &&
        process.env.UNI_APP_X_DOM2 === 'true') {
        return (0, plugins_1.initAndroidDom2)();
    }
    return process.env.UNI_UTS_PLATFORM === 'app-android'
        ? (0, plugins_1.initAndroid)()
        : process.env.UNI_UTS_PLATFORM === 'app-ios'
            ? (0, plugins_1.initIOS)()
            : [];
};
var uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
Object.defineProperty(exports, "genClassName", { enumerable: true, get: function () { return uni_cli_shared_1.genUTSClassName; } });
// transformVue 被内部仓库 vuejs-core 使用，编译android框架内置组件了
var main_1 = require("./plugins/android/uvue/sfc/main");
Object.defineProperty(exports, "transformVue", { enumerable: true, get: function () { return main_1.transformMain; } });
var extApiComponents_1 = require("./extApiComponents");
Object.defineProperty(exports, "transformExtApiVueFile", { enumerable: true, get: function () { return extApiComponents_1.transformExtApiVueFile; } });
var plugin_1 = require("./plugins/js/plugin");
Object.defineProperty(exports, "initUniAppJsEngineDom1CssPlugin", { enumerable: true, get: function () { return plugin_1.initUniAppJsEngineDom1CssPlugin; } });
var harmony_1 = require("./plugins/harmony");
Object.defineProperty(exports, "initUniAppXHarmonyPlugin", { enumerable: true, get: function () { return harmony_1.init; } });

}, function(modId) {var map = {"./plugins":1781105330898,"./extApiComponents":1781105330937,"./plugins/harmony":1781105330940}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330898, function(require, module, exports) {

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initIOS = exports.initAndroid = exports.initAndroidDom2 = void 0;
const android_dom2_1 = require("./android-dom2");
const android_1 = require("./android");
const ios_1 = require("./ios");
function initAndroidDom2() {
    Promise.resolve().then(() => __importStar(require('./errorReporting')));
    return (0, android_dom2_1.init)();
}
exports.initAndroidDom2 = initAndroidDom2;
function initAndroid() {
    Promise.resolve().then(() => __importStar(require('./errorReporting')));
    return (0, android_1.init)();
}
exports.initAndroid = initAndroid;
function initIOS() {
    Promise.resolve().then(() => __importStar(require('./errorReporting')));
    return (0, ios_1.init)();
}
exports.initIOS = initIOS;

}, function(modId) { var map = {"./android-dom2":1781105330899,"./android":1781105330908,"./ios":1781105330928,"./errorReporting":1781105330935}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330899, function(require, module, exports) {

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const path = __importStar(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const vueCompilerDom = __importStar(require("@vue/compiler-dom"));
const uniCliShared = __importStar(require("@dcloudio/uni-cli-shared"));
const css_1 = require("../dom2/css");
const extApiPages_1 = require("../js/extApiPages");
const mainUTS_1 = require("../js/mainUTS");
const manifestJson_1 = require("../js/manifestJson");
const pagesJson_1 = require("../js/pagesJson");
const plugin_1 = require("../js/plugin");
const utils_1 = require("../utils");
const plugin_2 = require("./plugin");
function init() {
    const isDom2 = process.env.UNI_APP_X_DOM2 === 'true';
    return [
        ...(isDom2 ? [(0, css_1.uniAppCssPrePlugin)()] : []),
        ...((0, uni_cli_shared_1.isNormalCompileTarget)()
            ? [(0, uni_cli_shared_1.uniWorkersPlugin)(), (0, uni_cli_shared_1.uniDecryptUniModulesPlugin)()]
            : []),
        (0, uni_cli_shared_1.uniHBuilderXConsolePlugin)('uni.__log__'),
        (0, uni_cli_shared_1.uniUTSAppUniModulesPlugin)({
            x: true,
            isSingleThread: process.env.UNI_APP_X_SINGLE_THREAD !== 'false',
            extApis: (0, uni_cli_shared_1.parseUniExtApiNamespacesOnce)(process.env.UNI_UTS_PLATFORM, process.env.UNI_UTS_TARGET_LANGUAGE),
        }),
        (0, uni_cli_shared_1.uniEasycomPlugin)({ exclude: uni_cli_shared_1.UNI_EASYCOM_EXCLUDE }),
        (0, plugin_1.createUniAppJsEnginePlugin)('app-android')(),
        ...(process.env.UNI_COMPILE_TARGET === 'ext-api'
            ? [(0, uni_cli_shared_1.uniUniModulesExtApiPlugin)()]
            : process.env.UNI_COMPILE_TARGET === 'uni_modules'
                ? [(0, uni_cli_shared_1.uniEncryptUniModulesAssetsPlugin)(), (0, uni_cli_shared_1.uniEncryptUniModulesPlugin)()]
                : [
                    (0, mainUTS_1.uniAppJsEngineMainPlugin)(),
                    (0, manifestJson_1.uniAppManifestPlugin)('app-android'),
                    (0, pagesJson_1.uniAppPagesPlugin)(),
                ]),
        (0, uni_cli_shared_1.uniUTSUVueJavaScriptPlugin)(),
        (0, uni_cli_shared_1.resolveUTSCompiler)().uts2js({
            dom2: isDom2,
            platform: 'app-android',
            inputDir: process.env.UNI_INPUT_DIR,
            version: process.env.UNI_COMPILER_VERSION,
            cacheRoot: path.resolve(process.env.UNI_APP_X_CACHE_DIR, '.uts2js/cache'),
            sourceMap: (0, uni_cli_shared_1.enableSourceMap)(),
            sharedDataLibName: isDom2 ? utils_1.SHARED_DATA_LIB_NAME : undefined,
            sharedData: (0, uni_cli_shared_1.initUts2jsSharedDataOptions)(),
            modules: {
                vueCompilerDom,
                uniCliShared,
            },
            workers: {
                resolve: () => {
                    return (0, uni_cli_shared_1.getWorkers)();
                },
            },
        }),
        ...(isDom2 ? [(0, uni_cli_shared_1.uniSharedDataPlugin)()] : []),
        ...(process.env.UNI_COMPILE_EXT_API_TYPE === 'pages'
            ? [(0, extApiPages_1.replaceExtApiPagePaths)()]
            : []),
        ...(isDom2 ? [(0, css_1.uniAppCssPlugin)()] : []),
        ...((0, uni_cli_shared_1.isNormalCompileTarget)()
            ? [(0, uni_cli_shared_1.uniStatsPlugin)(), (0, plugin_2.uniAppXAndroidEnginePlugin)()]
            : []),
    ];
}
exports.init = init;

}, function(modId) { var map = {"../js/extApiPages":1781105330901,"../js/mainUTS":1781105330902,"./plugin":1781105330907}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330901, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceExtApiPagePaths = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const path_1 = __importDefault(require("path"));
function replaceExtApiPagePaths() {
    const pagePaths = (0, uni_cli_shared_1.getUniXPagePaths)();
    const systemPagePaths = pagePaths.reduce((acc, pagePath) => {
        acc['/' + pagePath] = `uni:${path_1.default.basename(pagePath)}`;
        return acc;
    }, {});
    return {
        name: 'uni:replace-page-paths',
        generateBundle(_, bundle) {
            if (Object.keys(systemPagePaths).length) {
                Object.keys(bundle).forEach((key) => {
                    if (key.endsWith('.js')) {
                        const chunk = bundle[key];
                        let newCode = chunk.code;
                        Object.keys(systemPagePaths).forEach((path) => {
                            if (newCode.includes(path)) {
                                newCode = newCode.replace(new RegExp(path, 'g'), systemPagePaths[path]);
                            }
                        });
                        chunk.code = newCode;
                    }
                });
            }
        },
    };
}
exports.replaceExtApiPagePaths = replaceExtApiPagePaths;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330902, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppJsEngineMainPlugin = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function uniAppJsEngineMainPlugin() {
    const mainUTS = (0, uni_cli_shared_1.resolveMainPathOnce)(process.env.UNI_INPUT_DIR);
    return {
        name: 'uni:app-main',
        apply: 'build',
        async transform(code, id) {
            if ((0, uni_cli_shared_1.normalizePath)(id) === mainUTS) {
                const styleIsolationCode = process.env.UNI_APP_STYLE_ISOLATION_VERSION === '2' &&
                    process.env.UNI_APP_X_DOM2 !== 'true'
                    ? 'enableStyleIsolation();\n'
                    : '';
                return {
                    code: `
import './${uni_cli_shared_1.MANIFEST_JSON_UTS}'
import './${uni_cli_shared_1.PAGES_JSON_UTS}'
${styleIsolationCode}const __global__ = typeof globalThis === 'undefined' ? Function('return this')() : globalThis
__global__.__uniX = true
${code}
${process.env.UNI_UTS_PLATFORM === 'app-harmony'
                        ? '__global__.__mount__ = () => {createApp().app.mount("#app");}'
                        : 'createApp().app.mount("#app");'}
`,
                    map: {
                        mappings: '',
                    },
                };
            }
        },
    };
}
exports.uniAppJsEngineMainPlugin = uniAppJsEngineMainPlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330907, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppXAndroidEnginePlugin = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function uniAppXAndroidEnginePlugin() {
    const { compileVaporApp, getKotlinCompilerServer } = (0, uni_cli_shared_1.resolveUTSCompiler)();
    const compilerServer = getKotlinCompilerServer();
    if (!compilerServer) {
        throw new Error(`项目使用了uts插件，正在安装 uts Android 运行扩展...`);
    }
    const outputDir = process.env.UNI_OUTPUT_DIR;
    const uvueOutputDir = (0, uni_cli_shared_1.uvueOutDir)('app-android');
    const { UKF } = (0, uni_cli_shared_1.requireUniHelpers)();
    return {
        name: 'uni:app-x-android',
        async writeBundle() {
            if (!compilerServer) {
                return;
            }
            if (process.env.UNI_APP_X_DOM2_CPP_CHANGED === 'true' ||
                process.env.UNI_APP_X_DOM2_KT_CHANGED === 'true') {
                const { changed, files } = UKF();
                await compileVaporApp({
                    filename: 'index.kt',
                    changed: changed,
                    chunks: files,
                    inputDir: uvueOutputDir,
                    outputDir: outputDir,
                });
            }
        },
    };
}
exports.uniAppXAndroidEnginePlugin = uniAppXAndroidEnginePlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330908, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const pre_1 = require("./pre");
const plugin_1 = require("./plugin");
const css_1 = require("./css");
const mainUTS_1 = require("./mainUTS");
const manifestJson_1 = require("./manifestJson");
const pagesJson_1 = require("./pagesJson");
const uvue_1 = require("./uvue");
const unicloud_1 = require("./unicloud");
function init() {
    const isDom2 = process.env.UNI_APP_X_DOM2 === 'true';
    return [
        (0, css_1.uniAppCssPrePlugin)(),
        ...((0, uni_cli_shared_1.isNormalCompileTarget)()
            ? [
                (0, uni_cli_shared_1.uniWorkersPlugin)(),
                require('@dcloudio/uni-console/lib/uni.plugin.js')(),
                (0, uni_cli_shared_1.uniDecryptUniModulesPlugin)(),
            ]
            : []),
        (0, pre_1.uniPrePlugin)(),
        ...((0, uni_cli_shared_1.isNormalCompileTarget)()
            ? [
                (0, uni_cli_shared_1.uniUTSAppUniModulesPlugin)({
                    x: true,
                    isSingleThread: process.env.UNI_APP_X_SINGLE_THREAD !== 'false',
                    extApis: (0, uni_cli_shared_1.parseUniExtApiNamespacesOnce)(process.env.UNI_UTS_PLATFORM, process.env.UNI_UTS_TARGET_LANGUAGE),
                }),
            ]
            : []),
        // 重要：比如放到 uniAppPlugin 之前
        ...(isDom2 ? [(0, uni_cli_shared_1.uniSharedDataPlugin)()] : []),
        (0, plugin_1.uniAppPlugin)(),
        ...(process.env.UNI_COMPILE_TARGET === 'ext-api'
            ? [(0, uni_cli_shared_1.uniUniModulesExtApiPlugin)()]
            : process.env.UNI_COMPILE_TARGET === 'uni_modules'
                ? [(0, uni_cli_shared_1.uniEncryptUniModulesPlugin)()]
                : [
                    // 需要放到 uniAppPlugin 之后(TSC模式无需)，让 uniAppPlugin 先 emit 出真实的 main.uts，然后 MainPlugin 再返回仅包含 import 的 js code
                    (0, mainUTS_1.uniAppMainPlugin)(),
                    (0, manifestJson_1.uniAppManifestPlugin)(),
                    (0, pagesJson_1.uniAppPagesPlugin)(),
                ]),
        (0, css_1.uniAppCssPlugin)(),
        // 解决所有的src引入
        (0, uni_cli_shared_1.uniViteSfcSrcImportPlugin)({ onlyVue: false }),
        (0, uvue_1.uniAppUVuePlugin)(),
        (0, unicloud_1.uniCloudPlugin)(),
    ];
}
exports.init = init;

}, function(modId) { var map = {"./pre":1781105330909,"./css":1781105330911,"./mainUTS":1781105330917,"./uvue":1781105330921,"./unicloud":1781105330926}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330909, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniPrePlugin = void 0;
const path_1 = __importDefault(require("path"));
const debug_1 = __importDefault(require("debug"));
const pluginutils_1 = require("@rollup/pluginutils");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const debugPreJs = (0, debug_1.default)('uni:pre-js');
const debugPreHtml = (0, debug_1.default)('uni:pre-html');
// const debugPreJsTry = debug('uni:pre-js-try')
const PRE_HTML_EXTNAME = ['.vue', '.uvue'];
const PRE_JS_EXTNAME = ['.json', '.css', '.uts', '.ts'].concat(PRE_HTML_EXTNAME);
function uniPrePlugin(options = {}) {
    const filter = (0, pluginutils_1.createFilter)(options.include, options.exclude);
    const preJsFile = uni_cli_shared_1.preUVueJs;
    const preHtmlFile = uni_cli_shared_1.preUVueHtml;
    return {
        name: 'uni:pre-android',
        enforce: 'pre',
        transform(code, id) {
            if (!filter(id)) {
                return;
            }
            const { filename } = (0, uni_cli_shared_1.parseVueRequest)(id);
            const extname = path_1.default.extname(filename);
            const isHtml = PRE_HTML_EXTNAME.includes(extname);
            const isJs = PRE_JS_EXTNAME.includes(extname);
            const isPre = isHtml || isJs;
            if (isPre) {
                // debugPreJsTry(id)
            }
            const hasEndif = isPre && code.includes('#endif');
            if (!hasEndif) {
                return;
            }
            if (isHtml) {
                code = preHtmlFile(code, id);
                debugPreHtml(id);
            }
            if (isJs) {
                code = preJsFile(code, id);
                debugPreJs(id);
            }
            return {
                code,
                map: {
                    mappings: '',
                },
            };
        },
    };
}
exports.uniPrePlugin = uniPrePlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330911, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppCssPlugin = exports.uniAppCssPrePlugin = void 0;
const path_1 = __importDefault(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const uni_nvue_styler_1 = require("@dcloudio/uni-nvue-styler");
const descriptorCache_1 = require("./uvue/descriptorCache");
const utils_1 = require("../utils");
const utils_2 = require("./utils");
function uniAppCssPrePlugin() {
    const name = 'uni:app-uvue-css-pre';
    const descriptorOptions = {
        ...(0, descriptorCache_1.getResolvedOptions)(),
        sourceMap: false,
    };
    const mainPath = (0, uni_cli_shared_1.resolveMainPathOnce)(process.env.UNI_INPUT_DIR);
    return {
        name,
        // 需要提前，因为unocss会在configResolved读取vite:css-post插件
        // 所以需要在它之前做替换
        enforce: 'pre',
        apply: 'build',
        configResolved(config) {
            (0, uni_cli_shared_1.removePlugins)(['vite:css', 'vite:css-post'], config);
            const uvueCssPostPlugin = (0, uni_cli_shared_1.cssPostPlugin)(config, {
                isJsCode: true,
                platform: process.env.UNI_PLATFORM,
                includeComponentCss: false,
                chunkCssFilename(id) {
                    const { filename } = (0, uni_cli_shared_1.parseVueRequest)(id);
                    if (filename === mainPath) {
                        // 合并到App
                        return `App.uvue.style.uts`;
                    }
                    if ((0, utils_1.isVue)(filename)) {
                        return (0, uni_cli_shared_1.normalizeNodeModules)((path_1.default.isAbsolute(filename)
                            ? path_1.default.relative(process.env.UNI_INPUT_DIR, filename)
                            : filename) + '.style.uts');
                    }
                },
                async chunkCssCode(filename, cssCode) {
                    cssCode = (0, uni_cli_shared_1.parseAssets)(config, cssCode);
                    const { code, messages } = await (0, uni_nvue_styler_1.parse)(cssCode, {
                        filename,
                        logLevel: 'ERROR',
                        mapOf: '_uM',
                        padStyleMapOf: '_pS',
                        chunk: 100,
                        type: 'uvue',
                        platform: process.env.UNI_UTS_PLATFORM,
                        trim: true,
                    });
                    messages.forEach((message) => {
                        if (message.type === 'error') {
                            (0, uni_cli_shared_1.onCompileLog)('error', { name: 'CSSError', message: message.text }, cssCode, filename, {
                                plugin: 'uni:app-uvue-css',
                                line: message.line,
                                column: message.column,
                            });
                        }
                    });
                    const fileName = filename.replace('.style.uts', '');
                    const className = (0, utils_2.genUVueClassName)(fileName, descriptorOptions.classNamePrefix);
                    return `export const ${className}Styles = ${code}`;
                },
            });
            // 增加 css plugins
            // TODO 加密插件
            (0, uni_cli_shared_1.insertBeforePlugin)((0, uni_cli_shared_1.cssPlugin)(config, {
                isAndroidX: true,
                getDescriptor: (filename) => {
                    return (0, descriptorCache_1.getDescriptor)(filename, descriptorOptions, false);
                },
            }), name, config);
            const plugins = config.plugins;
            const index = plugins.findIndex((p) => p.name === 'uni:app-uvue');
            plugins.splice(index, 0, uvueCssPostPlugin);
        },
    };
}
exports.uniAppCssPrePlugin = uniAppCssPrePlugin;
function uniAppCssPlugin() {
    let resolvedConfig;
    return {
        name: 'uni:app-uvue-css',
        apply: 'build',
        configResolved(config) {
            resolvedConfig = config;
        },
        async transform(source, filename) {
            if (!uni_cli_shared_1.cssLangRE.test(filename) || uni_cli_shared_1.commonjsProxyRE.test(filename)) {
                return;
            }
            if (filename.endsWith('__uno.css')) {
                return;
            }
            if (source.includes('#endif')) {
                source = (0, uni_cli_shared_1.preUVueCss)(source, filename);
            }
            source = (0, uni_cli_shared_1.parseAssets)(resolvedConfig, source);
            // 仅做校验使用
            const { messages } = await (0, uni_nvue_styler_1.parse)(source, {
                filename,
                logLevel: 'WARNING',
                map: true,
                ts: true,
                noCode: true,
                type: 'uvue',
                platform: process.env.UNI_UTS_PLATFORM,
            });
            messages.forEach((message) => {
                if (message.type === 'warning') {
                    // 拆分成多行，第一行输出信息（有颜色），后续输出错误代码+文件行号
                    (0, uni_cli_shared_1.onCompileLog)('warn', { name: 'CSSWarning', message: message.text }, source, filename, {
                        plugin: 'uni:app-uvue-css',
                        line: message.line,
                        column: message.column,
                    });
                }
            });
            return {
                code: source,
                map: {
                    mappings: '',
                },
            };
        },
    };
}
exports.uniAppCssPlugin = uniAppCssPlugin;

}, function(modId) { var map = {"./uvue/descriptorCache":1781105330912}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330912, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSrcDescriptor = exports.getSrcDescriptor = exports.getDescriptor = exports.createDescriptor = exports.cache = exports.getResolvedOptions = void 0;
const fs_1 = __importDefault(require("fs"));
const crypto_1 = require("crypto");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const utils_1 = require("../utils");
const script_1 = require("./sfc/script");
function getResolvedOptions() {
    const options = {
        root: process.env.UNI_INPUT_DIR,
        sourceMap: (0, uni_cli_shared_1.enableSourceMap)(),
        // eslint-disable-next-line no-restricted-globals
        compiler: require('@vue/compiler-sfc'),
        targetLanguage: process.env.UNI_UTS_TARGET_LANGUAGE,
        genDefaultAs: script_1.scriptIdentifier,
    };
    if (process.env.UNI_COMPILE_TARGET === 'ext-api') {
        options.classNamePrefix = 'Uni';
    }
    return options;
}
exports.getResolvedOptions = getResolvedOptions;
exports.cache = new Map();
function createDescriptor(filename, source, { root, sourceMap, compiler, }) {
    // ensure the path is normalized in a way that is consistent inside
    // project (relative to root) and on different systems.
    const relativeFilename = (0, utils_1.parseUTSRelativeFilename)(filename, root);
    // 传入normalizedPath是为了让sourcemap记录的是相对路径
    const { descriptor, errors } = compiler.parse(source, {
        filename: relativeFilename,
        sourceMap,
    });
    descriptor.relativeFilename = relativeFilename;
    // 重置为绝对路径
    descriptor.filename = filename;
    descriptor.id = getHash(relativeFilename);
    exports.cache.set(filename, descriptor);
    return { descriptor, errors };
}
exports.createDescriptor = createDescriptor;
function getDescriptor(filename, options, createIfNotFound = true) {
    if (exports.cache.has(filename)) {
        return exports.cache.get(filename);
    }
    if (createIfNotFound) {
        const { descriptor, errors } = createDescriptor(filename, (0, uni_cli_shared_1.preUVueJs)((0, uni_cli_shared_1.preUVueHtml)(fs_1.default.readFileSync(filename, 'utf-8'), filename), filename), options);
        if (errors.length) {
            throw errors[0];
        }
        return descriptor;
    }
}
exports.getDescriptor = getDescriptor;
function getSrcDescriptor(filename) {
    return exports.cache.get(filename);
}
exports.getSrcDescriptor = getSrcDescriptor;
function setSrcDescriptor(filename, entry) {
    exports.cache.set(filename, entry);
}
exports.setSrcDescriptor = setSrcDescriptor;
function getHash(text) {
    return (0, crypto_1.createHash)('sha256').update(text).digest('hex').substring(0, 8);
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330917, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppMainPlugin = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const utils_1 = require("./utils");
function uniAppMainPlugin() {
    const mainUTS = (0, uni_cli_shared_1.resolveMainPathOnce)(process.env.UNI_INPUT_DIR);
    return {
        name: 'uni:app-main',
        apply: 'build',
        async transform(code, id) {
            if ((0, uni_cli_shared_1.normalizePath)(id) === mainUTS) {
                code = await (0, utils_1.parseImports)(code, (0, utils_1.createTryResolve)(id, this.resolve.bind(this)));
                return {
                    code: `import './${uni_cli_shared_1.MANIFEST_JSON_UTS}';import './${uni_cli_shared_1.PAGES_JSON_UTS}';${code}`,
                    map: {
                        mappings: '',
                    },
                };
            }
        },
    };
}
exports.uniAppMainPlugin = uniAppMainPlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330921, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppUVuePlugin = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const shared_1 = require("@vue/shared");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const descriptorCache_1 = require("./descriptorCache");
const utils_1 = require("../utils");
const utils_2 = require("../../utils");
const style_1 = require("./code/style");
const main_1 = require("./sfc/main");
function uniAppUVuePlugin() {
    const options = (0, descriptorCache_1.getResolvedOptions)();
    const appVue = (0, uni_cli_shared_1.resolveAppVue)(process.env.UNI_INPUT_DIR);
    function isAppVue(id) {
        return (0, uni_cli_shared_1.normalizePath)(id) === appVue;
    }
    return {
        name: 'uni:app-uvue',
        apply: 'build',
        async resolveId(id) {
            // serve sub-part requests (*?vue) as virtual modules
            if ((0, uni_cli_shared_1.parseVueRequest)(id).query.vue) {
                return id;
            }
        },
        load(id) {
            const { filename, query } = (0, uni_cli_shared_1.parseVueRequest)(id);
            // select corresponding block for sub-part virtual modules
            if (query.vue) {
                if (query.src) {
                    return fs_extra_1.default.readFileSync(filename, 'utf-8');
                }
                const descriptor = (0, descriptorCache_1.getDescriptor)(filename, options);
                let block;
                if (query.type === 'style') {
                    block = descriptor.styles[query.index];
                }
                else if (query.index != null) {
                    block = descriptor.customBlocks[query.index];
                }
                if (block) {
                    return {
                        code: block.content,
                        map: block.map,
                    };
                }
            }
        },
        async transform(code, id) {
            const { filename, query } = (0, uni_cli_shared_1.parseVueRequest)(id);
            if (!(0, utils_2.isVue)(filename)) {
                return;
            }
            if (!query.vue) {
                // main request
                return (0, main_1.transformMain)((0, utils_1.transformUniCloudMixinDataCom)(code), filename, {
                    ...options,
                    componentType: isAppVue(filename)
                        ? 'app'
                        : query.type === 'page'
                            ? 'page'
                            : 'component',
                }, this);
            }
            else {
                // sub block request
                const descriptor = query.src
                    ? (0, descriptorCache_1.getSrcDescriptor)(filename)
                    : (0, descriptorCache_1.getDescriptor)(filename, options);
                if (query.type === 'style') {
                    return (0, style_1.transformStyle)(code, descriptor, Number(query.index), options, this, filename);
                }
            }
        },
        generateBundle(_, bundle) {
            // 遍历vue文件，填充style，尽量减少全局变量
            Object.keys(bundle).forEach((name) => {
                const file = bundle[name];
                if (file &&
                    file.type === 'asset' &&
                    isVueFile(file.fileName) &&
                    (0, shared_1.isString)(file.source)) {
                    let fileName = (0, uni_cli_shared_1.normalizePath)(file.fileName);
                    if (process.env.UNI_APP_X_TSC === 'true') {
                        fileName = fileName.replace('.ts', '');
                    }
                    const className = (0, utils_1.genUVueClassName)(fileName, options.classNamePrefix);
                    const classNameComment = `/*${className}Styles*/`;
                    if (file.source.includes(classNameComment)) {
                        const styleAssetName = fileName + '.style.uts';
                        const styleAsset = bundle[styleAssetName];
                        if (styleAsset &&
                            styleAsset.type === 'asset' &&
                            (0, shared_1.isString)(styleAsset.source)) {
                            file.source = file.source.replace(classNameComment, styleAsset.source.replace('export ', ''));
                            delete bundle[styleAssetName];
                        }
                    }
                }
            });
        },
    };
}
exports.uniAppUVuePlugin = uniAppUVuePlugin;
function isVueFile(filename) {
    return (filename.endsWith('.uvue') ||
        filename.endsWith('.vue') ||
        filename.endsWith('.uvue.ts') ||
        filename.endsWith('.vue.ts'));
}

}, function(modId) { var map = {"./descriptorCache":1781105330912}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330926, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniCloudPlugin = void 0;
const path_1 = __importDefault(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const utils_1 = require("./utils");
const uniCloudSpaceList = (0, utils_1.getUniCloudSpaceList)();
function uniCloudPlugin() {
    if (!(process.env.UNI_COMPILE_TARGET === 'ext-api' &&
        process.env.UNI_APP_NEXT_WORKSPACE)) {
        (0, uni_cli_shared_1.addUTSEasyComAutoImports)((0, uni_cli_shared_1.normalizePath)(path_1.default.resolve((0, uni_cli_shared_1.resolveComponentsLibPath)(), 'unicloud-db', 'index.uts')), ['mixinDatacom', 'uniCloudMixinDatacom']);
    }
    return {
        name: 'uni:app-unicloud',
        apply: 'build',
        generateBundle(_, bundle) {
            if (uniCloudSpaceList.length === 0) {
                return;
            }
            if (bundle[(0, utils_1.ENTRY_FILENAME)()]) {
                const inputDir = process.env.UNI_INPUT_DIR;
                const platform = process.env.UNI_UTS_PLATFORM;
                const isSecureNetworkEnabled = (0, uni_cli_shared_1.isEnableSecureNetwork)(inputDir, platform);
                const asset = bundle[(0, utils_1.ENTRY_FILENAME)()];
                asset.source =
                    asset.source +
                        `
export class UniCloudConfig extends io.dcloud.unicloud.InternalUniCloudConfig {
    override isDev : boolean = ${process.env.NODE_ENV === 'development' ? 'true' : 'false'}
    override spaceList : string = ${JSON.stringify(JSON.stringify(uniCloudSpaceList.map((item) => {
                            const itemCopy = { ...item };
                            delete itemCopy.workspaceFolder;
                            return itemCopy;
                        })))}
    override debuggerInfo ?: string = ${JSON.stringify(process.env.UNICLOUD_DEBUG || null)}
    override secureNetworkEnable : boolean = ${JSON.stringify(isSecureNetworkEnabled || false)}
    override secureNetworkConfig ?: string = ${JSON.stringify(process.env.UNI_SECURE_NETWORK_CONFIG || '[]')}
    constructor() { super() }
}
`;
            }
        },
    };
}
exports.uniCloudPlugin = uniCloudPlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330928, function(require, module, exports) {

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const path = __importStar(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const vueCompilerDom = __importStar(require("@vue/compiler-dom"));
const uniCliShared = __importStar(require("@dcloudio/uni-cli-shared"));
const plugin_1 = require("../js/plugin");
const mainUTS_1 = require("../js/mainUTS");
const manifestJson_1 = require("../js/manifestJson");
const pagesJson_1 = require("../js/pagesJson");
const extApiPages_1 = require("../js/extApiPages");
const css_1 = require("../dom2/css");
const utils_1 = require("../utils");
const plugin_2 = require("./plugin");
function init() {
    const isDom2 = process.env.UNI_APP_X_DOM2 === 'true';
    return [
        ...(isDom2 ? [(0, css_1.uniAppCssPrePlugin)()] : []),
        ...((0, uni_cli_shared_1.isNormalCompileTarget)()
            ? [(0, uni_cli_shared_1.uniWorkersPlugin)(), (0, uni_cli_shared_1.uniDecryptUniModulesPlugin)()]
            : []),
        (0, uni_cli_shared_1.uniHBuilderXConsolePlugin)('uni.__log__'),
        // 非 isNormalCompileTarget 时（ext-api模式），仍需要编译 uni_modules 获取 js code
        (0, uni_cli_shared_1.uniUTSAppUniModulesPlugin)({
            x: true,
            isSingleThread: process.env.UNI_APP_X_SINGLE_THREAD !== 'false',
            extApis: (0, uni_cli_shared_1.parseUniExtApiNamespacesOnce)(process.env.UNI_UTS_PLATFORM, process.env.UNI_UTS_TARGET_LANGUAGE),
        }),
        (0, uni_cli_shared_1.uniEasycomPlugin)({ exclude: uni_cli_shared_1.UNI_EASYCOM_EXCLUDE }),
        (0, plugin_1.createUniAppJsEnginePlugin)('app-ios')(),
        ...(process.env.UNI_COMPILE_TARGET === 'ext-api'
            ? [(0, uni_cli_shared_1.uniUniModulesExtApiPlugin)()]
            : process.env.UNI_COMPILE_TARGET === 'uni_modules'
                ? [(0, uni_cli_shared_1.uniEncryptUniModulesAssetsPlugin)(), (0, uni_cli_shared_1.uniEncryptUniModulesPlugin)()]
                : [
                    (0, mainUTS_1.uniAppJsEngineMainPlugin)(),
                    (0, manifestJson_1.uniAppManifestPlugin)('app-ios'),
                    (0, pagesJson_1.uniAppPagesPlugin)(),
                ]),
        (0, uni_cli_shared_1.uniUTSUVueJavaScriptPlugin)(),
        (0, uni_cli_shared_1.resolveUTSCompiler)().uts2js({
            dom2: isDom2,
            platform: 'app-ios',
            inputDir: process.env.UNI_INPUT_DIR,
            version: process.env.UNI_COMPILER_VERSION,
            cacheRoot: path.resolve(process.env.UNI_APP_X_CACHE_DIR, '.uts2js/cache'),
            sourceMap: (0, uni_cli_shared_1.enableSourceMap)(),
            sharedDataLibName: isDom2 ? utils_1.SHARED_DATA_LIB_NAME : undefined,
            sharedData: (0, uni_cli_shared_1.initUts2jsSharedDataOptions)(),
            modules: {
                vueCompilerDom,
                uniCliShared,
            },
            workers: {
                resolve: () => {
                    return (0, uni_cli_shared_1.getWorkers)();
                },
            },
        }),
        ...(isDom2 ? [(0, uni_cli_shared_1.uniSharedDataPlugin)()] : []),
        ...(process.env.UNI_COMPILE_EXT_API_TYPE === 'pages'
            ? [(0, extApiPages_1.replaceExtApiPagePaths)()]
            : []),
        ...(isDom2 ? [(0, css_1.uniAppCssPlugin)()] : []),
        ...((0, uni_cli_shared_1.isNormalCompileTarget)() ? [(0, uni_cli_shared_1.uniStatsPlugin)()] : []),
        ...(isDom2 && (0, uni_cli_shared_1.isNormalCompileTarget)() ? [(0, plugin_2.uniAppXIOSEnginePlugin)()] : []),
    ];
}
exports.init = init;

}, function(modId) { var map = {"../js/mainUTS":1781105330902,"../js/extApiPages":1781105330901,"./plugin":1781105330934}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330934, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppXIOSEnginePlugin = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function uniAppXIOSEnginePlugin() {
    const { getSwiftCompilerServer } = (0, uni_cli_shared_1.resolveUTSCompiler)();
    const compilerServer = getSwiftCompilerServer();
    if (!compilerServer) {
        throw new Error(`项目使用了uts插件，正在安装 uts iOS 运行扩展...`);
    }
    if (compilerServer.checkEnv) {
        const { code, msg } = compilerServer.checkEnv();
        if (code) {
            console.error(msg);
        }
    }
    const appId = (0, uni_cli_shared_1.parseManifestJsonOnce)(process.env.UNI_INPUT_DIR).appid || uni_cli_shared_1.DEFAULT_APPID;
    return {
        name: 'uni:app-x-ios',
        async writeBundle() {
            if (!compilerServer) {
                return;
            }
            if (process.env.UNI_APP_X_DOM2_CPP_CHANGED === 'true') {
                const res = await compilerServer.compileCpp({
                    appId,
                    projectPath: process.env.UNI_INPUT_DIR,
                    cppPath: process.env.UNI_APP_X_DOM2_CPP_DIR,
                });
                if (res.code) {
                    console.error(res.msg);
                }
            }
        },
    };
}
exports.uniAppXIOSEnginePlugin = uniAppXIOSEnginePlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330935, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const https_1 = __importDefault(require("https"));
const crypto_1 = __importDefault(require("crypto"));
const SERVER_HOST = 'uacer.dcloud.net.cn';
const SERVER_PATH = '/http/error-report-x';
const EXCLUDE_ERROR_LIST = [
    'uni-app-compiler',
    'Error: ENOENT: no such file or directory',
];
function getMacHash() {
    let mac = '';
    const network = os_1.default.networkInterfaces();
    for (const key in network) {
        const array = network[key];
        for (let i = 0; i < array.length; i++) {
            const item = array[i];
            if (!item.family || (item.mac && item.mac === '00:00:00:00:00:00')) {
                continue;
            }
            if (
            // Node < v18
            typeof item.family === 'string' &&
                (item.family === 'IPv4' || item.family === 'IPv6')) {
                mac = item.mac;
                break;
            }
            else if (
            // Node >= v18
            typeof item.family === 'number' &&
                (item.family === 4 || item.family === 6)) {
                mac = item.mac;
                break;
            }
        }
    }
    return crypto_1.default.createHash('md5').update(mac).digest('hex');
}
const CacheList = [];
function shouldReport(err = '') {
    try {
        const errMsg = err.toString();
        const errorIndex = EXCLUDE_ERROR_LIST.findIndex((item) => errMsg.includes(item));
        if (errorIndex >= 0) {
            return false;
        }
        // 目前简单的上报逻辑为：错误信息中包含@dcloudio包名
        if (errMsg.includes('@dcloudio') &&
            !errMsg.includes('Errors compiling template')) {
            return true;
        }
    }
    catch (e) { }
    return false;
}
function report(type, err) {
    if (!shouldReport(err)) {
        return;
    }
    if (typeof err === 'object') {
        try {
            err = err.toString();
        }
        catch (e) { }
    }
    const UNI_INPUT_DIR_REG = new RegExp(process.env.UNI_INPUT_DIR, 'ig');
    const UNI_CLI_CONTEXT_REG = new RegExp(process.env.UNI_CLI_CONTEXT, 'ig');
    err = err.replace(UNI_INPUT_DIR_REG, 'UNI_INPUT_DIR');
    err = err.replace(UNI_CLI_CONTEXT_REG, 'UNI_CLI_CONTEXT');
    const data = JSON.stringify({
        di: getMacHash(),
        np: process.platform,
        nv: process.version,
        cp: process.env.UNI_PLATFORM,
        cv: process.env.UNI_COMPILER_VERSION,
        hx: process.env.UNI_COMPILER_VERSION_TYPE,
        et: type,
        em: err,
    });
    const dataHash = crypto_1.default.createHash('md5').update(data).digest('hex');
    if (CacheList.includes(dataHash)) {
        return;
    }
    CacheList.push(dataHash);
    setTimeout(() => {
        const req = https_1.default.request({
            hostname: SERVER_HOST,
            port: 443,
            path: SERVER_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
        });
        req.write(data);
        req.end();
    }, 10);
}
global.__error_reporting__ = report;
process
    .on('unhandledRejection', (reason, p) => {
    global.__error_reporting__('unhandledRejection', reason);
    console.log(reason);
})
    .on('uncaughtException', (err) => {
    global.__error_reporting__('uncaughtException', err.stack);
    console.log(err);
});

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330937, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformExtApiVueFile = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const uni_nvue_styler_1 = require("@dcloudio/uni-nvue-styler");
const main_1 = require("./plugins/android/uvue/sfc/main");
/**
 * 需要需要确保 vue 文件是处理过条件编译的
 * @param platform
 * @param vueFileName
 * @returns
 */
async function transformExtApiVueFile(platform, // | 'app-harmony',
vueFileName) {
    vueFileName = (0, uni_cli_shared_1.normalizePath)(vueFileName);
    (0, uni_cli_shared_1.initPreContext)(platform === 'app-android' || platform === 'app-ios' ? 'app' : platform, process.env.UNI_CUSTOM_CONTEXT, platform, true);
    const code = (0, fs_extra_1.readFileSync)(vueFileName, 'utf8');
    if ((0, uni_cli_shared_1.isUniAppXAndroidNative)(platform)) {
        return transformAppAndroidExtApiComponent(vueFileName, code);
    }
    else if (platform === 'app-ios' || platform === 'app-android') {
        return transformAppIosExtApiComponent(vueFileName, code);
    }
}
exports.transformExtApiVueFile = transformExtApiVueFile;
async function transformAppAndroidExtApiComponent(vueFileName, code) {
    const result = await (0, main_1.transformMain)(code, vueFileName, {
        root: (0, path_1.dirname)(vueFileName),
        targetLanguage: 'kotlin',
        classNamePrefix: 'Uni',
        genDefaultAs: '__sfc__',
        sourceMap: false,
        componentType: 'component',
    });
    if (!result) {
        return null;
    }
    const { errors, uts, descriptor } = result;
    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }
    const componentName = (0, path_1.basename)(vueFileName).split('.')[0];
    const styleCode = await parseAppAndroidVueStyle(componentName, vueFileName, descriptor.styles.length > 0 ? descriptor.styles[0].content : '');
    return uts.replace(`/*${(0, uni_cli_shared_1.genUTSClassName)(componentName, 'Uni')}ComponentStyles*/`, styleCode);
}
async function transformAppIosExtApiComponent(vueFileName, code) {
    // TODO 编译vue为一个独立的js文件
}
async function parseAppAndroidVueStyle(name, vueFileName, cssCode) {
    if (!cssCode) {
        return `const ${(0, uni_cli_shared_1.genUTSClassName)(name, 'Uni')}ComponentStyles = []`;
    }
    const { code, messages } = await (0, uni_nvue_styler_1.parse)(cssCode, {
        filename: vueFileName,
        logLevel: 'ERROR',
        map: true,
        ts: true,
        type: 'uvue',
        platform: 'app-android',
    });
    if (messages.length) {
        messages.forEach((m) => {
            console.error(m);
        });
    }
    return `const ${(0, uni_cli_shared_1.genUTSClassName)(name, 'Uni')}ComponentStyles = [${code}]`;
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330940, function(require, module, exports) {

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const path = __importStar(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const vueCompilerDom = __importStar(require("@vue/compiler-dom"));
const uniCliShared = __importStar(require("@dcloudio/uni-cli-shared"));
const plugin_1 = require("../js/plugin");
const mainUTS_1 = require("../js/mainUTS");
const manifestJson_1 = require("../js/manifestJson");
const pagesJson_1 = require("../js/pagesJson");
const extApiPages_1 = require("../js/extApiPages");
const css_1 = require("../dom2/css");
const utils_1 = require("../utils");
function init() {
    const isDom2 = process.env.UNI_APP_X_DOM2 === 'true';
    return [
        ...(isDom2 ? [(0, css_1.uniAppCssPrePlugin)()] : []),
        ...((0, uni_cli_shared_1.isNormalCompileTarget)()
            ? [(0, uni_cli_shared_1.uniWorkersPlugin)(), (0, uni_cli_shared_1.uniDecryptUniModulesPlugin)()]
            : []),
        (0, uni_cli_shared_1.uniHBuilderXConsolePlugin)('uni.__f__'),
        // 非 isNormalCompileTarget 时（ext-api模式），仍需要编译 uni_modules 获取 js code
        (0, uni_cli_shared_1.uniUTSAppUniModulesPlugin)({
            x: true,
            isSingleThread: process.env.UNI_APP_X_SINGLE_THREAD !== 'false',
            extApis: (0, uni_cli_shared_1.parseUniExtApiNamespacesOnce)(process.env.UNI_UTS_PLATFORM, process.env.UNI_UTS_TARGET_LANGUAGE),
        }),
        (0, uni_cli_shared_1.uniEasycomPlugin)({ exclude: uni_cli_shared_1.UNI_EASYCOM_EXCLUDE }),
        (0, plugin_1.createUniAppJsEnginePlugin)('app-harmony')(),
        ...(process.env.UNI_COMPILE_TARGET === 'ext-api'
            ? [(0, uni_cli_shared_1.uniUniModulesExtApiPlugin)()]
            : process.env.UNI_COMPILE_TARGET === 'uni_modules'
                ? [(0, uni_cli_shared_1.uniEncryptUniModulesAssetsPlugin)(), (0, uni_cli_shared_1.uniEncryptUniModulesPlugin)()]
                : [
                    (0, mainUTS_1.uniAppJsEngineMainPlugin)(),
                    (0, manifestJson_1.uniAppManifestPlugin)('app-harmony'),
                    (0, pagesJson_1.uniAppPagesPlugin)(),
                ]),
        (0, uni_cli_shared_1.uniUTSUVueJavaScriptPlugin)(),
        (0, uni_cli_shared_1.resolveUTSCompiler)().uts2js({
            dom2: isDom2,
            platform: 'app-harmony',
            inputDir: process.env.UNI_INPUT_DIR,
            version: process.env.UNI_COMPILER_VERSION,
            cacheRoot: path.resolve(process.env.UNI_APP_X_CACHE_DIR, '.uts2js/cache'),
            sourceMap: (0, uni_cli_shared_1.enableSourceMap)(),
            sharedDataLibName: isDom2 ? utils_1.SHARED_DATA_LIB_NAME : undefined,
            sharedData: (0, uni_cli_shared_1.initUts2jsSharedDataOptions)(),
            modules: {
                vueCompilerDom,
                uniCliShared,
            },
            workers: {
                extname: '.ets',
                resolve: () => {
                    return (0, uni_cli_shared_1.getWorkers)();
                },
            },
        }),
        ...(isDom2 ? [(0, uni_cli_shared_1.uniSharedDataPlugin)()] : []),
        ...(process.env.UNI_COMPILE_EXT_API_TYPE === 'pages'
            ? [(0, extApiPages_1.replaceExtApiPagePaths)()]
            : []),
        ...(isDom2 ? [(0, css_1.uniAppCssPlugin)()] : []),
        ...((0, uni_cli_shared_1.isNormalCompileTarget)() ? [(0, uni_cli_shared_1.uniStatsPlugin)()] : []),
    ];
}
exports.init = init;

}, function(modId) { var map = {"../js/mainUTS":1781105330902,"../js/extApiPages":1781105330901}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1781105330897);
})()
//miniprogram-npm-outsideDeps=["@dcloudio/uni-cli-shared","./plugins/android/uvue/sfc/main","./plugins/js/plugin","path","@vue/compiler-dom","../dom2/css","../js/manifestJson","../js/pagesJson","../js/plugin","../utils","./plugin","./manifestJson","./pagesJson","@dcloudio/uni-console/lib/uni.plugin.js","debug","@rollup/pluginutils","@dcloudio/uni-nvue-styler","./utils","fs","crypto","./sfc/script","@vue/compiler-sfc","fs-extra","@vue/shared","../../utils","./code/style","./sfc/main","os","https"]
//# sourceMappingURL=index.js.map