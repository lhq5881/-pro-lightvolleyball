module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1781105330946, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const vue_1 = require("./vue");
const nvue_1 = require("./nvue");
const plugin_1 = require("./plugin");
exports.default = () => {
    return [
        (0, plugin_1.uniAppPlugin)({
            renderer: process.env.UNI_RENDERER,
            appService: process.env.UNI_RENDERER_NATIVE === 'appService',
        }),
        (0, uni_cli_shared_1.uniUTSAppUniModulesPlugin)({
            x: false,
            isSingleThread: false,
            extApis: (0, uni_cli_shared_1.parseUniExtApiNamespacesOnce)(process.env.UNI_UTS_PLATFORM, process.env.UNI_UTS_TARGET_LANGUAGE),
        }),
        ...(process.env.UNI_COMPILER === 'nvue'
            ? (0, nvue_1.initNVuePlugins)()
            : (0, vue_1.initVuePlugins)()),
    ];
};

}, function(modId) {var map = {"./vue":1781105330947,"./nvue":1781105330959,"./plugin":1781105330973}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330947, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.initVuePlugins = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const template_1 = require("../plugins/template");
const manifestJson_1 = require("../plugins/manifestJson");
const confusion_1 = require("./plugins/confusion");
const mainJs_1 = require("./plugins/mainJs");
const pagesJson_1 = require("./plugins/pagesJson");
const renderjs_1 = require("./plugins/renderjs");
const plugin_1 = require("./plugin");
function initUniCssScopedPluginFilter(inputDir) {
    const styleIsolation = (0, uni_cli_shared_1.getAppStyleIsolation)((0, uni_cli_shared_1.parseManifestJsonOnce)(inputDir));
    if (styleIsolation === 'shared') {
        return;
    }
    if (styleIsolation === 'isolated') {
        // isolated: 对所有非 App.vue 增加 scoped
        return (id) => (0, uni_cli_shared_1.isVueSfcFile)(id) && !(0, uni_cli_shared_1.isAppVue)(id);
    }
    // apply-shared: 仅对非页面组件增加 scoped
    return (id) => (0, uni_cli_shared_1.isVueSfcFile)(id) && !(0, uni_cli_shared_1.isAppVue)(id) && !(0, uni_cli_shared_1.isUniPageFile)(id, inputDir);
}
function initVuePlugins() {
    const plugins = [
        (0, uni_cli_shared_1.uniEasycomPlugin)({ exclude: uni_cli_shared_1.UNI_EASYCOM_EXCLUDE }),
        (0, uni_cli_shared_1.uniHBuilderXConsolePlugin)(),
    ];
    if (process.env.UNI_COMPILE_TARGET === 'ext-api') {
        plugins.push((0, uni_cli_shared_1.uniViteInjectPlugin)('uni:app-inject', (0, uni_cli_shared_1.initAppProvide)()), (0, renderjs_1.uniRenderjsPlugin)(), (0, plugin_1.uniAppVuePlugin)(), (0, uni_cli_shared_1.uniUniModulesExtApiPlugin)());
    }
    else if (process.env.UNI_COMPILE_TARGET === 'uni_modules') {
        plugins.push((0, uni_cli_shared_1.uniViteInjectPlugin)('uni:app-inject', (0, uni_cli_shared_1.initAppProvide)()), (0, renderjs_1.uniRenderjsPlugin)(), (0, plugin_1.uniAppVuePlugin)(), (0, uni_cli_shared_1.uniEncryptUniModulesPlugin)());
    }
    else {
        plugins.push((0, mainJs_1.uniMainJsPlugin)(), (0, manifestJson_1.uniManifestJsonPlugin)(), (0, pagesJson_1.uniPagesJsonPlugin)(), (0, uni_cli_shared_1.uniViteInjectPlugin)('uni:app-inject', (0, uni_cli_shared_1.initAppProvide)()), (0, renderjs_1.uniRenderjsPlugin)(), (0, template_1.uniTemplatePlugin)(), (0, uni_cli_shared_1.uniStatsPlugin)(), (0, plugin_1.uniAppVuePlugin)(), (0, confusion_1.uniConfusionPlugin)());
        const filter = initUniCssScopedPluginFilter(process.env.UNI_INPUT_DIR);
        if (filter) {
            plugins.unshift((0, uni_cli_shared_1.uniCssScopedPlugin)({ filter }));
        }
    }
    return plugins;
}
exports.initVuePlugins = initVuePlugins;

}, function(modId) { var map = {"../plugins/template":1781105330948,"../plugins/manifestJson":1781105330950,"./plugins/confusion":1781105330951,"./plugins/mainJs":1781105330952,"./plugins/pagesJson":1781105330953}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330948, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniTemplatePlugin = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const utils_1 = require("../utils");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function uniTemplatePlugin({ renderer, } = {}) {
    let outputDir;
    return {
        name: 'uni:app-template',
        enforce: 'post',
        configResolved() {
            outputDir = process.env.UNI_OUTPUT_DIR;
            if (renderer !== 'native') {
                fs_extra_1.default.copySync((0, uni_cli_shared_1.resolveBuiltIn)('@dcloudio/uni-app-plus/dist/uni-app-view.umd.js'), path_1.default.resolve(outputDir, 'uni-app-view.umd.js'), {
                    overwrite: true,
                });
            }
            fs_extra_1.default.copySync(utils_1.templateDir, outputDir, {
                overwrite: true,
                filter(src) {
                    if (renderer === 'native') {
                        if (src.includes('__uniappquill') ||
                            src.includes('__uniappautomator')) {
                            return false;
                        }
                    }
                    return !src.includes('__uniappview.html');
                },
            });
        },
    };
}
exports.uniTemplatePlugin = uniTemplatePlugin;

}, function(modId) { var map = {"../utils":1781105330949}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330949, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nvueOutDir = exports.templateDir = void 0;
const path_1 = __importDefault(require("path"));
exports.templateDir = path_1.default.resolve(__dirname, '../lib/template/');
function nvueOutDir() {
    return path_1.default.join(process.env.UNI_OUTPUT_DIR, '../.nvue');
}
exports.nvueOutDir = nvueOutDir;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330950, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniManifestJsonPlugin = void 0;
const path_1 = __importDefault(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function uniManifestJsonPlugin() {
    return (0, uni_cli_shared_1.defineUniManifestJsonPlugin)((opts) => {
        const inputDir = process.env.UNI_INPUT_DIR;
        return {
            name: 'uni:app-manifest-json',
            enforce: 'pre',
            transform(code, id) {
                if (!opts.filter(id)) {
                    return;
                }
                this.addWatchFile(path_1.default.resolve(inputDir, 'manifest.json'));
                (0, uni_cli_shared_1.getLocaleFiles)(path_1.default.resolve(inputDir, 'locale')).forEach((filepath) => {
                    this.addWatchFile(filepath);
                });
                const manifestJson = (0, uni_cli_shared_1.normalizeAppManifestJson)((0, uni_cli_shared_1.parseJson)(code, false, id), (0, uni_cli_shared_1.parsePagesJsonOnce)(inputDir, process.env.UNI_PLATFORM));
                // 生成一个空的 app-config.js，兼容基座已有规范
                this.emitFile({
                    fileName: uni_cli_shared_1.APP_CONFIG,
                    type: 'asset',
                    source: '(function(){})();',
                });
                this.emitFile({
                    fileName: `manifest.json`,
                    type: 'asset',
                    source: JSON.stringify(manifestJson, null, 2),
                });
                return {
                    code: '',
                    map: null,
                };
            },
        };
    });
}
exports.uniManifestJsonPlugin = uniManifestJsonPlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330951, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniConfusionPlugin = void 0;
const path_1 = __importDefault(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function uniConfusionPlugin() {
    const inputDir = process.env.UNI_INPUT_DIR;
    const hasConfusion = process.env.NODE_ENV === 'production' && (0, uni_cli_shared_1.hasConfusionFile)(inputDir);
    return {
        name: 'uni:app-vue-confusion',
        enforce: 'post',
        apply: 'build',
        config() {
            if (!hasConfusion) {
                return;
            }
            return {
                build: {
                    rollupOptions: {
                        output: {
                            format: process.env.UNI_APP_CODE_SPLITTING ? 'amd' : 'cjs',
                            manualChunks(id) {
                                if ((0, uni_cli_shared_1.isConfusionFile)(path_1.default.relative(inputDir, id))) {
                                    return (0, uni_cli_shared_1.removeExt)(uni_cli_shared_1.APP_CONFUSION_FILENAME);
                                }
                            },
                        },
                    },
                },
            };
        },
        generateBundle(_, bundle) {
            if (!hasConfusion) {
                return;
            }
            const appConfusionChunk = bundle[uni_cli_shared_1.APP_CONFUSION_FILENAME];
            if (!appConfusionChunk) {
                return;
            }
            appConfusionChunk.code = wrapperAppConfusionCode(appConfusionChunk.code);
            const appServiceChunk = bundle[uni_cli_shared_1.APP_SERVICE_FILENAME];
            if (!appServiceChunk) {
                return;
            }
            appServiceChunk.code = wrapperAppServiceCode(appServiceChunk.code);
        },
    };
}
exports.uniConfusionPlugin = uniConfusionPlugin;
function replaceRequireVueCode(code) {
    // 目前会生成require("@vue/shared"); 理论上摇树之后，是不应该有的，后续排查为什么
    return code
        .replace(/require\(['"]vue['"]\)/gi, `$cjs_require$('vue')`)
        .replace(/require\(['"]@vue\/shared['"]\)/gi, `$cjs_require$('@vue/shared')`);
}
function replaceRequireAppConfusionCode(code) {
    return code.replace(new RegExp(`require\\(['"].\\/${uni_cli_shared_1.APP_CONFUSION_FILENAME}['"]\\)`, 'gi'), `$cjs_require$('./${uni_cli_shared_1.APP_CONFUSION_FILENAME}')`);
}
function wrapperAppServiceCode(code) {
    return replaceRequireAppConfusionCode(replaceRequireVueCode(code));
}
function wrapperAppConfusionCode(code) {
    return `function $cjs_require$(name){if(name==='vue'){return Vue;}if(name==='./${uni_cli_shared_1.APP_CONFUSION_FILENAME}'){return $appConfusion$;}};const $appConfusion$ = {};(function(exports){${replaceRequireVueCode(code)}})($appConfusion$);
`;
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330952, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniMainJsPlugin = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function uniMainJsPlugin() {
    return (0, uni_cli_shared_1.defineUniMainJsPlugin)((opts) => {
        return {
            name: 'uni:app-vue-main-js',
            enforce: 'pre',
            transform(code, id) {
                if (opts.filter(id)) {
                    code = code.includes('createSSRApp')
                        ? createApp(code)
                        : createLegacyApp(code);
                    return {
                        code: `import './${uni_cli_shared_1.PAGES_JSON_JS}';` + code,
                        map: { mappings: '' },
                    };
                }
            },
        };
    });
}
exports.uniMainJsPlugin = uniMainJsPlugin;
function createApp(code) {
    return `${code.replace('createSSRApp', 'createVueApp as createSSRApp')};\nconst {app:__app__,Vuex:__Vuex__,Pinia:__Pinia__}=createApp();uni.Vuex=__Vuex__;uni.Pinia=__Pinia__;__app__.provide('__globalStyles', __uniConfig.styles);__app__._component.mpType='app';__app__._component.render=()=>{};__app__.mount("#app");`;
}
function createLegacyApp(code) {
    return `function createApp(rootComponent,rootProps){rootComponent.mpTye='app';rootComponent.render=()=>{};const app=createVueApp(rootComponent,rootProps);app.provide('__globalStyles', __uniConfig.styles);const oldMount=app.mount;app.mount=(container)=>{const appVm=oldMount.call(app,container);return appVm;};return app;};${code.replace('createApp', 'createVueApp')}`;
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330953, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniPagesJsonPlugin = void 0;
const path_1 = __importDefault(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const esbuild_1 = require("../../nvue/plugins/esbuild");
function uniPagesJsonPlugin() {
    return (0, uni_cli_shared_1.defineUniPagesJsonPlugin)((opts) => {
        return {
            name: 'uni:app-vue-pages-json',
            enforce: 'pre',
            transform(code, id) {
                if (!opts.filter(id)) {
                    return;
                }
                this.addWatchFile(path_1.default.resolve(process.env.UNI_INPUT_DIR, 'pages.json'));
                (0, uni_cli_shared_1.getLocaleFiles)(path_1.default.resolve(process.env.UNI_INPUT_DIR, 'locale')).forEach((filepath) => {
                    this.addWatchFile(filepath);
                });
                const pagesJson = (0, uni_cli_shared_1.normalizePagesJson)(code, process.env.UNI_PLATFORM);
                pagesJson.pages.forEach((page) => {
                    if (!page.style.isNVue) {
                        this.addWatchFile(path_1.default.resolve(process.env.UNI_INPUT_DIR, page.path + '.vue'));
                    }
                });
                this.emitFile({
                    fileName: uni_cli_shared_1.APP_CONFIG_SERVICE,
                    type: 'asset',
                    source: (0, uni_cli_shared_1.normalizeAppConfigService)(pagesJson, (0, uni_cli_shared_1.parseManifestJsonOnce)(process.env.UNI_INPUT_DIR)),
                });
                return {
                    code: `import './${uni_cli_shared_1.MANIFEST_JSON_JS}'\n` +
                        (0, uni_cli_shared_1.normalizeAppPagesJson)(pagesJson, process.env.UNI_PLATFORM),
                    map: { mappings: '' },
                };
            },
            generateBundle(_, bundle) {
                const outputFile = bundle[uni_cli_shared_1.APP_CONFIG_SERVICE];
                if (outputFile && outputFile.type === 'asset') {
                    // 补充 nvue styles
                    ;
                    outputFile.source = (0, esbuild_1.wrapperNVueAppStyles)(outputFile.source);
                }
            },
        };
    });
}
exports.uniPagesJsonPlugin = uniPagesJsonPlugin;

}, function(modId) { var map = {"../../nvue/plugins/esbuild":1781105330954}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330954, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapperNVueAppStyles = exports.uniEsbuildPlugin = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const debug_1 = __importDefault(require("debug"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const utils_1 = require("../../utils");
const utils_2 = require("../utils");
const appCss_1 = require("./appCss");
const debugEsbuild = (0, debug_1.default)('uni:app-nvue-esbuild');
const emittedHashMap = new WeakMap();
function uniEsbuildPlugin({ appService, }) {
    let resolvedConfig;
    let buildOptions;
    const nvueOutputDir = (0, utils_1.nvueOutDir)();
    const outputDir = process.env.UNI_OUTPUT_DIR;
    let isFirst = true;
    return {
        name: 'uni:app-nvue-esbuild',
        enforce: 'post',
        configResolved(config) {
            buildOptions = {
                format: 'iife',
                target: 'es6',
                minify: config.build.minify ? true : false,
                banner: {
                    js: `"use weex:vue";
${uni_cli_shared_1.polyfillCode}`,
                },
                bundle: true,
                write: false,
                plugins: [esbuildGlobalPlugin((0, utils_2.esbuildGlobals)(appService))],
                supported: { bigint: true },
            };
            resolvedConfig = config;
            emittedHashMap.set(resolvedConfig, new Map());
        },
        async writeBundle(_, bundle) {
            const entryPoints = [];
            const assets = [];
            Object.keys(bundle).forEach((name) => {
                const chunk = bundle[name];
                if (chunk.type === 'chunk' &&
                    chunk.facadeModuleId &&
                    chunk.facadeModuleId.endsWith('.nvue')) {
                    entryPoints.push(name);
                }
                else if (chunk.type === 'asset') {
                    assets.push(name);
                }
            });
            // 仅 nvueOutputDir 时 copy
            if (!appService) {
                assets.forEach((name) => {
                    fs_extra_1.default.copySync(path_1.default.resolve(nvueOutputDir, name), path_1.default.resolve(outputDir, name), { overwrite: false });
                });
            }
            if (!entryPoints.length) {
                return;
            }
            const emittedHash = emittedHashMap.get(resolvedConfig);
            const changedFiles = [];
            if (buildAppCss()) {
                changedFiles.push(uni_cli_shared_1.APP_CONFIG_SERVICE);
            }
            debugEsbuild('start', entryPoints.length, entryPoints);
            for (const filename of entryPoints) {
                await buildNVuePage(filename, buildOptions).then((code) => {
                    const outputFileHash = (0, uni_cli_shared_1.hash)(code);
                    if (emittedHash.get(filename) !== outputFileHash) {
                        changedFiles.push(filename);
                        emittedHash.set(filename, outputFileHash);
                        return fs_extra_1.default.outputFile(path_1.default.resolve(outputDir, filename), code);
                    }
                });
            }
            if (!isFirst && changedFiles.length) {
                process.env[changedFiles.includes(uni_cli_shared_1.APP_CONFIG_SERVICE)
                    ? 'UNI_APP_CHANGED_FILES'
                    : 'UNI_APP_CHANGED_PAGES'] = JSON.stringify(changedFiles);
            }
            debugEsbuild('end');
            isFirst = false;
        },
    };
}
exports.uniEsbuildPlugin = uniEsbuildPlugin;
/**
 * 将 nvue 全局 css 样式注入 app-config-service.js
 * @returns
 */
function buildAppCss() {
    const appCssJsFilename = path_1.default.join((0, utils_1.nvueOutDir)(), appCss_1.APP_CSS_JS);
    if (!fs_extra_1.default.existsSync(appCssJsFilename)) {
        return;
    }
    const appCssJsCode = fs_extra_1.default.readFileSync(appCssJsFilename, 'utf8');
    const appCssJsFn = new Function('module', 
    // vite build.target为esnext时, 生成的代码没有export default
    appCssJsCode.includes('export default')
        ? appCssJsCode.replace(`export default`, `module.exports=`)
        : appCssJsCode.replace(`exports`, `module.exports`));
    const module = { exports: { styles: [] } };
    appCssJsFn(module);
    const appCssJsonCode = JSON.stringify(module.exports.styles);
    if (process.env.UNI_NVUE_APP_STYLES === appCssJsonCode) {
        return;
    }
    process.env.UNI_NVUE_APP_STYLES = appCssJsonCode;
    // 首次 build 时，可能还没生成 app-config-service 的文件，故仅写入环境变量
    const appConfigServiceFilename = path_1.default.join(process.env.UNI_OUTPUT_DIR, uni_cli_shared_1.APP_CONFIG_SERVICE);
    if (!fs_extra_1.default.existsSync(appConfigServiceFilename)) {
        return;
    }
    const appConfigServiceCode = fs_extra_1.default.readFileSync(appConfigServiceFilename, 'utf8');
    fs_extra_1.default.writeFileSync(appConfigServiceFilename, wrapperNVueAppStyles(appConfigServiceCode));
    return true;
}
function buildNVuePage(filename, options) {
    return (0, uni_cli_shared_1.transformWithEsbuild)(`import App from './${filename}'
const webview = plus.webview.currentWebview()
if(webview){
  const __pageId = parseInt(webview.id)
  const __pagePath = '${(0, uni_cli_shared_1.removeExt)(filename)}'
  let __pageQuery = {}
  try{ __pageQuery = JSON.parse(webview.__query__) }catch(e){}
  App.mpType = 'page'
  const app = Vue.createPageApp(App,{$store:getApp({allowDefault:true}).$store,__pageId,__pagePath,__pageQuery})
  app.provide('__globalStyles', Vue.useCssStyles([...__uniConfig.styles, ...(App.styles||[])]))
  app.mount('#root')
}`, path_1.default.join((0, utils_1.nvueOutDir)(), 'main.js'), options).then((res) => {
        if (res.outputFiles) {
            return res.outputFiles[0].text;
        }
        return '';
    });
}
function esbuildGlobalPlugin(options) {
    const keys = Object.keys(options);
    return {
        name: 'global',
        setup(build) {
            keys.forEach((key) => {
                const namespace = key + '-ns';
                build.onResolve({ filter: new RegExp('^' + key + '$') }, ({ path }) => {
                    return {
                        path,
                        namespace,
                    };
                });
                build.onLoad({ filter: /.*/, namespace }, () => ({
                    contents: `module.exports = ${options[key]}`,
                    loader: 'js',
                }));
            });
        },
    };
}
function wrapperNVueAppStyles(code) {
    return code.replace(/__uniConfig.styles=(.*);\/\/styles/, `__uniConfig.styles=${process.env.UNI_NVUE_APP_STYLES || '[]'};//styles`);
}
exports.wrapperNVueAppStyles = wrapperNVueAppStyles;

}, function(modId) { var map = {"../../utils":1781105330949,"../utils":1781105330955,"./appCss":1781105330956}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330955, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.esbuildGlobals = exports.globals = exports.external = void 0;
function external(appService) {
    return appService ? ['vue'] : ['vue', 'vuex', 'pinia'];
}
exports.external = external;
function globals(appService) {
    return appService
        ? { vue: 'Vue' }
        : {
            vue: 'Vue',
            vuex: 'Vuex',
            pinia: 'Pinia',
        };
}
exports.globals = globals;
function esbuildGlobals(appService) {
    return appService
        ? { vue: 'Vue' }
        : {
            vue: 'Vue',
            vuex: 'uni.Vuex',
            pinia: 'uni.Pinia',
        };
}
exports.esbuildGlobals = esbuildGlobals;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330956, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppCssPlugin = exports.APP_CSS_JS = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
exports.APP_CSS_JS = './app.css.js';
function uniAppCssPlugin() {
    const inputDir = process.env.UNI_INPUT_DIR;
    const appVueFilename = (0, uni_cli_shared_1.resolveAppVue)(inputDir);
    return {
        name: 'uni:app-nvue-app-style',
        // 提前到 @vite/plugin-vue 之前执行，因为在 nvue 编译时，仅 import 了 App.vue 的 styles，这样导致 descriptor
        // 一直使用的是上一次的（plugin-vue 会在 transformMain 中生成新的 descriptor），故不再交由 plugin-vue 来 load
        // 而是当前插件直接处理
        enforce: 'pre',
        resolveId(id) {
            if (id === exports.APP_CSS_JS) {
                return exports.APP_CSS_JS;
            }
        },
        load(id) {
            if (id === exports.APP_CSS_JS) {
                return genAppStylesCode(appVueFilename, this);
            }
            const { filename, query } = (0, uni_cli_shared_1.parseVueRequest)(id);
            if (query.vue && query.type === 'style' && appVueFilename === filename) {
                const descriptor = createAppDescriptor(filename, this);
                const block = descriptor.styles[query.index];
                if (block) {
                    return {
                        code: block.content,
                        map: '',
                    };
                }
            }
        },
    };
}
exports.uniAppCssPlugin = uniAppCssPlugin;
const defaultAppStylesCode = `exports.styles = []`;
async function genAppStylesCode(filename, pluginContext) {
    pluginContext.addWatchFile(filename);
    const descriptor = createAppDescriptor(filename, pluginContext);
    if (!descriptor.styles.length) {
        return defaultAppStylesCode;
    }
    let stylesCode = ``;
    const styleVars = [];
    for (let i = 0; i < descriptor.styles.length; i++) {
        const style = descriptor.styles[i];
        const src = style.src || descriptor.filename;
        const attrsQuery = attrsToQuery(style.attrs, 'css');
        const srcQuery = style.src ? `&src=${descriptor.id}` : ``;
        const query = `?vue&type=style&index=${i}${srcQuery}&inline`;
        const styleRequest = src + query + attrsQuery;
        stylesCode += `\nimport _style_${i} from ${JSON.stringify(styleRequest)}`;
        styleVars.push(`_style_${i}`);
    }
    return `
${stylesCode}
exports.styles = [${styleVars.join(',')}]
`;
}
function readAppCode(filename) {
    if (!fs_extra_1.default.existsSync(filename)) {
        return ``;
    }
    const source = fs_extra_1.default.readFileSync(filename, 'utf8');
    if (source.includes('#endif')) {
        return (0, uni_cli_shared_1.preNVueJs)((0, uni_cli_shared_1.preNVueHtml)(source, filename), filename);
    }
    return source;
}
let appDescriptor;
function createAppDescriptor(filename, pluginContext) {
    const source = readAppCode(filename);
    const id = (0, uni_cli_shared_1.hash)(source);
    if (!appDescriptor || appDescriptor.id !== id) {
        const { descriptor, errors } = require('@vue/compiler-sfc').parse(source, {
            filename,
        });
        descriptor.id = id;
        if (errors.length) {
            errors.forEach((error) => pluginContext.error((0, uni_cli_shared_1.createRollupError)('uni:app-nvue-app-style', filename, error)));
        }
        appDescriptor = descriptor;
    }
    return appDescriptor;
}
// these are built-in query parameters so should be ignored
// if the user happen to add them as attrs
const ignoreList = ['id', 'index', 'src', 'type', 'lang', 'module'];
function attrsToQuery(attrs, langFallback, forceLangFallback = false) {
    let query = ``;
    for (const name in attrs) {
        const value = attrs[name];
        if (!ignoreList.includes(name)) {
            query += `&${encodeURIComponent(name)}${value ? `=${encodeURIComponent(value)}` : ``}`;
        }
    }
    if (langFallback || attrs.lang) {
        query +=
            `lang` in attrs
                ? forceLangFallback
                    ? `&lang.${langFallback}`
                    : `&lang.${attrs.lang}`
                : `&lang.${langFallback}`;
    }
    return query;
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330959, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.initNVuePlugins = exports.initNVueNodeTransforms = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const manifestJson_1 = require("../plugins/manifestJson");
const template_1 = require("../plugins/template");
const plugin_1 = require("./plugin");
const appCss_1 = require("./plugins/appCss");
const esbuild_1 = require("./plugins/esbuild");
const mainJs_1 = require("./plugins/mainJs");
const pagesJson_1 = require("./plugins/pagesJson");
const renderjs_1 = require("./plugins/renderjs");
var plugin_2 = require("./plugin");
Object.defineProperty(exports, "initNVueNodeTransforms", { enumerable: true, get: function () { return plugin_2.initNVueNodeTransforms; } });
function initNVuePlugins() {
    const renderer = process.env.UNI_RENDERER;
    const appService = process.env.UNI_RENDERER_NATIVE === 'appService';
    return process.env.UNI_COMPILE_TARGET === 'ext-api'
        ? [
            (0, uni_cli_shared_1.uniEasycomPlugin)({ exclude: uni_cli_shared_1.UNI_EASYCOM_EXCLUDE }),
            (0, uni_cli_shared_1.uniHBuilderXConsolePlugin)(),
            (0, uni_cli_shared_1.uniViteInjectPlugin)('uni:app-inject', (0, uni_cli_shared_1.initAppProvide)()),
            (0, renderjs_1.uniRenderjsPlugin)(),
            (0, plugin_1.uniAppNVuePlugin)({ appService }),
            (0, uni_cli_shared_1.uniUniModulesExtApiPlugin)(),
        ]
        : process.env.UNI_COMPILE_TARGET === 'uni_modules'
            ? [
                (0, uni_cli_shared_1.uniEasycomPlugin)({ exclude: uni_cli_shared_1.UNI_EASYCOM_EXCLUDE }),
                (0, uni_cli_shared_1.uniHBuilderXConsolePlugin)(),
                (0, uni_cli_shared_1.uniViteInjectPlugin)('uni:app-inject', (0, uni_cli_shared_1.initAppProvide)()),
                (0, renderjs_1.uniRenderjsPlugin)(),
                (0, plugin_1.uniAppNVuePlugin)({ appService }),
                (0, uni_cli_shared_1.uniEncryptUniModulesPlugin)(),
            ]
            : [
                (0, appCss_1.uniAppCssPlugin)(),
                (0, uni_cli_shared_1.uniEasycomPlugin)({ exclude: uni_cli_shared_1.UNI_EASYCOM_EXCLUDE }),
                (0, uni_cli_shared_1.uniHBuilderXConsolePlugin)(),
                (0, mainJs_1.uniMainJsPlugin)({ renderer, appService }),
                (0, manifestJson_1.uniManifestJsonPlugin)(),
                (0, pagesJson_1.uniPagesJsonPlugin)({ renderer, appService }),
                (0, uni_cli_shared_1.uniViteInjectPlugin)('uni:app-inject', (0, uni_cli_shared_1.initAppProvide)()),
                (0, renderjs_1.uniRenderjsPlugin)(),
                (0, plugin_1.uniAppNVuePlugin)({ appService }),
                (0, esbuild_1.uniEsbuildPlugin)({ renderer, appService }),
                ...(appService
                    ? [(0, uni_cli_shared_1.uniStatsPlugin)(), (0, template_1.uniTemplatePlugin)({ renderer })]
                    : []),
            ];
}
exports.initNVuePlugins = initNVuePlugins;

}, function(modId) { var map = {"../plugins/manifestJson":1781105330950,"../plugins/template":1781105330948,"./plugin":1781105330960,"./plugins/appCss":1781105330956,"./plugins/esbuild":1781105330954,"./plugins/mainJs":1781105330971,"./plugins/pagesJson":1781105330966,"./plugins/renderjs":1781105330972}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330960, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppNVuePlugin = exports.initNVueDirectiveTransforms = exports.initNVueNodeTransforms = void 0;
const path_1 = __importDefault(require("path"));
const picocolors_1 = __importDefault(require("picocolors"));
const uni_shared_1 = require("@dcloudio/uni-shared");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const uni_nvue_styler_1 = require("@dcloudio/uni-nvue-styler");
const utils_1 = require("../../utils");
// import { transformRenderWhole } from './transforms/transformRenderWhole'
// import { transformAppendAsTree } from './transforms/transformAppendAsTree'
const transformVideo_1 = require("./transforms/transformVideo");
const transformText_1 = require("./transforms/transformText");
const configResolved_1 = require("../../plugin/configResolved");
const utils_2 = require("../utils");
const transformRootNode_1 = require("./transforms/transformRootNode");
const vModel_1 = require("./transforms/vModel");
const vShow_1 = require("./transforms/vShow");
const transformAttrs_1 = require("./transforms/transformAttrs");
const pagesJson_1 = require("../plugins/pagesJson");
const uTags = {
    text: 'u-text',
    image: 'u-image',
    input: 'u-input',
    textarea: 'u-textarea',
    video: 'u-video',
    'web-view': 'u-web-view',
    slider: 'u-slider',
};
function initNVueNodeTransforms() {
    // 优先级必须确保 renderWhole > appendAsTree
    return [
        transformRootNode_1.transformRootNode,
        (0, uni_cli_shared_1.createTransformTag)(uTags),
        transformAttrs_1.transformAttrs,
        transformText_1.transformText,
        transformVideo_1.transformVideo,
        uni_cli_shared_1.transformUTSComponent,
        // transformRenderWhole,
        // transformAppendAsTree,
    ];
}
exports.initNVueNodeTransforms = initNVueNodeTransforms;
function initNVueDirectiveTransforms() {
    return {
        model: vModel_1.transformModel,
        show: vShow_1.transformShow,
    };
}
exports.initNVueDirectiveTransforms = initNVueDirectiveTransforms;
function uniAppNVuePlugin({ appService, }) {
    const inputDir = process.env.UNI_INPUT_DIR;
    const mainPath = (0, uni_cli_shared_1.resolveMainPathOnce)(inputDir);
    return {
        name: 'uni:app-nvue',
        config() {
            return {
                css: {
                    postcss: {
                        plugins: (0, uni_cli_shared_1.initPostcssPlugin)({
                            uniApp: uni_shared_1.defaultNVueRpx2Unit,
                            autoprefixer: false,
                        }),
                    },
                },
                build: {
                    lib: {
                        name: 'AppService',
                        // 必须使用 lib 模式，否则会生成 preload 等代码
                        fileName: appService ? 'app-service' : 'app',
                        entry: mainPath,
                        formats: [appService ? 'iife' : 'es'],
                    },
                    outDir: appService ? process.env.UNI_OUTPUT_DIR : (0, utils_1.nvueOutDir)(),
                    rollupOptions: {
                        external: (0, utils_2.external)(appService),
                        output: {
                            entryFileNames(chunk) {
                                if (chunk.name === 'main' && chunk.isEntry) {
                                    return appService ? uni_cli_shared_1.APP_SERVICE_FILENAME : 'app.js';
                                }
                                return chunk.name + '.js';
                            },
                            chunkFileNames: createChunkFileNames(inputDir),
                            plugins: [(0, uni_cli_shared_1.dynamicImportPolyfill)(true)],
                            globals: (0, utils_2.globals)(appService),
                        },
                    },
                },
            };
        },
        configResolved: (0, configResolved_1.createConfigResolved)({
            createCssPostPlugin(config) {
                return {
                    name: 'vite:css-post',
                    buildStart() {
                        // 用于覆盖原始插件方法
                        // noop
                    },
                    async transform(source, filename) {
                        if (!uni_cli_shared_1.cssLangRE.test(filename) || uni_cli_shared_1.commonjsProxyRE.test(filename)) {
                            return;
                        }
                        const nvuePages = pagesJson_1.nvuePagesCache.get(config);
                        if (!nvuePages || !Object.keys(nvuePages).length) {
                            // 当前项目没有 nvue 文件
                            return { code: `export default {}`, map: { mappings: '' } };
                        }
                        const { code, messages } = await (0, uni_nvue_styler_1.parse)(source, {
                            filename,
                            logLevel: 'WARNING',
                        });
                        messages.forEach((message) => {
                            if (message.type === 'warning') {
                                config.logger.warn(picocolors_1.default.yellow(`[plugin:vite:nvue-css] ${message.text}`));
                                let msg = '';
                                if (message.line && message.column) {
                                    msg += `\n${(0, uni_cli_shared_1.generateCodeFrame)(source, {
                                        line: message.line,
                                        column: message.column,
                                    })}\n`;
                                }
                                msg += `${(0, uni_cli_shared_1.formatAtFilename)(filename)}`;
                                config.logger.warn(msg);
                            }
                        });
                        return { code: `export default ${code}`, map: { mappings: '' } };
                    },
                    generateBundle() {
                        // 用于覆盖原始插件方法
                        // noop
                    },
                };
            },
        }),
    };
}
exports.uniAppNVuePlugin = uniAppNVuePlugin;
function createChunkFileNames(inputDir) {
    return function chunkFileNames(chunk) {
        if (chunk.isDynamicEntry && chunk.facadeModuleId) {
            const { filename } = (0, uni_cli_shared_1.parseVueRequest)(chunk.facadeModuleId);
            if (filename.endsWith('.nvue')) {
                return ((0, uni_cli_shared_1.removeExt)((0, uni_cli_shared_1.normalizePath)(path_1.default.relative(inputDir, filename))) + '.js');
            }
        }
        return '[name].js';
    };
}

}, function(modId) { var map = {"../../utils":1781105330949,"./transforms/transformVideo":1781105330961,"./transforms/transformText":1781105330962,"../../plugin/configResolved":1781105330963,"../utils":1781105330955,"./transforms/transformRootNode":1781105330964,"./transforms/vModel":1781105330967,"./transforms/vShow":1781105330968,"./transforms/transformAttrs":1781105330970,"../plugins/pagesJson":1781105330966}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330961, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformVideo = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const compiler_core_1 = require("@vue/compiler-core");
function isVideo(node) {
    return node.tag === 'video' || node.tag === 'u-video';
}
const transformVideo = (node, _) => {
    if (!(0, uni_cli_shared_1.isElementNode)(node)) {
        return;
    }
    if (!isVideo(node)) {
        return;
    }
    if (!node.children.length) {
        return;
    }
    const firstChild = node.children[0];
    if ((0, uni_cli_shared_1.isElementNode)(firstChild) && firstChild.tag === 'u-scalable') {
        return;
    }
    node.children = [createScalable(node)];
};
exports.transformVideo = transformVideo;
function createScalable(node) {
    return {
        tag: 'u-scalable',
        type: compiler_core_1.NodeTypes.ELEMENT,
        tagType: compiler_core_1.ElementTypes.ELEMENT,
        props: [
            (0, uni_cli_shared_1.createBindDirectiveNode)('style', (0, compiler_core_1.createSimpleExpression)('{position:"absolute",left:"0",right:"0",top:"0",bottom:"0"}')),
        ],
        isSelfClosing: true,
        children: node.children,
        codegenNode: undefined,
        ns: node.ns,
        loc: node.loc,
    };
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330962, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformText = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const compiler_core_1 = require("@vue/compiler-core");
function isTextNode({ tag }) {
    return tag === 'text' || tag === 'u-text' || tag === 'button';
}
function isTextElement(node) {
    return node.type === compiler_core_1.NodeTypes.ELEMENT && node.tag === 'text';
}
function isText(node) {
    const { type } = node;
    return (type === compiler_core_1.NodeTypes.TEXT ||
        type === compiler_core_1.NodeTypes.TEXT_CALL ||
        type === compiler_core_1.NodeTypes.INTERPOLATION ||
        type === compiler_core_1.NodeTypes.COMPOUND_EXPRESSION);
}
const transformText = (node, _) => {
    if (!(0, uni_cli_shared_1.isElementNode)(node)) {
        return;
    }
    if (isTextNode(node)) {
        return;
    }
    const { children } = node;
    if (!children.length) {
        return;
    }
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isTextElement(child)) {
            parseText(child);
        }
        let currentContainer = undefined;
        if (isText(child)) {
            if (!currentContainer) {
                currentContainer = children[i] = createText(node, child);
            }
            for (let j = i + 1; j < children.length; j++) {
                const next = children[j];
                if (isText(next)) {
                    // 合并相邻的文本节点
                    currentContainer.children.push(next);
                    children.splice(j, 1);
                    j--;
                }
                else {
                    currentContainer = undefined;
                    break;
                }
            }
        }
    }
};
exports.transformText = transformText;
/*
  1. 转换 \\n 为 \n
  2. u-text 下只能有一个文本节点（不支持 children），需要移除子组件并合并文本
*/
function parseText(node) {
    if (node.children.length) {
        let firstTextChild;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (isText(child) && typeof child.content === 'string') {
                if (!firstTextChild) {
                    firstTextChild = child;
                    firstTextChild.content = firstTextChild.content.replace(/\\n/g, '\n');
                }
                else {
                    ;
                    firstTextChild.content += child.content.replace(/\\n/g, '\n');
                    node.children.splice(i, 1);
                    i--;
                }
            }
            else if (child.type === 1 || child.type === 3) {
                node.children.splice(i, 1);
                i--;
            }
            else {
                firstTextChild = null;
            }
        }
    }
}
function createText(parent, node) {
    return {
        tag: 'u-text',
        type: compiler_core_1.NodeTypes.ELEMENT,
        tagType: compiler_core_1.ElementTypes.ELEMENT,
        props: [],
        isSelfClosing: false,
        children: [node],
        codegenNode: undefined,
        ns: parent.ns,
        loc: node.loc,
    };
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330963, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfigResolved = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function createConfigResolved({ createCssPostPlugin, }) {
    return (config) => {
        (0, uni_cli_shared_1.injectCssPlugin)(config, process.env.UNI_COMPILE_TARGET === 'uni_modules'
            ? {
                createUrlReplacer: uni_cli_shared_1.createEncryptCssUrlReplacer,
            }
            : {});
        (0, uni_cli_shared_1.injectCssPostPlugin)(config, createCssPostPlugin(config));
        // 强制不inline
        config.build.assetsInlineLimit = 0;
        (0, uni_cli_shared_1.injectAssetPlugin)(config);
    };
}
exports.createConfigResolved = createConfigResolved;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330964, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformRootNode = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const compiler_core_1 = require("@vue/compiler-core");
const transformRenderWhole_1 = require("./transformRenderWhole");
const pagesJson_1 = require("../../plugins/pagesJson");
const SCROLLER_COMPONENTS = [
    'list',
    'scroller',
    'scroll-view',
    'waterfall',
    'recycle-list',
];
const transformRootNode = (node, context) => {
    if (node.type !== compiler_core_1.NodeTypes.ROOT) {
        return;
    }
    const pageOptions = (0, pagesJson_1.parseNVuePageOptions)((0, uni_cli_shared_1.normalizePath)(context.filename));
    if (!pageOptions) {
        // 非页面组件，自动为根节点补充 render-whole
        return (0, transformRenderWhole_1.addRenderWhole)(node);
    }
    const { disableScroll, scrollIndicator } = pageOptions;
    // 禁用滚动，或已包含滚动元素
    if (disableScroll || hasScrollerElement(node)) {
        return wrapperByView(node);
    }
    return wrapperByScrollView(node, { scrollIndicator });
};
exports.transformRootNode = transformRootNode;
function hasScrollerElement(node) {
    return node.children.some((child) => {
        if (child.type === compiler_core_1.NodeTypes.ELEMENT) {
            return SCROLLER_COMPONENTS.includes(child.tag);
        }
    });
}
function wrapperByScrollView(node, { scrollIndicator }) {
    node.children = [
        createElement('scroll-view', createScrollViewProps({ scrollIndicator }), node.children),
    ];
}
const trueExpr = (0, compiler_core_1.createSimpleExpression)('true');
const falseExpr = (0, compiler_core_1.createSimpleExpression)('false');
function createScrollViewProps({ scrollIndicator, }) {
    return [
        (0, uni_cli_shared_1.createBindDirectiveNode)('scrollY', trueExpr),
        (0, uni_cli_shared_1.createBindDirectiveNode)('showScrollbar', scrollIndicator === 'none' ? falseExpr : trueExpr),
        (0, uni_cli_shared_1.createBindDirectiveNode)('enableBackToTop', trueExpr),
        (0, uni_cli_shared_1.createAttributeNode)('bubble', 'true'),
        (0, uni_cli_shared_1.createBindDirectiveNode)('style', `{flexDirection:'column'}`),
    ];
}
/**
 * 目前暂不支持多节点，故发现多节点时，自动补充一个 view 根节点
 * @param node
 */
function wrapperByView(node) {
    if (node.children.length > 1) {
        node.children = [createElement('view', [], node.children)];
    }
}
function createElement(tag, props, children) {
    return {
        type: compiler_core_1.NodeTypes.ELEMENT,
        ns: 0,
        tag,
        isSelfClosing: false,
        props,
        children,
        tagType: compiler_core_1.ElementTypes.ELEMENT,
        codegenNode: undefined,
        loc: compiler_core_1.locStub,
    };
}

}, function(modId) { var map = {"./transformRenderWhole":1781105330965,"../../plugins/pagesJson":1781105330966}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330965, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.addRenderWhole = exports.transformRenderWhole = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const compiler_core_1 = require("@vue/compiler-core");
const transformRenderWhole = (node, _) => {
    if (!(0, uni_cli_shared_1.isElementNode)(node)) {
        return;
    }
    const prop = (0, compiler_core_1.findProp)(node, 'render-whole');
    if (!prop) {
        return;
    }
    // render-whole => append
    (0, uni_cli_shared_1.renameProp)('append', prop);
};
exports.transformRenderWhole = transformRenderWhole;
//
const RENDER_WHOLE_TAGS = [
    'view',
    'scroll-view',
    'swiper',
    'match-media',
    'movable-area',
    'movable-view',
    'cover-view',
    'cover-image',
    'form',
    'picker',
    'picker-view',
    'navigator',
    'map',
];
/**
 * 仅当根节点只有一个，标签在白名单，且开发者未主动配置的情况下，才补充
 * @param node
 */
function addRenderWhole(node) {
    if (node.children.length === 1) {
        const element = node.children[0];
        if ((0, uni_cli_shared_1.isElementNode)(element) && RENDER_WHOLE_TAGS.includes(element.tag)) {
            if (!(0, compiler_core_1.findProp)(element, 'render-whole') &&
                !(0, compiler_core_1.findProp)(element, 'append') &&
                !(0, compiler_core_1.findProp)(element, 'appendAsTree')) {
                element.props.push((0, uni_cli_shared_1.createBindDirectiveNode)('render-whole', (0, compiler_core_1.createSimpleExpression)('true')));
            }
        }
    }
}
exports.addRenderWhole = addRenderWhole;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330966, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniPagesJsonPlugin = exports.parseNVuePageOptions = exports.nvuePagesCache = void 0;
const path_1 = __importDefault(require("path"));
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
exports.nvuePagesCache = new Map();
// 在 @vue/compiler-sfc@3.2.47 执行前重写 @vue/compiler-dom compile 方法
const nvuePages = {};
function parseNVuePageOptions(filename) {
    return nvuePages[filename];
}
exports.parseNVuePageOptions = parseNVuePageOptions;
function uniPagesJsonPlugin({ renderer, appService, }) {
    return (0, uni_cli_shared_1.defineUniPagesJsonPlugin)((opts) => {
        return {
            name: 'uni:app-nvue-pages-json',
            enforce: 'pre',
            configResolved(config) {
                exports.nvuePagesCache.set(config, nvuePages);
            },
            transform(code, id) {
                if (!opts.filter(id)) {
                    return;
                }
                this.addWatchFile(path_1.default.resolve(process.env.UNI_INPUT_DIR, 'pages.json'));
                (0, uni_cli_shared_1.getLocaleFiles)(path_1.default.resolve(process.env.UNI_INPUT_DIR, 'locale')).forEach((filepath) => {
                    this.addWatchFile(filepath);
                });
                const pagesJson = (0, uni_cli_shared_1.normalizePagesJson)(code, process.env.UNI_PLATFORM);
                Object.keys(nvuePages).forEach((name) => {
                    delete nvuePages[name];
                });
                pagesJson.pages.forEach((page) => {
                    if (page.style.isNVue) {
                        const filename = (0, uni_cli_shared_1.normalizePath)(path_1.default.resolve(process.env.UNI_INPUT_DIR, page.path + '.nvue'));
                        nvuePages[filename] = {
                            disableScroll: page.style.disableScroll,
                            scrollIndicator: page.style.scrollIndicator,
                        };
                        // fix: question/164673
                        // this.addWatchFile(filename)
                    }
                });
                if (renderer === 'native' && appService) {
                    this.emitFile({
                        fileName: uni_cli_shared_1.APP_CONFIG_SERVICE,
                        type: 'asset',
                        source: (0, uni_cli_shared_1.normalizeAppConfigService)(pagesJson, (0, uni_cli_shared_1.parseManifestJsonOnce)(process.env.UNI_INPUT_DIR)),
                    });
                    return {
                        code: '',
                        map: { mappings: '' },
                    };
                }
                return {
                    code: (0, uni_cli_shared_1.normalizeAppNVuePagesJson)(pagesJson),
                    map: { mappings: '' },
                };
            },
        };
    });
}
exports.uniPagesJsonPlugin = uniPagesJsonPlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330967, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformModel = void 0;
const compiler_core_1 = require("@vue/compiler-core");
const shared_1 = require("@vue/shared");
const tags = ['u-input', 'u-textarea'];
const transformModel = (dir, node, context) => {
    const result = (0, compiler_core_1.transformModel)(dir, node, context);
    // 将 u-input,u-textarea 的 onUpdate:modelValue 事件转换为 onInput
    if (tags.includes(node.tag) && result.props.length >= 2) {
        const key = result.props[1].key;
        let value = result.props[1].value;
        if (value.type === compiler_core_1.NodeTypes.JS_CACHE_EXPRESSION) {
            value = value.value;
        }
        if ((0, compiler_core_1.isStaticExp)(key) &&
            key.content === 'onUpdate:modelValue' &&
            value.type === compiler_core_1.NodeTypes.COMPOUND_EXPRESSION) {
            key.content = 'onInput';
            // 替换 $event 为 $event.detail.value
            value.children = value.children.map((child) => {
                if ((0, shared_1.isString)(child)) {
                    return child.replace(/=\s\$event/g, `= $event.detail.value`);
                }
                return child;
            });
        }
    }
    return result;
};
exports.transformModel = transformModel;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330968, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformShow = void 0;
const errors_1 = require("./errors");
const transformShow = (dir, node, context) => {
    context.onError((0, errors_1.createNVueCompilerError)(0 /* NVueErrorCodes.X_V_SHOW */, dir.loc));
    return {
        props: [],
    };
};
exports.transformShow = transformShow;

}, function(modId) { var map = {"./errors":1781105330969}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330969, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.createNVueCompilerError = void 0;
const compiler_core_1 = require("@vue/compiler-core");
const NVueErrorMessages = {
    [0 /* NVueErrorCodes.X_V_SHOW */]: 'nvue: v-show is not supported',
    [1 /* NVueErrorCodes.X_V_MODEL_DYNAMIC_TYPE */]: 'nvue: v-model with :type="" is not supported',
    [2 /* NVueErrorCodes.X_V_MODEL_AND_V_BIND */]: 'nvue: v-model with v-bind is not supported',
};
function createNVueCompilerError(code, loc, additionalMessage) {
    return (0, compiler_core_1.createCompilerError)(code, loc, NVueErrorMessages, additionalMessage);
}
exports.createNVueCompilerError = createNVueCompilerError;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330970, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformAttrs = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const uni_shared_1 = require("@dcloudio/uni-shared");
const shared_1 = require("@vue/shared");
/**
 * 将内置组件属性调整为驼峰
 * @param node
 * @param context
 * @returns
 */
const transformAttrs = (node, context) => {
    if (!(0, uni_cli_shared_1.isElementNode)(node)) {
        return;
    }
    if (!(0, uni_shared_1.isAppNVueNativeTag)(node.tag)) {
        return;
    }
    node.props.forEach((prop) => {
        if ((0, uni_cli_shared_1.isDirectiveNode)(prop)) {
            const { arg } = prop;
            if (arg && (0, uni_cli_shared_1.isSimpleExpressionNode)(arg)) {
                arg.content = normalizePropName(arg.content);
            }
        }
        else {
            prop.name = normalizePropName(prop.name);
        }
    });
};
exports.transformAttrs = transformAttrs;
function normalizePropName(name) {
    if (name.startsWith('data-')) {
        return name;
    }
    return (0, shared_1.camelize)(name);
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330971, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniMainJsPlugin = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const appCss_1 = require("./appCss");
function uniMainJsPlugin({ renderer, appService, }) {
    return (0, uni_cli_shared_1.defineUniMainJsPlugin)((opts) => {
        return {
            name: 'uni:app-nvue-main-js',
            enforce: 'pre',
            transform(code, id) {
                if (opts.filter(id)) {
                    if (renderer !== 'native') {
                        return {
                            code: `import './${uni_cli_shared_1.PAGES_JSON_JS}';import('${appCss_1.APP_CSS_JS}').then(()=>{})`,
                            map: { mappings: '' },
                        };
                    }
                    if (appService) {
                        code = code.includes('createSSRApp')
                            ? createApp(code)
                            : createLegacyApp(code);
                        return {
                            code: `import './${uni_cli_shared_1.MANIFEST_JSON_JS}';\nimport './${uni_cli_shared_1.PAGES_JSON_JS}';\n` +
                                code,
                            map: { mappings: '' },
                        };
                    }
                    return {
                        code: `import './${uni_cli_shared_1.PAGES_JSON_JS}';`,
                        map: { mappings: '' },
                    };
                }
            },
        };
    });
}
exports.uniMainJsPlugin = uniMainJsPlugin;
function createApp(code) {
    return `${code.replace('createSSRApp', 'createVueApp as createSSRApp')};\nconst {app:__app__,Vuex:__Vuex__,Pinia:__Pinia__}=createApp();uni.Vuex=__Vuex__;uni.Pinia=__Pinia__;__app__._component.mpType='app';__app__._component.render=()=>{};__app__.mount('#app');`;
}
function createLegacyApp(code) {
    return `function createApp(rootComponent,rootProps){rootComponent.mpTye='app';rootComponent.render=()=>{};const app=createVueApp(rootComponent,rootProps);const oldMount=app.mount;app.mount=(container)=>{const appVm=oldMount.call(app,container);return appVm;};return app;};${code.replace('createApp', 'createVueApp')}`;
}

}, function(modId) { var map = {"./appCss":1781105330956}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330972, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniRenderjsPlugin = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
function uniRenderjsPlugin() {
    return {
        name: 'uni:app-nvue-renderjs',
        async transform(code, id) {
            const { type } = (0, uni_cli_shared_1.parseRenderjs)(id);
            if (!type) {
                return;
            }
            return {
                code: `export default {}`,
                map: { mappings: '' },
            };
        },
    };
}
exports.uniRenderjsPlugin = uniRenderjsPlugin;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330973, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.uniAppPlugin = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const uni_1 = require("./uni");
const build_1 = require("./build");
function uniAppPlugin({ renderer, appService, } = {
    appService: false,
}) {
    return {
        name: 'uni:app',
        uni: (0, uni_1.uniOptions)(),
        config(config, env) {
            return {
                base: '/', // app 平台强制 base
                build: (0, build_1.buildOptions)({ renderer, appService }, config, env),
                optimizeDeps: {
                    noDiscovery: true,
                    include: [],
                },
                resolve: {
                    alias: {
                        // vue-i18n 默认会启用 new Function 来构造翻译函数，导致在 Android 上可能报`TypeError: no access` 错误
                        // 故：启用 runtime 模式，内部定制了简易的 compileToFunction
                        'vue-i18n': (0, uni_cli_shared_1.resolveVueI18nRuntime)(),
                    },
                },
            };
        },
    };
}
exports.uniAppPlugin = uniAppPlugin;

}, function(modId) { var map = {"./uni":1781105330974}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330974, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniOptions = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const uni_shared_1 = require("@dcloudio/uni-shared");
const uni_i18n_1 = require("@dcloudio/uni-i18n");
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const nvue_1 = require("../../nvue");
const plugin_1 = require("../../nvue/plugin");
const transformWxsProps_1 = require("./transforms/transformWxsProps");
function isAppNVueNativeTag(tag) {
    return (0, uni_cli_shared_1.matchUTSComponent)(tag) || (0, uni_shared_1.isAppNVueNativeTag)(tag);
}
function uniOptions(compilerType = process.env.UNI_COMPILER) {
    const isNVueCompiler = compilerType === 'nvue';
    return {
        copyOptions() {
            const platform = process.env.UNI_PLATFORM;
            const inputDir = process.env.UNI_INPUT_DIR;
            const outputDir = process.env.UNI_OUTPUT_DIR;
            const targets = [];
            // 自动化测试时，不启用隐私政策
            if (!process.env.UNI_AUTOMATOR_WS_ENDPOINT) {
                targets.push({
                    src: 'androidPrivacy.json',
                    dest: outputDir,
                    transform(source) {
                        const options = (0, uni_cli_shared_1.initI18nOptions)(platform, inputDir, false, true);
                        if (!options) {
                            return;
                        }
                        return (0, uni_i18n_1.compileI18nJsonStr)(source.toString(), options);
                    },
                });
                const debugFilename = '__nvue_debug__';
                if (fs_extra_1.default.existsSync(path_1.default.resolve(inputDir, debugFilename))) {
                    targets.push({
                        src: debugFilename,
                        dest: outputDir,
                    });
                }
            }
            return {
                assets: ['hybrid/html/**/*', 'uni_modules/*/hybrid/html/**/*'],
                targets,
            };
        },
        compilerOptions: {
            isNativeTag: isNVueCompiler ? isAppNVueNativeTag : uni_shared_1.isAppNativeTag,
            isVoidTag: uni_shared_1.isAppVoidTag,
            nodeTransforms: [
                ...(isNVueCompiler ? (0, nvue_1.initNVueNodeTransforms)() : [transformWxsProps_1.transformWxsProps]),
                uni_cli_shared_1.transformTapToClick,
                uni_cli_shared_1.transformMatchMedia,
                uni_cli_shared_1.transformPageHead,
            ],
            directiveTransforms: {
                ...(isNVueCompiler ? (0, plugin_1.initNVueDirectiveTransforms)() : {}),
            },
        },
    };
}
exports.uniOptions = uniOptions;

}, function(modId) { var map = {"../../nvue":1781105330959,"../../nvue/plugin":1781105330960,"./transforms/transformWxsProps":1781105330975}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330975, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.transformWxsProps = void 0;
const uni_cli_shared_1 = require("@dcloudio/uni-cli-shared");
const uni_shared_1 = require("@dcloudio/uni-shared");
const compiler_core_1 = require("@vue/compiler-core");
const runtimeHelpers_1 = require("./runtimeHelpers");
const transformWxsProps = (node, context) => {
    if (!(0, uni_cli_shared_1.isElementNode)(node)) {
        return;
    }
    node.props.forEach((prop) => {
        if ((0, uni_cli_shared_1.isDirectiveNode)(prop) && prop.arg && (0, uni_cli_shared_1.isSimpleExpressionNode)(prop.arg)) {
            const { content } = prop.arg;
            if (content.startsWith(uni_shared_1.ATTR_CHANGE_PREFIX)) {
                const propName = content.substring(uni_shared_1.ATTR_CHANGE_PREFIX.length);
                const wxsProp = (0, compiler_core_1.findProp)(node, propName, true);
                if (wxsProp && (0, uni_cli_shared_1.isDirectiveNode)(wxsProp) && wxsProp.exp) {
                    wxsProp.exp = (0, compiler_core_1.createCompoundExpression)([
                        context.helperString(runtimeHelpers_1.WXS_PROP),
                        '(',
                        wxsProp.exp,
                        ')',
                    ]);
                }
            }
        }
    });
};
exports.transformWxsProps = transformWxsProps;

}, function(modId) { var map = {"./runtimeHelpers":1781105330976}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1781105330976, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.WXS_PROP = void 0;
const compiler_core_1 = require("@vue/compiler-core");
exports.WXS_PROP = Symbol(`wxsProp`);
(0, compiler_core_1.registerRuntimeHelpers)({
    [exports.WXS_PROP]: 'wp',
});

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1781105330946);
})()
//miniprogram-npm-outsideDeps=["@dcloudio/uni-cli-shared","./plugins/renderjs","./plugin","path","fs-extra","debug","@vue/compiler-sfc","picocolors","@dcloudio/uni-shared","@dcloudio/uni-nvue-styler","@vue/compiler-core","@vue/shared","./build","@dcloudio/uni-i18n"]
//# sourceMappingURL=index.js.map