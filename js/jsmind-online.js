(function ($w) {
    'use strict';
    const $d = $w.document;
    const $g = function (id) {
        return $d.getElementById(id);
    };
    const $q = function (selector) {
        return $d.querySelector(selector);
    }
    const $qa = function (selector) {
        return $d.querySelectorAll(selector);
    }
    const $header = $q('header');
    const $footer = $q('footer');
    const $layout = $g('layout');
    const $container = $g('workbench');
    const $title = $g('jsmind_title');
    const $setting_panel = $q('aside');
    const $panel_title = $q('.title-bar>label');
    const $error_panel = $g('jsmind_error');
    const _h_header = $header.clientHeight;
    const _h_footer = $footer.clientHeight;

    const API = new jsMindApi();
    const JSMIND_ONLINE = $w.location.origin;
    const jsMind = $w.jsMind;

    const HASHES = {
        NEW: "#new",
        SAMPLE: '#sample',
        LOCAL: '#local'
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
        jsMind.$.on($q('.jsmind-error .error-actions'), 'click', handle_error_action);
        $qa('.action-trigger').forEach((ele, _idx, _arr) => jsMind.$.on(ele, 'click', handle_action));
        $qa('#section_edit_metadata input[type="text"]').forEach((ele, _idx, _arr) => jsMind.$.on(ele, 'change', metadata_update));
    }

    function hash_changed(e) {
        const hash = $w.location.hash.toLowerCase();
        if (hash === HASHES.NEW) {
            jsmind_empty();
        } else if (hash === HASHES.SAMPLE) {
            load_mind_demo();
        } else if (hash.startsWith('#m/')) {
            load_mindmap(hash.substring(3, 39));
        } else if (hash === HASHES.LOCAL) {
            // Do nothing
        } else {
            hash_to(HASHES.SAMPLE);
        }
    }

    function load_mindmap(key) {
        API.loadByKey(key)
            .then((mind) => show_mind(mind))
            .catch((e) => show_error(e.message));
    }

    function load_mind_demo() {
        const lang = _get_lang_from_session() || _get_lang_from_browser();
        API.loadSample(lang)
            .then((mind) => show_mind(mind));
    }

    function show_mind(mind) {
        _jm.show(mind);
        $title.innerText = mind.meta.name;
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

    var _menu_visible = true;
    function toggle_menu_visible(e) {
        const tools = $g('jsmind_tools');
        if (_menu_visible) {
            tools.classList.remove('jsmind-tools-active');
            _menu_visible = false;
        } else {
            tools.classList.add('jsmind-tools-active');
            _menu_visible = true;
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
        tools.classList.remove('jsmind-tools-active');
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

    function show_setting_panel(sectionId, panelTitle) {
        if (!!sectionId) {
            $qa('aside#jsmind_sidebar>section').forEach((section) => {
                section.style.display = 'none';
            })
            const section = $g(sectionId);
            section.style.display = '';
        }
        $panel_title.innerHTML = panelTitle || '';

        if (_setting_panel_visible) { return; }
        const panel_width = calc_setting_panel_width();
        _setting_panel_visible = true;
        $setting_panel.style.width = (panel_width - 2) + 'px';
        $layout.className = 'setting-panel-visible';
        set_container_size();
        _jm.view.e_panel.scrollBy(panel_width / 2, 0);
    }

    function hide_setting_panel() {
        if (!_setting_panel_visible) { return; }
        const panel_width = calc_setting_panel_width();
        _setting_panel_visible = true;
        _setting_panel_visible = false;
        $layout.className = 'setting-panel-hidden';
        _jm.view.e_panel.scrollBy(-panel_width / 2, 0);
        set_container_size();
    }
    function open_share_dialog(e) {
        $q('button.action-trigger[action="share"]').disabled = false;
        $g('share_progress').style.display = 'none';
        $g('shared_link').style.display = 'none';
        show_setting_panel('section_share_via_link');
    }
    function open_meta_panel(e) {
        $q('#section_edit_metadata input[name="name"]').value = _jm.mind.name;
        $q('#section_edit_metadata input[name="author"]').value = _jm.mind.author;
        $q('#section_edit_metadata input[name="version"]').value = _jm.mind.version;
        show_setting_panel('section_edit_metadata');
    }

    function metadata_update(e) {
        const input = e.target;
        const field_name = input.name;
        _jm.mind[field_name] = input.value;

        if (field_name === 'name') {
            $title.innerText = input.value;
        }
    }

    function open_help_dialog(e) {
        hash_to(HASHES.SAMPLE);
    }
    function take_screenshot(e) {
        _jm.shoot();
    }
    function jsmind_empty(e) {
        const mind = {
            meta: {
                name: 'Empty Mindmap',
                author: 'jsmind.online',
                version: _jm.version
            },
            format: 'node_tree',
            data: { id: 'root', topic: 'Empty' }
        }
        show_mind(mind);
    }

    const action_handlers = {
        'menu': toggle_menu_visible,
        'open': open_open_dialog,
        'download': open_save_dialog,
        'screenshot': take_screenshot,
        'empty': () => hash_to(HASHES.NEW),
        'help': open_help_dialog,
        'sample': () => hash_to(HASHES.SAMPLE),
        'close-setting-panel': hide_setting_panel,
        'create-shared-link': open_share_dialog,
        'open-meta-panel': open_meta_panel,
        'lang-zh': () => change_lang('zh'),
        'lang-en': () => change_lang('en'),
        'share': start_share,
        'back': go_back,
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

    function go_back() {
        $w.history.back();
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

    function find_action_trigger(e) {
        const trigger = e.currentTarget;
        if (trigger.classList.contains('action-trigger')) {
            return trigger;
        }
        if (trigger.classList.contains('action-trigger-delegate')) {
            return e.target;
        }
        return null;
    }

    function handle_action(e) {
        const trigger = find_action_trigger(e);
        if (!trigger) {
            console.warn('can not find the action trigger');
            return false;
        }
        const action = trigger.getAttribute('action');
        if (action in action_handlers) {
            const result = action_handlers[action](e);
            return result || true;
        } else {
            console.warn(`invalid action: ${action}`);
        }
        return false;
    }

    function jm_file_input_changed(e) {
        if (this.files.length > 0) {
            var file_data = this.files[0];
            jsMind.util.file.read(file_data, function (jsmind_data, jsmind_name) {
                var mind = jsMind.util.json.string2json(jsmind_data);
                if (!!mind) {
                    show_mind(mind);
                    hash_to(HASHES.LOCAL);
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
        const progress = $g('share_progress');
        const shared_link = $g('shared_link');
        trigger_button.disabled = true;
        progress.style.display = '';
        progress.innerHTML = 'Creating...';
        shared_link.style.display = '';
        shared_link.innerHTML = '...';
        upload_to_cloud(e).then((v) => {
            progress.innerHTML = 'Created successfully:';
            const link = `${JSMIND_ONLINE}/#m/${v.data.key}`;
            shared_link.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
            trigger_button.disabled = false;
        });
    }

    function upload_to_cloud(e) {
        const mind = _jm.get_data('node_tree');
        return API.share(mind);
    }

    function hide_error(e) {
        $error_panel.style.display = 'none';
        $layout.style.display = '';
    }

    function show_error(message, actions) {
        $q('.jsmind-error .error-message').innerHTML = `<p>${message}</p>`;
        const final_actions = actions || [['empty', 'New'], ['sample', 'Sample']];
        const actions_html = final_actions.map(action => `<span action="${action[0]}" class="action-trigger">${action[1]}</span>`).join('');
        $q('.jsmind-error .error-actions').innerHTML = actions_html;
        $layout.style.display = 'none';
        $error_panel.style.display = 'block';
    }

    function handle_error_action(e) {
        hide_error(e);
        if (!handle_action(e)) {
            go_back();
        }
    }

    page_load();
})(window);
