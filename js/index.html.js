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
        };
        _jm = new jsMind(options);
        _jm.init();
    }

    function register_event() {
        jsMind.$.on($w, 'hashchange', load_mind_demo);
        jsMind.$.on($w, 'resize', reset_container_size);
        jsMind.$.on($g('jsmind_tools'), 'click', tools_handler);
        jsMind.$.on($d, 'click', hide_menu_visible);
    }

    var _current_in_demo = true;
    function _leave_demo() {
        _current_in_demo = false;
        $g('menu_item_lang_toggle').className = 'text-lang hidden';
    }
    function _enter_demo() {
        _current_in_demo = true;
        $g('menu_item_lang_toggle').className = 'text-lang visible';
    }
    function _load_mind_demo(lang) {
        var mind_url = 'example/data_intro_' + lang + '.jm';
        jsMind.util.ajax.get(mind_url, function (mind) {
            _jm.show(mind);
            _enter_demo();
        });
    }

    var _current_lang = '';
    function toggle_lang() {
        let new_lang = _current_lang === 'en' ? 'zh' : 'en';
        location.href = '#' + new_lang;
    }

    function load_mind_demo(force) {
        var lang = location.hash === '#zh' ? 'zh' : 'en';
        $g('lang_toggle').innerHTML = lang === 'zh' ? 'En' : '中';
        if (!!force || _current_lang !== lang) {
            _current_lang = lang;
            _load_mind_demo(lang);
        }
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
        var tools = $g('jsmind_tools');
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
        var e_src = e.target || event.srcElement;
        if (e_src != null && e_src.getAttribute('action') === 'menu') {
            return;
        }

        var tools = $g('jsmind_tools');
        _menu_visible = false;
        tools.className = tools.className.replace(/\s*jsmind-tools-active/gi, '');
    }

    function open_open_dialog(e) {}
    function open_save_dialog(e) {
        var mind_data = _jm.get_data();
        var mind_name = mind_data.meta.name;
        var mind_str = jsMind.util.json.json2string(mind_data);
        jsMind.util.file.save(mind_str, 'text/jsmind', mind_name + '.jm');
    }
    function open_share_dialog(e) {}
    function open_help_dialog(e) {
        load_mind_demo(true);
    }
    function take_screenshot(e) {
        _jm.screenshot.shootDownload();
    }
    function jsmind_empty(e) {
        _jm.show();
        _leave_demo();
    }

    var tools_handlers = {
        menu: toggle_menu_visible,
        open: open_open_dialog,
        save: open_save_dialog,
        screenshot: take_screenshot,
        share: open_share_dialog,
        empty: jsmind_empty,
        help: open_help_dialog,
        lang: toggle_lang,
    };

    function tools_handler(e) {
        var ele = e.target || event.srcElement;
        var action = ele.getAttribute('action');
        if (action in tools_handlers) {
            tools_handlers[action](e);
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
