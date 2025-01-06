(function ($w) {
    'use strict';
    const API = new jsMindApi();
    const jsMind = $w.jsMind;
    const $container = jsMind.$.g('jsmind_container')

    let _jm = null;

    function page_load() {
        init_events();
        init_mindmap();
        hash_changed();
    }

    function init_events() {
        jsMind.$.on($w, 'hashchange', hash_changed)
    }

    function hash_changed(e) {
        const hash = $w.location.hash.toLowerCase();
        load_mindmap(hash.substring(1));
    }

    function init_mindmap() {
        var options = {
            editable: false,
            container: $container,
            theme: 'greensea',
            support_html: true,
            view: {
                enable_device_pixel_ratio: true
            }
        };
        _jm = new jsMind(options);
        _jm.init();
    }

    function load_mindmap(key) {
        if (!!key) {
            console.log(key);
            API.loadByKey(key)
                .then((mind) => show_mind(mind))
        }
    }

    function show_mind(mind) {
        _jm.show(mind);
        let v = _jm.view.e_nodes;
        $container.style.width = v.clientWidth + 'px';
        $container.style.height = v.clientHeight + 'px';
    }

    page_load();
})(window);
