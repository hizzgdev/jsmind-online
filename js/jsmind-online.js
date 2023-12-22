(function ($w) {
    'use strict';
    const $d = $w.document;
    const $g = function (id) {
        return $d.getElementById(id);
    };
    const $q = function (selector) {
        return $d.querySelectorAll(selector);
    }
    const $header = $d.getElementsByTagName('header')[0];
    const $footer = $d.getElementsByTagName('footer')[0];
    const $layout = $g('layout');
    const $container = $g('jsmind_container');
    const $setting_panel = $d.getElementsByTagName('aside')[0];
    const _h_header = $header.clientHeight;
    const _h_footer = $footer.clientHeight;

    const MINDMAPS_API = 'https://v1.api.jsmind.online/mindmaps';
    const JSMIND_ONLINE = $w.location.origin;
    const jsMind = $w.jsMind;

    const HASHES = {
        NEW: "#new",
        SAMPLE: '#sample',
    }

    let _jm = null;
    let _setting_panel_visible = false;

    function page_load() {
        init_jsMind();
        set_container_size();
        register_event();
        hash_changed();
    }

    function init_jsMind() {
        var options = {
            editable: true,
            container: 'jsmind_container',
            theme: 'greensea',
            plugin: {
                screenshot: {
                    watermark: {
                        left: "",
                        right: JSMIND_ONLINE
                    }
                }
            }
        };
        _jm = new jsMind(options);
        _jm.init();
    }

    function register_event() {
        jsMind.$.on($w, 'hashchange', hash_changed)
        jsMind.$.on($w, 'resize', reset_container_size);
        jsMind.$.on($d, 'click', hide_menu_visible);
        jsMind.$.on($g('jm_file_input'), 'change', jm_file_input_changed);
        $q('.action-trigger').forEach((ele, _idx, _arr) => jsMind.$.on(ele, 'click', tools_handler));
    }

    function hash_changed(e) {
        const hash = $w.location.hash.toLowerCase();
        if (hash === HASHES.NEW) {
            jsmind_empty();
        } else if (hash === HASHES.SAMPLE) {
            load_mind_demo();
        } else if (hash.startsWith('#m/')) {
            load_mindmap(hash.substring(3, 39));
        } else {
            hash_to(HASHES.SAMPLE);
        }
    }

    function load_mindmap(key) {
        fetch(MINDMAPS_API + '/' + key)
            .then((response) => response.json())
            .then((json) => {
                if (json.success) {
                    _jm.show(json.data)
                } else {
                    show_toast(['Oh! The mindmap can not be found.', key], 3000)
                        .then(() => hash_to(HASHES.NEW));
                }
            })
            .catch((e) => {
                show_toast(['Oh! something wrong', e], 3000)
                    .then(() => hash_to(HASHES.NEW));
            });
    }

    function load_mind_demo() {
        const mind_lang = _get_lang_from_session() || _get_lang_from_browser();
        fetch(`example/data_intro_${mind_lang}.json`)
            .then((response) => response.json())
            .then((mind) => _jm.show(mind));
    }

    function _get_lang_from_session() {
        return sessionStorage.getItem('lang');
    }

    function _get_lang_from_browser() {
        let langs = navigator.languages.map(l => l.substring(0, 2));
        for (let lang of langs) {
            if (lang === 'zh' || lang === 'en') {
                return lang;
            }
        }
        return 'en';
    }

    var _resize_timeout_id = -1;
    function reset_container_size() {
        if (_resize_timeout_id != -1) {
            clearTimeout(_resize_timeout_id);
        }
        _resize_timeout_id = setTimeout(function () {
            _resize_timeout_id = -1;
            set_container_size();
            _jm.resize();
        }, 300);
    }

    var _menu_visible = false;
    function toggle_menu_visible(e) {
        const tools = $g('jsmind_tools');
        if (_menu_visible) {
            _menu_visible = false;
            tools.className = tools.className.replace(/\s*jsmind-tools-active/gi, '');
        } else {
            _menu_visible = true;
            tools.className += ' jsmind-tools-active';
        }
    }
    function hide_menu_visible(e) {
        if (!_menu_visible) {
            return;
        }
        const action = find_menu_item_action(e.target);
        if (action === 'menu') {
            return;
        }
        const tools = $g('jsmind_tools');
        _menu_visible = false;
        tools.className = tools.className.replace(/\s*jsmind-tools-active/gi, '');
    }

    function open_open_dialog(e) {
        $g('jm_file_input').click();
    }
    function open_save_dialog(e) {
        var mind_data = _jm.get_data();
        var mind_name = mind_data.meta.name;
        var mind_str = jsMind.util.json.json2string(mind_data);
        jsMind.util.file.save(mind_str, 'text/jsmind', mind_name + '.jm');
    }

    function show_setting_panel() {
        if (_setting_panel_visible) { return; }
        const panel_width = calc_setting_panel_width();
        _setting_panel_visible = true;
        $setting_panel.style.width = (panel_width - 2) + 'px';
        $layout.className = 'setting-panel-visible';
        set_container_size();
        $container.children[0].scrollBy(panel_width / 2, 0);
    }

    function hide_setting_panel() {
        if (!_setting_panel_visible) { return; }
        const panel_width = calc_setting_panel_width();
        _setting_panel_visible = true;
        _setting_panel_visible = false;
        $layout.className = 'setting-panel-hidden';
        $container.children[0].scrollBy(-panel_width / 2, 0);
        set_container_size();
    }
    function open_share_dialog(e) {
        $q('button.action-trigger[action="share"]')[0].disabled = false;
        $g('jsmind_author').disabled = false;
        $g('share_progress').style.display = 'none';
        $g('shared_link').style.display = 'none';
        show_setting_panel();
    }
    function open_help_dialog(e) {
        load_mind_demo();
    }
    function take_screenshot(e) {
        _jm.shoot();
    }
    function jsmind_empty(e) {
        _jm.show();
        _jm.mind.name = 'jsMind Map - ' + new Date().getTime();
        _jm.mind.author = 'Anonymous';
    }

    const action_handlers = {
        menu: toggle_menu_visible,
        open: open_open_dialog,
        download: open_save_dialog,
        screenshot: take_screenshot,
        empty: () => hash_to(HASHES.NEW),
        help: open_help_dialog,
        'sample': () => hash_to(HASHES.SAMPLE),
        'close-setting-panel': hide_setting_panel,
        'create-shared-link': open_share_dialog,
        'lang-zh': () => change_lang('zh'),
        'lang-en': () => change_lang('en'),
        'share': start_share,
    };

    function hash_to(hash) {
        $w.location.hash = hash;
    }

    function change_lang(lang) {
        sessionStorage.setItem('lang', lang);
        const hash = $w.location.hash.toLowerCase();
        if (hash === HASHES.SAMPLE) {
            load_mind_demo();
        }
    }

    function find_menu_item_action(ele) {
        if (ele.className.indexOf('menu-') < 0) {
            return null;
        }
        const action = ele.getAttribute('action');
        if (!!action || ele.tagName === 'LI') {
            return action;
        }
        return find_menu_item_action(ele.parentElement);
    }

    function tools_handler(e) {
        const action = e.currentTarget.getAttribute('action');
        if (action in action_handlers) {
            action_handlers[action](e);
        }
    }

    function jm_file_input_changed(e) {
        if (this.files.length > 0) {
            var file_data = this.files[0];
            jsMind.util.file.read(file_data, function (jsmind_data, jsmind_name) {
                var mind = jsMind.util.json.string2json(jsmind_data);
                if (!!mind) {
                    _jm.show(mind);
                } else {
                    console.error('can not open this file as a jsMind file');
                }
            });
        }
    }

    function set_container_size() {
        const ch = $w.innerHeight - _h_header - _h_footer - 2;
        const cw = $w.innerWidth;
        const sw = _setting_panel_visible ? calc_setting_panel_width() : 0;
        $container.style.height = ch + 'px';
        $container.style.width = (cw - sw) + 'px';
        $setting_panel.style.height = ch + 'px';
        $setting_panel.style.width = (sw - 2) + 'px';
    }

    function calc_setting_panel_width() {
        const ratio = 0.24;
        const min_width = 300;
        const max_width = 400;
        const dynamic_width = $w.innerWidth * ratio;
        if (dynamic_width < min_width) {
            return min_width
        }
        if (dynamic_width > max_width) {
            return max_width
        }
        return dynamic_width;
    }

    function start_share(e) {
        const trigger_button = e.currentTarget;
        const ele_author = $g('jsmind_author');
        const progress = $g('share_progress');
        const shared_link = $g('shared_link');
        ele_author.disabled = true;
        trigger_button.disabled = true;
        progress.style.display = '';
        progress.innerHTML = 'Creating...';
        shared_link.style.display = '';
        shared_link.innerHTML = '...';
        upload_to_cloud(e, ele_author.value).then((v) => {
            progress.innerHTML = 'Created successfully:';
            const link = `${JSMIND_ONLINE}/#m/${v.data.key}`;
            shared_link.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
            ele_author.disabled = false;
            trigger_button.disabled = false;
        });
    }

    function upload_to_cloud(e, author) {
        const mind = _jm.get_data('node_tree');
        mind.meta.author = author || 'Anonymous';
        console.log(mind);
        return fetch(MINDMAPS_API, {
            method: "POST",
            body: JSON.stringify(mind),
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            }
        }).then((res) => res.json());
    }

    function show_toast(messages, timeout_ms) {
        const toast = $q('.toast')[0];
        const toast_message = $q('.toast .toast-message')[0];
        toast_message.innerHTML = messages.map(msg => `<p>${msg}</p>`).join('');
        toast.style.display = 'block';
        return new Promise(function (resolve, _) {
            $w.setTimeout(() => {
                toast.style.display = 'none';
                resolve();
            }, timeout_ms);
        });
    }

    page_load();
})(window);
