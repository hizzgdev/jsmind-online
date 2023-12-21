(function ($w) {
    'use strict';
    var $d = $w.document;
    var $g = function (id) {
        return $d.getElementById(id);
    };
    var $header = $d.getElementsByTagName('header')[0];
    var $footer = $d.getElementsByTagName('footer')[0];
    var $container = $g('jsmind_container');
    var _h_header = $header.clientHeight;
    var _h_footer = $footer.clientHeight;

    var jsMind = $w.jsMind;
    var _jm = null;

    function page_load() {
        init_jsMind();
        set_container_size();
        load_mind_demo();
        register_event();
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
                        right: "https://jsmind.online"
                    }
                }
            }
        };
        _jm = new jsMind(options);
        _jm.init();
    }

    function register_event() {
        jsMind.$.on($w, 'resize', reset_container_size);
        jsMind.$.on($g('jsmind_tools'), 'click', tools_handler);
        jsMind.$.on($d, 'click', hide_menu_visible);
        jsMind.$.on($g('jm_file_input'), 'change', jm_file_input_changed);
    }

    function load_mind_demo(lang) {
        const mind_lang = lang || _get_lang();
        const mind_url = `example/data_intro_${mind_lang}.json`;
        jsMind.util.ajax.get(mind_url, function (mind) {
            _jm.show(mind);
        });
    }

    function _get_lang() {
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
    function open_share_dialog(e) { }
    function open_help_dialog(e) {
        load_mind_demo();
    }
    function take_screenshot(e) {
        _jm.shoot();
    }
    function jsmind_empty(e) {
        _jm.show();
        _jm.mind.name = 'jsMind Map - ' + new Date().getTime();
    }

    var tools_handlers = {
        menu: toggle_menu_visible,
        open: open_open_dialog,
        download: open_save_dialog,
        screenshot: take_screenshot,
        share: open_share_dialog,
        empty: jsmind_empty,
        help: open_help_dialog,
        'sample-zh': () => load_mind_demo('zh'),
        'sample-en': () => load_mind_demo('en')
    };

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
        const action = find_menu_item_action(e.target);
        if (action in tools_handlers) {
            tools_handlers[action](e);
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
        var ch = $w.innerHeight - _h_header - _h_footer - 2;
        var cw = $w.innerWidth;
        $container.style.height = ch + 'px';
        $container.style.width = cw + 'px';
    }

    page_load();
})(window);
