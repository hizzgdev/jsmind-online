(function ($w) {
    'use strict';
    const $d = $w.document;
    const JSMIND_VERSION = '0.8.5';
    const CDN_LIST = [
        '//unpkg.com',
        '//cdn.jsdelivr.net/npm',
        '//npm.onmicrosoft.cn',
        '/npm'
    ]
    const CDN_ASSETS = {
        JSMIND_STYLE_SHEET: `/jsmind@${JSMIND_VERSION}/style/jsmind.css`,
        JSMIND_JS: `/jsmind@${JSMIND_VERSION}/es6/jsmind.js`,
        JSMIND_DRAGGABLE_NODE: `/jsmind@${JSMIND_VERSION}/es6/jsmind.draggable-node.js`,
        JSMIND_SCREENSHOT: `/jsmind@${JSMIND_VERSION}/es6/jsmind.screenshot.js`,
        DOM_TO_IMAGE: '/dom-to-image@2.6.0/dist/dom-to-image.min.js'
    }
    const LOCAL_ASSETS = {
        JSMIND_API: '/js/jsmind-api.js',
        JSMIND_ONLINE: '/js/jsmind-online.js'
    }

    const LOAD_TIMEOUT_MS = 1000;

    function tryLoadStyle() {
        return new Promise(function (resolve, reject) {
            const resolveWrapper = function (cdn) {
                localStorage.setItem('cdn', cdn);
                resolve(cdn);
            }
            let cdn = function () {
                let _cdn = localStorage.getItem('cdn');
                if (CDN_LIST.includes(_cdn)) {
                    return _cdn;
                } else {
                    localStorage.removeItem('cdn');
                }
            }();

            if (!cdn) {
                return testAvailableCdn(0, resolveWrapper, reject);
            }

            loadStyle(cdn + CDN_ASSETS.JSMIND_STYLE_SHEET, function () {
                resolve(cdn);
            }, function () {
                localStorage.removeItem('cdn');
                testAvailableCdn(0, resolveWrapper, reject)
            });
        });
    }

    function testAvailableCdn(cdnIndex, resolve, reject) {
        if (cdnIndex >= CDN_LIST.length) {
            reject();
            return;
        }
        const cdn = CDN_LIST[cdnIndex]
        loadStyle(cdn + CDN_ASSETS.JSMIND_STYLE_SHEET, function () {
            resolve(cdn)
        }, function () {
            testAvailableCdn(cdnIndex + 1, resolve, reject);
        });
    }

    function loadStyle(url, onload, onerror) {
        let link = $d.createElement('link');
        if (!!onload && !!onerror) {
            let timeoutHandle = $w.setTimeout(function () {
                $d.head.removeChild(link);
                onerror();
            }, LOAD_TIMEOUT_MS)
            link.onerror = function () {
                $w.clearTimeout(timeoutHandle);
                $d.head.removeChild(link);
                onerror();
            };
            link.onload = function () {
                $w.clearTimeout(timeoutHandle);
                onload();
            };
        }
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = url;
        $d.head.appendChild(link);
    }

    function loadScripts(cdn) {
        loadScript(`${cdn}${CDN_ASSETS.JSMIND_JS}`).then(
            () => {
                loadScript(`${cdn}${CDN_ASSETS.JSMIND_DRAGGABLE_NODE}`);
                loadScript(`${cdn}${CDN_ASSETS.DOM_TO_IMAGE}`).then(
                    () => {
                        loadScript(`${cdn}${CDN_ASSETS.JSMIND_SCREENSHOT}`).then(() => {
                            loadScript(LOCAL_ASSETS.JSMIND_API);
                            loadScript(LOCAL_ASSETS.JSMIND_ONLINE);
                        })
                    }
                );
            }
        )
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            let script = $d.createElement('script');
            if (!!resolve) {
                script.onload = resolve(src);
            }
            if (!!reject) {
                script.onerror = reject(src);
            }
            script.type = 'text/javascript'
            script.async = false;
            script.src = src;
            $d.head.appendChild(script);
        });
    }

    (function () {
        tryLoadStyle().then(function (cdn) {
            loadScripts(cdn);
        }).catch(function () {
            console.error('can not load resources from CDN');
        });
    })();
})(window);
