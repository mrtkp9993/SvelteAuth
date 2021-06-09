
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
    }
    function compute_slots(slots) {
        const result = {};
        for (const key in slots) {
            result[key] = true;
        }
        return result;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    var e=function(t,n){return (e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t;}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n]);})(t,n)};function t(t,n){if("function"!=typeof n&&null!==n)throw new TypeError("Class extends value "+String(n)+" is not a constructor or null");function r(){this.constructor=t;}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r);}var n=function(){return (n=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var o in t=arguments[n])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};function r(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var o=0;for(r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);}return n}function o(e,t,n,r){return new(n||(n=Promise))((function(o,i){function a(e){try{s(r.next(e));}catch(e){i(e);}}function c(e){try{s(r.throw(e));}catch(e){i(e);}}function s(e){var t;e.done?o(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t);}))).then(a,c);}s((r=r.apply(e,t||[])).next());}))}function i(e,t){var n,r,o,i,a={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function c(i){return function(c){return function(i){if(n)throw new TypeError("Generator is already executing.");for(;a;)try{if(n=1,r&&(o=2&i[0]?r.return:i[0]?r.throw||((o=r.return)&&o.call(r),0):r.next)&&!(o=o.call(r,i[1])).done)return o;switch(r=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return a.label++,{value:i[1],done:!1};case 5:a.label++,r=i[1],i=[0];continue;case 7:i=a.ops.pop(),a.trys.pop();continue;default:if(!(o=a.trys,(o=o.length>0&&o[o.length-1])||6!==i[0]&&2!==i[0])){a=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){a.label=i[1];break}if(6===i[0]&&a.label<o[1]){a.label=o[1],o=i;break}if(o&&a.label<o[2]){a.label=o[2],a.ops.push(i);break}o[2]&&a.ops.pop(),a.trys.pop();continue}i=t.call(e,a);}catch(e){i=[6,e],r=0;}finally{n=o=0;}if(5&i[0])throw i[1];return {value:i[0]?i[1]:void 0,done:!0}}([i,c])}}}var a="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function c(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}function s(e,t){return e(t={exports:{}},t.exports),t.exports}var u=function(e){return e&&e.Math==Math&&e},l=u("object"==typeof globalThis&&globalThis)||u("object"==typeof window&&window)||u("object"==typeof self&&self)||u("object"==typeof a&&a)||function(){return this}()||Function("return this")(),f=function(e){try{return !!e()}catch(e){return !0}},d=!f((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]})),p={}.propertyIsEnumerable,h=Object.getOwnPropertyDescriptor,y={f:h&&!p.call({1:2},1)?function(e){var t=h(this,e);return !!t&&t.enumerable}:p},v=function(e,t){return {enumerable:!(1&e),configurable:!(2&e),writable:!(4&e),value:t}},m={}.toString,g=function(e){return m.call(e).slice(8,-1)},b="".split,w=f((function(){return !Object("z").propertyIsEnumerable(0)}))?function(e){return "String"==g(e)?b.call(e,""):Object(e)}:Object,S=function(e){if(null==e)throw TypeError("Can't call method on "+e);return e},_=function(e){return w(S(e))},k=function(e){return "object"==typeof e?null!==e:"function"==typeof e},I=function(e,t){if(!k(e))return e;var n,r;if(t&&"function"==typeof(n=e.toString)&&!k(r=n.call(e)))return r;if("function"==typeof(n=e.valueOf)&&!k(r=n.call(e)))return r;if(!t&&"function"==typeof(n=e.toString)&&!k(r=n.call(e)))return r;throw TypeError("Can't convert object to primitive value")},T=function(e){return Object(S(e))},O={}.hasOwnProperty,E=function(e,t){return O.call(T(e),t)},x=l.document,R=k(x)&&k(x.createElement),L=function(e){return R?x.createElement(e):{}},C=!d&&!f((function(){return 7!=Object.defineProperty(L("div"),"a",{get:function(){return 7}}).a})),j=Object.getOwnPropertyDescriptor,U={f:d?j:function(e,t){if(e=_(e),t=I(t,!0),C)try{return j(e,t)}catch(e){}if(E(e,t))return v(!y.f.call(e,t),e[t])}},A=function(e){if(!k(e))throw TypeError(String(e)+" is not an object");return e},P=Object.defineProperty,F={f:d?P:function(e,t,n){if(A(e),t=I(t,!0),A(n),C)try{return P(e,t,n)}catch(e){}if("get"in n||"set"in n)throw TypeError("Accessors not supported");return "value"in n&&(e[t]=n.value),e}},K=d?function(e,t,n){return F.f(e,t,v(1,n))}:function(e,t,n){return e[t]=n,e},W=function(e,t){try{K(l,e,t);}catch(n){l[e]=t;}return t},z=l["__core-js_shared__"]||W("__core-js_shared__",{}),V=Function.toString;"function"!=typeof z.inspectSource&&(z.inspectSource=function(e){return V.call(e)});var Z,X,N,G=z.inspectSource,J=l.WeakMap,D="function"==typeof J&&/native code/.test(G(J)),Y=s((function(e){(e.exports=function(e,t){return z[e]||(z[e]=void 0!==t?t:{})})("versions",[]).push({version:"3.11.0",mode:"global",copyright:"© 2021 Denis Pushkarev (zloirock.ru)"});})),B=0,M=Math.random(),q=function(e){return "Symbol("+String(void 0===e?"":e)+")_"+(++B+M).toString(36)},H=Y("keys"),Q=function(e){return H[e]||(H[e]=q(e))},$={},ee=l.WeakMap;if(D){var te=z.state||(z.state=new ee),ne=te.get,re=te.has,oe=te.set;Z=function(e,t){if(re.call(te,e))throw new TypeError("Object already initialized");return t.facade=e,oe.call(te,e,t),t},X=function(e){return ne.call(te,e)||{}},N=function(e){return re.call(te,e)};}else {var ie=Q("state");$[ie]=!0,Z=function(e,t){if(E(e,ie))throw new TypeError("Object already initialized");return t.facade=e,K(e,ie,t),t},X=function(e){return E(e,ie)?e[ie]:{}},N=function(e){return E(e,ie)};}var ae,ce,se={set:Z,get:X,has:N,enforce:function(e){return N(e)?X(e):Z(e,{})},getterFor:function(e){return function(t){var n;if(!k(t)||(n=X(t)).type!==e)throw TypeError("Incompatible receiver, "+e+" required");return n}}},ue=s((function(e){var t=se.get,n=se.enforce,r=String(String).split("String");(e.exports=function(e,t,o,i){var a,c=!!i&&!!i.unsafe,s=!!i&&!!i.enumerable,u=!!i&&!!i.noTargetGet;"function"==typeof o&&("string"!=typeof t||E(o,"name")||K(o,"name",t),(a=n(o)).source||(a.source=r.join("string"==typeof t?t:""))),e!==l?(c?!u&&e[t]&&(s=!0):delete e[t],s?e[t]=o:K(e,t,o)):s?e[t]=o:W(t,o);})(Function.prototype,"toString",(function(){return "function"==typeof this&&t(this).source||G(this)}));})),le=l,fe=function(e){return "function"==typeof e?e:void 0},de=function(e,t){return arguments.length<2?fe(le[e])||fe(l[e]):le[e]&&le[e][t]||l[e]&&l[e][t]},pe=Math.ceil,he=Math.floor,ye=function(e){return isNaN(e=+e)?0:(e>0?he:pe)(e)},ve=Math.min,me=function(e){return e>0?ve(ye(e),9007199254740991):0},ge=Math.max,be=Math.min,we=function(e){return function(t,n,r){var o,i=_(t),a=me(i.length),c=function(e,t){var n=ye(e);return n<0?ge(n+t,0):be(n,t)}(r,a);if(e&&n!=n){for(;a>c;)if((o=i[c++])!=o)return !0}else for(;a>c;c++)if((e||c in i)&&i[c]===n)return e||c||0;return !e&&-1}},Se={includes:we(!0),indexOf:we(!1)},_e=Se.indexOf,ke=function(e,t){var n,r=_(e),o=0,i=[];for(n in r)!E($,n)&&E(r,n)&&i.push(n);for(;t.length>o;)E(r,n=t[o++])&&(~_e(i,n)||i.push(n));return i},Ie=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],Te=Ie.concat("length","prototype"),Oe={f:Object.getOwnPropertyNames||function(e){return ke(e,Te)}},Ee={f:Object.getOwnPropertySymbols},xe=de("Reflect","ownKeys")||function(e){var t=Oe.f(A(e)),n=Ee.f;return n?t.concat(n(e)):t},Re=function(e,t){for(var n=xe(t),r=F.f,o=U.f,i=0;i<n.length;i++){var a=n[i];E(e,a)||r(e,a,o(t,a));}},Le=/#|\.prototype\./,Ce=function(e,t){var n=Ue[je(e)];return n==Pe||n!=Ae&&("function"==typeof t?f(t):!!t)},je=Ce.normalize=function(e){return String(e).replace(Le,".").toLowerCase()},Ue=Ce.data={},Ae=Ce.NATIVE="N",Pe=Ce.POLYFILL="P",Fe=Ce,Ke=U.f,We=function(e,t){var n,r,o,i,a,c=e.target,s=e.global,u=e.stat;if(n=s?l:u?l[c]||W(c,{}):(l[c]||{}).prototype)for(r in t){if(i=t[r],o=e.noTargetGet?(a=Ke(n,r))&&a.value:n[r],!Fe(s?r:c+(u?".":"#")+r,e.forced)&&void 0!==o){if(typeof i==typeof o)continue;Re(i,o);}(e.sham||o&&o.sham)&&K(i,"sham",!0),ue(n,r,i,e);}},ze="process"==g(l.process),Ve=de("navigator","userAgent")||"",Ze=l.process,Xe=Ze&&Ze.versions,Ne=Xe&&Xe.v8;Ne?ce=(ae=Ne.split("."))[0]+ae[1]:Ve&&(!(ae=Ve.match(/Edge\/(\d+)/))||ae[1]>=74)&&(ae=Ve.match(/Chrome\/(\d+)/))&&(ce=ae[1]);var Ge,Je=ce&&+ce,De=!!Object.getOwnPropertySymbols&&!f((function(){return !Symbol.sham&&(ze?38===Je:Je>37&&Je<41)})),Ye=De&&!Symbol.sham&&"symbol"==typeof Symbol.iterator,Be=Y("wks"),Me=l.Symbol,qe=Ye?Me:Me&&Me.withoutSetter||q,He=function(e){return E(Be,e)&&(De||"string"==typeof Be[e])||(De&&E(Me,e)?Be[e]=Me[e]:Be[e]=qe("Symbol."+e)),Be[e]},Qe=He("match"),$e=function(e){if(function(e){var t;return k(e)&&(void 0!==(t=e[Qe])?!!t:"RegExp"==g(e))}(e))throw TypeError("The method doesn't accept regular expressions");return e},et=He("match"),tt=function(e){var t=/./;try{"/./"[e](t);}catch(n){try{return t[et]=!1,"/./"[e](t)}catch(e){}}return !1},nt=U.f,rt="".startsWith,ot=Math.min,it=tt("startsWith"),at=!(it||(Ge=nt(String.prototype,"startsWith"),!Ge||Ge.writable));We({target:"String",proto:!0,forced:!at&&!it},{startsWith:function(e){var t=String(S(this));$e(e);var n=me(ot(arguments.length>1?arguments[1]:void 0,t.length)),r=String(e);return rt?rt.call(t,r,n):t.slice(n,n+r.length)===r}});var ct=function(e){if("function"!=typeof e)throw TypeError(String(e)+" is not a function");return e},st=function(e,t,n){if(ct(e),void 0===t)return e;switch(n){case 0:return function(){return e.call(t)};case 1:return function(n){return e.call(t,n)};case 2:return function(n,r){return e.call(t,n,r)};case 3:return function(n,r,o){return e.call(t,n,r,o)}}return function(){return e.apply(t,arguments)}},ut=Function.call,lt=function(e,t,n){return st(ut,l[e].prototype[t],n)};lt("String","startsWith");var ft=Array.isArray||function(e){return "Array"==g(e)},dt=function(e,t,n){var r=I(t);r in e?F.f(e,r,v(0,n)):e[r]=n;},pt=He("species"),ht=function(e,t){var n;return ft(e)&&("function"!=typeof(n=e.constructor)||n!==Array&&!ft(n.prototype)?k(n)&&null===(n=n[pt])&&(n=void 0):n=void 0),new(void 0===n?Array:n)(0===t?0:t)},yt=He("species"),vt=He("isConcatSpreadable"),mt=Je>=51||!f((function(){var e=[];return e[vt]=!1,e.concat()[0]!==e})),gt=function(e){return Je>=51||!f((function(){var t=[];return (t.constructor={})[yt]=function(){return {foo:1}},1!==t[e](Boolean).foo}))}("concat"),bt=function(e){if(!k(e))return !1;var t=e[vt];return void 0!==t?!!t:ft(e)};We({target:"Array",proto:!0,forced:!mt||!gt},{concat:function(e){var t,n,r,o,i,a=T(this),c=ht(a,0),s=0;for(t=-1,r=arguments.length;t<r;t++)if(bt(i=-1===t?a:arguments[t])){if(s+(o=me(i.length))>9007199254740991)throw TypeError("Maximum allowed index exceeded");for(n=0;n<o;n++,s++)n in i&&dt(c,s,i[n]);}else {if(s>=9007199254740991)throw TypeError("Maximum allowed index exceeded");dt(c,s++,i);}return c.length=s,c}});var wt={};wt[He("toStringTag")]="z";var St="[object z]"===String(wt),_t=He("toStringTag"),kt="Arguments"==g(function(){return arguments}()),It=St?g:function(e){var t,n,r;return void 0===e?"Undefined":null===e?"Null":"string"==typeof(n=function(e,t){try{return e[t]}catch(e){}}(t=Object(e),_t))?n:kt?g(t):"Object"==(r=g(t))&&"function"==typeof t.callee?"Arguments":r},Tt=St?{}.toString:function(){return "[object "+It(this)+"]"};St||ue(Object.prototype,"toString",Tt,{unsafe:!0});var Ot,Et=Object.keys||function(e){return ke(e,Ie)},xt=d?Object.defineProperties:function(e,t){A(e);for(var n,r=Et(t),o=r.length,i=0;o>i;)F.f(e,n=r[i++],t[n]);return e},Rt=de("document","documentElement"),Lt=Q("IE_PROTO"),Ct=function(){},jt=function(e){return "<script>"+e+"<\/script>"},Ut=function(){try{Ot=document.domain&&new ActiveXObject("htmlfile");}catch(e){}var e,t;Ut=Ot?function(e){e.write(jt("")),e.close();var t=e.parentWindow.Object;return e=null,t}(Ot):((t=L("iframe")).style.display="none",Rt.appendChild(t),t.src=String("javascript:"),(e=t.contentWindow.document).open(),e.write(jt("document.F=Object")),e.close(),e.F);for(var n=Ie.length;n--;)delete Ut.prototype[Ie[n]];return Ut()};$[Lt]=!0;var At=Object.create||function(e,t){var n;return null!==e?(Ct.prototype=A(e),n=new Ct,Ct.prototype=null,n[Lt]=e):n=Ut(),void 0===t?n:xt(n,t)},Pt=Oe.f,Ft={}.toString,Kt="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[],Wt={f:function(e){return Kt&&"[object Window]"==Ft.call(e)?function(e){try{return Pt(e)}catch(e){return Kt.slice()}}(e):Pt(_(e))}},zt={f:He},Vt=F.f,Zt=function(e){var t=le.Symbol||(le.Symbol={});E(t,e)||Vt(t,e,{value:zt.f(e)});},Xt=F.f,Nt=He("toStringTag"),Gt=function(e,t,n){e&&!E(e=n?e:e.prototype,Nt)&&Xt(e,Nt,{configurable:!0,value:t});},Jt=[].push,Dt=function(e){var t=1==e,n=2==e,r=3==e,o=4==e,i=6==e,a=7==e,c=5==e||i;return function(s,u,l,f){for(var d,p,h=T(s),y=w(h),v=st(u,l,3),m=me(y.length),g=0,b=f||ht,S=t?b(s,m):n||a?b(s,0):void 0;m>g;g++)if((c||g in y)&&(p=v(d=y[g],g,h),e))if(t)S[g]=p;else if(p)switch(e){case 3:return !0;case 5:return d;case 6:return g;case 2:Jt.call(S,d);}else switch(e){case 4:return !1;case 7:Jt.call(S,d);}return i?-1:r||o?o:S}},Yt={forEach:Dt(0),map:Dt(1),filter:Dt(2),some:Dt(3),every:Dt(4),find:Dt(5),findIndex:Dt(6),filterOut:Dt(7)}.forEach,Bt=Q("hidden"),Mt=He("toPrimitive"),qt=se.set,Ht=se.getterFor("Symbol"),Qt=Object.prototype,$t=l.Symbol,en=de("JSON","stringify"),tn=U.f,nn=F.f,rn=Wt.f,on=y.f,an=Y("symbols"),cn=Y("op-symbols"),sn=Y("string-to-symbol-registry"),un=Y("symbol-to-string-registry"),ln=Y("wks"),fn=l.QObject,dn=!fn||!fn.prototype||!fn.prototype.findChild,pn=d&&f((function(){return 7!=At(nn({},"a",{get:function(){return nn(this,"a",{value:7}).a}})).a}))?function(e,t,n){var r=tn(Qt,t);r&&delete Qt[t],nn(e,t,n),r&&e!==Qt&&nn(Qt,t,r);}:nn,hn=function(e,t){var n=an[e]=At($t.prototype);return qt(n,{type:"Symbol",tag:e,description:t}),d||(n.description=t),n},yn=Ye?function(e){return "symbol"==typeof e}:function(e){return Object(e)instanceof $t},vn=function(e,t,n){e===Qt&&vn(cn,t,n),A(e);var r=I(t,!0);return A(n),E(an,r)?(n.enumerable?(E(e,Bt)&&e[Bt][r]&&(e[Bt][r]=!1),n=At(n,{enumerable:v(0,!1)})):(E(e,Bt)||nn(e,Bt,v(1,{})),e[Bt][r]=!0),pn(e,r,n)):nn(e,r,n)},mn=function(e,t){A(e);var n=_(t),r=Et(n).concat(Sn(n));return Yt(r,(function(t){d&&!gn.call(n,t)||vn(e,t,n[t]);})),e},gn=function(e){var t=I(e,!0),n=on.call(this,t);return !(this===Qt&&E(an,t)&&!E(cn,t))&&(!(n||!E(this,t)||!E(an,t)||E(this,Bt)&&this[Bt][t])||n)},bn=function(e,t){var n=_(e),r=I(t,!0);if(n!==Qt||!E(an,r)||E(cn,r)){var o=tn(n,r);return !o||!E(an,r)||E(n,Bt)&&n[Bt][r]||(o.enumerable=!0),o}},wn=function(e){var t=rn(_(e)),n=[];return Yt(t,(function(e){E(an,e)||E($,e)||n.push(e);})),n},Sn=function(e){var t=e===Qt,n=rn(t?cn:_(e)),r=[];return Yt(n,(function(e){!E(an,e)||t&&!E(Qt,e)||r.push(an[e]);})),r};if(De||(ue(($t=function(){if(this instanceof $t)throw TypeError("Symbol is not a constructor");var e=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,t=q(e),n=function(e){this===Qt&&n.call(cn,e),E(this,Bt)&&E(this[Bt],t)&&(this[Bt][t]=!1),pn(this,t,v(1,e));};return d&&dn&&pn(Qt,t,{configurable:!0,set:n}),hn(t,e)}).prototype,"toString",(function(){return Ht(this).tag})),ue($t,"withoutSetter",(function(e){return hn(q(e),e)})),y.f=gn,F.f=vn,U.f=bn,Oe.f=Wt.f=wn,Ee.f=Sn,zt.f=function(e){return hn(He(e),e)},d&&(nn($t.prototype,"description",{configurable:!0,get:function(){return Ht(this).description}}),ue(Qt,"propertyIsEnumerable",gn,{unsafe:!0}))),We({global:!0,wrap:!0,forced:!De,sham:!De},{Symbol:$t}),Yt(Et(ln),(function(e){Zt(e);})),We({target:"Symbol",stat:!0,forced:!De},{for:function(e){var t=String(e);if(E(sn,t))return sn[t];var n=$t(t);return sn[t]=n,un[n]=t,n},keyFor:function(e){if(!yn(e))throw TypeError(e+" is not a symbol");if(E(un,e))return un[e]},useSetter:function(){dn=!0;},useSimple:function(){dn=!1;}}),We({target:"Object",stat:!0,forced:!De,sham:!d},{create:function(e,t){return void 0===t?At(e):mn(At(e),t)},defineProperty:vn,defineProperties:mn,getOwnPropertyDescriptor:bn}),We({target:"Object",stat:!0,forced:!De},{getOwnPropertyNames:wn,getOwnPropertySymbols:Sn}),We({target:"Object",stat:!0,forced:f((function(){Ee.f(1);}))},{getOwnPropertySymbols:function(e){return Ee.f(T(e))}}),en){var _n=!De||f((function(){var e=$t();return "[null]"!=en([e])||"{}"!=en({a:e})||"{}"!=en(Object(e))}));We({target:"JSON",stat:!0,forced:_n},{stringify:function(e,t,n){for(var r,o=[e],i=1;arguments.length>i;)o.push(arguments[i++]);if(r=t,(k(t)||void 0!==e)&&!yn(e))return ft(t)||(t=function(e,t){if("function"==typeof r&&(t=r.call(this,e,t)),!yn(t))return t}),o[1]=t,en.apply(null,o)}});}$t.prototype[Mt]||K($t.prototype,Mt,$t.prototype.valueOf),Gt($t,"Symbol"),$[Bt]=!0,Zt("asyncIterator");var kn=F.f,In=l.Symbol;if(d&&"function"==typeof In&&(!("description"in In.prototype)||void 0!==In().description)){var Tn={},On=function(){var e=arguments.length<1||void 0===arguments[0]?void 0:String(arguments[0]),t=this instanceof On?new In(e):void 0===e?In():In(e);return ""===e&&(Tn[t]=!0),t};Re(On,In);var En=On.prototype=In.prototype;En.constructor=On;var xn=En.toString,Rn="Symbol(test)"==String(In("test")),Ln=/^Symbol\((.*)\)[^)]+$/;kn(En,"description",{configurable:!0,get:function(){var e=k(this)?this.valueOf():this,t=xn.call(e);if(E(Tn,e))return "";var n=Rn?t.slice(7,-1):t.replace(Ln,"$1");return ""===n?void 0:n}}),We({global:!0,forced:!0},{Symbol:On});}Zt("hasInstance"),Zt("isConcatSpreadable"),Zt("iterator"),Zt("match"),Zt("matchAll"),Zt("replace"),Zt("search"),Zt("species"),Zt("split"),Zt("toPrimitive"),Zt("toStringTag"),Zt("unscopables"),Gt(l.JSON,"JSON",!0),Gt(Math,"Math",!0),We({global:!0},{Reflect:{}}),Gt(l.Reflect,"Reflect",!0),le.Symbol;var Cn,jn,Un,An=function(e){return function(t,n){var r,o,i=String(S(t)),a=ye(n),c=i.length;return a<0||a>=c?e?"":void 0:(r=i.charCodeAt(a))<55296||r>56319||a+1===c||(o=i.charCodeAt(a+1))<56320||o>57343?e?i.charAt(a):r:e?i.slice(a,a+2):o-56320+(r-55296<<10)+65536}},Pn={codeAt:An(!1),charAt:An(!0)},Fn=!f((function(){function e(){}return e.prototype.constructor=null,Object.getPrototypeOf(new e)!==e.prototype})),Kn=Q("IE_PROTO"),Wn=Object.prototype,zn=Fn?Object.getPrototypeOf:function(e){return e=T(e),E(e,Kn)?e[Kn]:"function"==typeof e.constructor&&e instanceof e.constructor?e.constructor.prototype:e instanceof Object?Wn:null},Vn=He("iterator"),Zn=!1;[].keys&&("next"in(Un=[].keys())?(jn=zn(zn(Un)))!==Object.prototype&&(Cn=jn):Zn=!0),(null==Cn||f((function(){var e={};return Cn[Vn].call(e)!==e})))&&(Cn={}),E(Cn,Vn)||K(Cn,Vn,(function(){return this}));var Xn={IteratorPrototype:Cn,BUGGY_SAFARI_ITERATORS:Zn},Nn={},Gn=Xn.IteratorPrototype,Jn=function(){return this},Dn=Object.setPrototypeOf||("__proto__"in{}?function(){var e,t=!1,n={};try{(e=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(n,[]),t=n instanceof Array;}catch(e){}return function(n,r){return A(n),function(e){if(!k(e)&&null!==e)throw TypeError("Can't set "+String(e)+" as a prototype")}(r),t?e.call(n,r):n.__proto__=r,n}}():void 0),Yn=Xn.IteratorPrototype,Bn=Xn.BUGGY_SAFARI_ITERATORS,Mn=He("iterator"),qn=function(){return this},Hn=function(e,t,n,r,o,i,a){!function(e,t,n){var r=t+" Iterator";e.prototype=At(Gn,{next:v(1,n)}),Gt(e,r,!1),Nn[r]=Jn;}(n,t,r);var c,s,u,l=function(e){if(e===o&&y)return y;if(!Bn&&e in p)return p[e];switch(e){case"keys":case"values":case"entries":return function(){return new n(this,e)}}return function(){return new n(this)}},f=t+" Iterator",d=!1,p=e.prototype,h=p[Mn]||p["@@iterator"]||o&&p[o],y=!Bn&&h||l(o),m="Array"==t&&p.entries||h;if(m&&(c=zn(m.call(new e)),Yn!==Object.prototype&&c.next&&(zn(c)!==Yn&&(Dn?Dn(c,Yn):"function"!=typeof c[Mn]&&K(c,Mn,qn)),Gt(c,f,!0))),"values"==o&&h&&"values"!==h.name&&(d=!0,y=function(){return h.call(this)}),p[Mn]!==y&&K(p,Mn,y),Nn[t]=y,o)if(s={values:l("values"),keys:i?y:l("keys"),entries:l("entries")},a)for(u in s)(Bn||d||!(u in p))&&ue(p,u,s[u]);else We({target:t,proto:!0,forced:Bn||d},s);return s},Qn=Pn.charAt,$n=se.set,er=se.getterFor("String Iterator");Hn(String,"String",(function(e){$n(this,{type:"String Iterator",string:String(e),index:0});}),(function(){var e,t=er(this),n=t.string,r=t.index;return r>=n.length?{value:void 0,done:!0}:(e=Qn(n,r),t.index+=e.length,{value:e,done:!1})}));var tr=function(e){var t=e.return;if(void 0!==t)return A(t.call(e)).value},nr=function(e,t,n,r){try{return r?t(A(n)[0],n[1]):t(n)}catch(t){throw tr(e),t}},rr=He("iterator"),or=Array.prototype,ir=function(e){return void 0!==e&&(Nn.Array===e||or[rr]===e)},ar=He("iterator"),cr=function(e){if(null!=e)return e[ar]||e["@@iterator"]||Nn[It(e)]},sr=He("iterator"),ur=!1;try{var lr=0,fr={next:function(){return {done:!!lr++}},return:function(){ur=!0;}};fr[sr]=function(){return this},Array.from(fr,(function(){throw 2}));}catch(e){}var dr=function(e,t){if(!t&&!ur)return !1;var n=!1;try{var r={};r[sr]=function(){return {next:function(){return {done:n=!0}}}},e(r);}catch(e){}return n},pr=!dr((function(e){Array.from(e);}));We({target:"Array",stat:!0,forced:pr},{from:function(e){var t,n,r,o,i,a,c=T(e),s="function"==typeof this?this:Array,u=arguments.length,l=u>1?arguments[1]:void 0,f=void 0!==l,d=cr(c),p=0;if(f&&(l=st(l,u>2?arguments[2]:void 0,2)),null==d||s==Array&&ir(d))for(n=new s(t=me(c.length));t>p;p++)a=f?l(c[p],p):c[p],dt(n,p,a);else for(i=(o=d.call(c)).next,n=new s;!(r=i.call(o)).done;p++)a=f?nr(o,l,[r.value,p],!0):r.value,dt(n,p,a);return n.length=p,n}}),le.Array.from;var hr,yr="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof DataView,vr=F.f,mr=l.Int8Array,gr=mr&&mr.prototype,br=l.Uint8ClampedArray,wr=br&&br.prototype,Sr=mr&&zn(mr),_r=gr&&zn(gr),kr=Object.prototype,Ir=kr.isPrototypeOf,Tr=He("toStringTag"),Or=q("TYPED_ARRAY_TAG"),Er=yr&&!!Dn&&"Opera"!==It(l.opera),xr={Int8Array:1,Uint8Array:1,Uint8ClampedArray:1,Int16Array:2,Uint16Array:2,Int32Array:4,Uint32Array:4,Float32Array:4,Float64Array:8},Rr={BigInt64Array:8,BigUint64Array:8},Lr=function(e){if(!k(e))return !1;var t=It(e);return E(xr,t)||E(Rr,t)};for(hr in xr)l[hr]||(Er=!1);if((!Er||"function"!=typeof Sr||Sr===Function.prototype)&&(Sr=function(){throw TypeError("Incorrect invocation")},Er))for(hr in xr)l[hr]&&Dn(l[hr],Sr);if((!Er||!_r||_r===kr)&&(_r=Sr.prototype,Er))for(hr in xr)l[hr]&&Dn(l[hr].prototype,_r);if(Er&&zn(wr)!==_r&&Dn(wr,_r),d&&!E(_r,Tr))for(hr in vr(_r,Tr,{get:function(){return k(this)?this[Or]:void 0}}),xr)l[hr]&&K(l[hr],Or,hr);var Cr=function(e){if(Lr(e))return e;throw TypeError("Target is not a typed array")},jr=function(e){if(Dn){if(Ir.call(Sr,e))return e}else for(var t in xr)if(E(xr,hr)){var n=l[t];if(n&&(e===n||Ir.call(n,e)))return e}throw TypeError("Target is not a typed array constructor")},Ur=function(e,t,n){if(d){if(n)for(var r in xr){var o=l[r];o&&E(o.prototype,e)&&delete o.prototype[e];}_r[e]&&!n||ue(_r,e,n?t:Er&&gr[e]||t);}},Ar=He("species"),Pr=Cr,Fr=jr,Kr=[].slice;Ur("slice",(function(e,t){for(var n=Kr.call(Pr(this),e,t),r=function(e,t){var n,r=A(e).constructor;return void 0===r||null==(n=A(r)[Ar])?t:ct(n)}(this,this.constructor),o=0,i=n.length,a=new(Fr(r))(i);i>o;)a[o]=n[o++];return a}),f((function(){new Int8Array(1).slice();})));var Wr=He("unscopables"),zr=Array.prototype;null==zr[Wr]&&F.f(zr,Wr,{configurable:!0,value:At(null)});var Vr=function(e){zr[Wr][e]=!0;},Zr=Se.includes;We({target:"Array",proto:!0},{includes:function(e){return Zr(this,e,arguments.length>1?arguments[1]:void 0)}}),Vr("includes"),lt("Array","includes"),We({target:"String",proto:!0,forced:!tt("includes")},{includes:function(e){return !!~String(S(this)).indexOf($e(e),arguments.length>1?arguments[1]:void 0)}}),lt("String","includes");var Xr=!f((function(){return Object.isExtensible(Object.preventExtensions({}))})),Nr=s((function(e){var t=F.f,n=q("meta"),r=0,o=Object.isExtensible||function(){return !0},i=function(e){t(e,n,{value:{objectID:"O"+ ++r,weakData:{}}});},a=e.exports={REQUIRED:!1,fastKey:function(e,t){if(!k(e))return "symbol"==typeof e?e:("string"==typeof e?"S":"P")+e;if(!E(e,n)){if(!o(e))return "F";if(!t)return "E";i(e);}return e[n].objectID},getWeakData:function(e,t){if(!E(e,n)){if(!o(e))return !0;if(!t)return !1;i(e);}return e[n].weakData},onFreeze:function(e){return Xr&&a.REQUIRED&&o(e)&&!E(e,n)&&i(e),e}};$[n]=!0;}));Nr.REQUIRED,Nr.fastKey,Nr.getWeakData,Nr.onFreeze;var Gr=function(e,t){this.stopped=e,this.result=t;},Jr=function(e,t,n){var r,o,i,a,c,s,u,l=n&&n.that,f=!(!n||!n.AS_ENTRIES),d=!(!n||!n.IS_ITERATOR),p=!(!n||!n.INTERRUPTED),h=st(t,l,1+f+p),y=function(e){return r&&tr(r),new Gr(!0,e)},v=function(e){return f?(A(e),p?h(e[0],e[1],y):h(e[0],e[1])):p?h(e,y):h(e)};if(d)r=e;else {if("function"!=typeof(o=cr(e)))throw TypeError("Target is not iterable");if(ir(o)){for(i=0,a=me(e.length);a>i;i++)if((c=v(e[i]))&&c instanceof Gr)return c;return new Gr(!1)}r=o.call(e);}for(s=r.next;!(u=s.call(r)).done;){try{c=v(u.value);}catch(e){throw tr(r),e}if("object"==typeof c&&c&&c instanceof Gr)return c}return new Gr(!1)},Dr=function(e,t,n){if(!(e instanceof t))throw TypeError("Incorrect "+(n?n+" ":"")+"invocation");return e},Yr=function(e,t,n){for(var r in t)ue(e,r,t[r],n);return e},Br=He("species"),Mr=F.f,qr=Nr.fastKey,Hr=se.set,Qr=se.getterFor;!function(e,t,n){var r=-1!==e.indexOf("Map"),o=-1!==e.indexOf("Weak"),i=r?"set":"add",a=l[e],c=a&&a.prototype,s=a,u={},d=function(e){var t=c[e];ue(c,e,"add"==e?function(e){return t.call(this,0===e?0:e),this}:"delete"==e?function(e){return !(o&&!k(e))&&t.call(this,0===e?0:e)}:"get"==e?function(e){return o&&!k(e)?void 0:t.call(this,0===e?0:e)}:"has"==e?function(e){return !(o&&!k(e))&&t.call(this,0===e?0:e)}:function(e,n){return t.call(this,0===e?0:e,n),this});};if(Fe(e,"function"!=typeof a||!(o||c.forEach&&!f((function(){(new a).entries().next();})))))s=n.getConstructor(t,e,r,i),Nr.REQUIRED=!0;else if(Fe(e,!0)){var p=new s,h=p[i](o?{}:-0,1)!=p,y=f((function(){p.has(1);})),v=dr((function(e){new a(e);})),m=!o&&f((function(){for(var e=new a,t=5;t--;)e[i](t,t);return !e.has(-0)}));v||((s=t((function(t,n){Dr(t,s,e);var o=function(e,t,n){var r,o;return Dn&&"function"==typeof(r=t.constructor)&&r!==n&&k(o=r.prototype)&&o!==n.prototype&&Dn(e,o),e}(new a,t,s);return null!=n&&Jr(n,o[i],{that:o,AS_ENTRIES:r}),o}))).prototype=c,c.constructor=s),(y||m)&&(d("delete"),d("has"),r&&d("get")),(m||h)&&d(i),o&&c.clear&&delete c.clear;}u[e]=s,We({global:!0,forced:s!=a},u),Gt(s,e),o||n.setStrong(s,e,r);}("Set",(function(e){return function(){return e(this,arguments.length?arguments[0]:void 0)}}),{getConstructor:function(e,t,n,r){var o=e((function(e,i){Dr(e,o,t),Hr(e,{type:t,index:At(null),first:void 0,last:void 0,size:0}),d||(e.size=0),null!=i&&Jr(i,e[r],{that:e,AS_ENTRIES:n});})),i=Qr(t),a=function(e,t,n){var r,o,a=i(e),s=c(e,t);return s?s.value=n:(a.last=s={index:o=qr(t,!0),key:t,value:n,previous:r=a.last,next:void 0,removed:!1},a.first||(a.first=s),r&&(r.next=s),d?a.size++:e.size++,"F"!==o&&(a.index[o]=s)),e},c=function(e,t){var n,r=i(e),o=qr(t);if("F"!==o)return r.index[o];for(n=r.first;n;n=n.next)if(n.key==t)return n};return Yr(o.prototype,{clear:function(){for(var e=i(this),t=e.index,n=e.first;n;)n.removed=!0,n.previous&&(n.previous=n.previous.next=void 0),delete t[n.index],n=n.next;e.first=e.last=void 0,d?e.size=0:this.size=0;},delete:function(e){var t=this,n=i(t),r=c(t,e);if(r){var o=r.next,a=r.previous;delete n.index[r.index],r.removed=!0,a&&(a.next=o),o&&(o.previous=a),n.first==r&&(n.first=o),n.last==r&&(n.last=a),d?n.size--:t.size--;}return !!r},forEach:function(e){for(var t,n=i(this),r=st(e,arguments.length>1?arguments[1]:void 0,3);t=t?t.next:n.first;)for(r(t.value,t.key,this);t&&t.removed;)t=t.previous;},has:function(e){return !!c(this,e)}}),Yr(o.prototype,n?{get:function(e){var t=c(this,e);return t&&t.value},set:function(e,t){return a(this,0===e?0:e,t)}}:{add:function(e){return a(this,e=0===e?0:e,e)}}),d&&Mr(o.prototype,"size",{get:function(){return i(this).size}}),o},setStrong:function(e,t,n){var r=t+" Iterator",o=Qr(t),i=Qr(r);Hn(e,t,(function(e,t){Hr(this,{type:r,target:e,state:o(e),kind:t,last:void 0});}),(function(){for(var e=i(this),t=e.kind,n=e.last;n&&n.removed;)n=n.previous;return e.target&&(e.last=n=n?n.next:e.state.first)?"keys"==t?{value:n.key,done:!1}:"values"==t?{value:n.value,done:!1}:{value:[n.key,n.value],done:!1}:(e.target=void 0,{value:void 0,done:!0})}),n?"entries":"values",!n,!0),function(e){var t=de(e),n=F.f;d&&t&&!t[Br]&&n(t,Br,{configurable:!0,get:function(){return this}});}(t);}});var $r={CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0},eo=se.set,to=se.getterFor("Array Iterator"),no=Hn(Array,"Array",(function(e,t){eo(this,{type:"Array Iterator",target:_(e),index:0,kind:t});}),(function(){var e=to(this),t=e.target,n=e.kind,r=e.index++;return !t||r>=t.length?(e.target=void 0,{value:void 0,done:!0}):"keys"==n?{value:r,done:!1}:"values"==n?{value:t[r],done:!1}:{value:[r,t[r]],done:!1}}),"values");Nn.Arguments=Nn.Array,Vr("keys"),Vr("values"),Vr("entries");var ro=He("iterator"),oo=He("toStringTag"),io=no.values;for(var ao in $r){var co=l[ao],so=co&&co.prototype;if(so){if(so[ro]!==io)try{K(so,ro,io);}catch(e){so[ro]=io;}if(so[oo]||K(so,oo,ao),$r[ao])for(var uo in no)if(so[uo]!==no[uo])try{K(so,uo,no[uo]);}catch(e){so[uo]=no[uo];}}}function lo(e){var t=this.constructor;return this.then((function(n){return t.resolve(e()).then((function(){return n}))}),(function(n){return t.resolve(e()).then((function(){return t.reject(n)}))}))}function fo(e){return new this((function(t,n){if(!e||void 0===e.length)return n(new TypeError(typeof e+" "+e+" is not iterable(cannot read property Symbol(Symbol.iterator))"));var r=Array.prototype.slice.call(e);if(0===r.length)return t([]);var o=r.length;function i(e,n){if(n&&("object"==typeof n||"function"==typeof n)){var a=n.then;if("function"==typeof a)return void a.call(n,(function(t){i(e,t);}),(function(n){r[e]={status:"rejected",reason:n},0==--o&&t(r);}))}r[e]={status:"fulfilled",value:n},0==--o&&t(r);}for(var a=0;a<r.length;a++)i(a,r[a]);}))}le.Set;var po=setTimeout;function ho(e){return Boolean(e&&void 0!==e.length)}function yo(){}function vo(e){if(!(this instanceof vo))throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],_o(e,this);}function mo(e,t){for(;3===e._state;)e=e._value;0!==e._state?(e._handled=!0,vo._immediateFn((function(){var n=1===e._state?t.onFulfilled:t.onRejected;if(null!==n){var r;try{r=n(e._value);}catch(e){return void bo(t.promise,e)}go(t.promise,r);}else (1===e._state?go:bo)(t.promise,e._value);}))):e._deferreds.push(t);}function go(e,t){try{if(t===e)throw new TypeError("A promise cannot be resolved with itself.");if(t&&("object"==typeof t||"function"==typeof t)){var n=t.then;if(t instanceof vo)return e._state=3,e._value=t,void wo(e);if("function"==typeof n)return void _o((r=n,o=t,function(){r.apply(o,arguments);}),e)}e._state=1,e._value=t,wo(e);}catch(t){bo(e,t);}var r,o;}function bo(e,t){e._state=2,e._value=t,wo(e);}function wo(e){2===e._state&&0===e._deferreds.length&&vo._immediateFn((function(){e._handled||vo._unhandledRejectionFn(e._value);}));for(var t=0,n=e._deferreds.length;t<n;t++)mo(e,e._deferreds[t]);e._deferreds=null;}function So(e,t,n){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof t?t:null,this.promise=n;}function _o(e,t){var n=!1;try{e((function(e){n||(n=!0,go(t,e));}),(function(e){n||(n=!0,bo(t,e));}));}catch(e){if(n)return;n=!0,bo(t,e);}}vo.prototype.catch=function(e){return this.then(null,e)},vo.prototype.then=function(e,t){var n=new this.constructor(yo);return mo(this,new So(e,t,n)),n},vo.prototype.finally=lo,vo.all=function(e){return new vo((function(t,n){if(!ho(e))return n(new TypeError("Promise.all accepts an array"));var r=Array.prototype.slice.call(e);if(0===r.length)return t([]);var o=r.length;function i(e,a){try{if(a&&("object"==typeof a||"function"==typeof a)){var c=a.then;if("function"==typeof c)return void c.call(a,(function(t){i(e,t);}),n)}r[e]=a,0==--o&&t(r);}catch(e){n(e);}}for(var a=0;a<r.length;a++)i(a,r[a]);}))},vo.allSettled=fo,vo.resolve=function(e){return e&&"object"==typeof e&&e.constructor===vo?e:new vo((function(t){t(e);}))},vo.reject=function(e){return new vo((function(t,n){n(e);}))},vo.race=function(e){return new vo((function(t,n){if(!ho(e))return n(new TypeError("Promise.race accepts an array"));for(var r=0,o=e.length;r<o;r++)vo.resolve(e[r]).then(t,n);}))},vo._immediateFn="function"==typeof setImmediate&&function(e){setImmediate(e);}||function(e){po(e,0);},vo._unhandledRejectionFn=function(e){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",e);};var ko=function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw new Error("unable to locate global object")}();"function"!=typeof ko.Promise?ko.Promise=vo:ko.Promise.prototype.finally?ko.Promise.allSettled||(ko.Promise.allSettled=fo):ko.Promise.prototype.finally=lo,function(e){function t(){}function n(e,t){if(e=void 0===e?"utf-8":e,t=void 0===t?{fatal:!1}:t,-1===o.indexOf(e.toLowerCase()))throw new RangeError("Failed to construct 'TextDecoder': The encoding label provided ('"+e+"') is invalid.");if(t.fatal)throw Error("Failed to construct 'TextDecoder': the 'fatal' option is unsupported.")}function r(e){for(var t=0,n=Math.min(65536,e.length+1),r=new Uint16Array(n),o=[],i=0;;){var a=t<e.length;if(!a||i>=n-1){if(o.push(String.fromCharCode.apply(null,r.subarray(0,i))),!a)return o.join("");e=e.subarray(t),i=t=0;}if(0==(128&(a=e[t++])))r[i++]=a;else if(192==(224&a)){var c=63&e[t++];r[i++]=(31&a)<<6|c;}else if(224==(240&a)){c=63&e[t++];var s=63&e[t++];r[i++]=(31&a)<<12|c<<6|s;}else if(240==(248&a)){65535<(a=(7&a)<<18|(c=63&e[t++])<<12|(s=63&e[t++])<<6|63&e[t++])&&(a-=65536,r[i++]=a>>>10&1023|55296,a=56320|1023&a),r[i++]=a;}}}if(e.TextEncoder&&e.TextDecoder)return !1;var o=["utf-8","utf8","unicode-1-1-utf-8"];Object.defineProperty(t.prototype,"encoding",{value:"utf-8"}),t.prototype.encode=function(e,t){if((t=void 0===t?{stream:!1}:t).stream)throw Error("Failed to encode: the 'stream' option is unsupported.");t=0;for(var n=e.length,r=0,o=Math.max(32,n+(n>>>1)+7),i=new Uint8Array(o>>>3<<3);t<n;){var a=e.charCodeAt(t++);if(55296<=a&&56319>=a){if(t<n){var c=e.charCodeAt(t);56320==(64512&c)&&(++t,a=((1023&a)<<10)+(1023&c)+65536);}if(55296<=a&&56319>=a)continue}if(r+4>i.length&&(o+=8,o=(o*=1+t/e.length*2)>>>3<<3,(c=new Uint8Array(o)).set(i),i=c),0==(4294967168&a))i[r++]=a;else {if(0==(4294965248&a))i[r++]=a>>>6&31|192;else if(0==(4294901760&a))i[r++]=a>>>12&15|224,i[r++]=a>>>6&63|128;else {if(0!=(4292870144&a))continue;i[r++]=a>>>18&7|240,i[r++]=a>>>12&63|128,i[r++]=a>>>6&63|128;}i[r++]=63&a|128;}}return i.slice?i.slice(0,r):i.subarray(0,r)},Object.defineProperty(n.prototype,"encoding",{value:"utf-8"}),Object.defineProperty(n.prototype,"fatal",{value:!1}),Object.defineProperty(n.prototype,"ignoreBOM",{value:!1});var i=r;"function"==typeof Buffer&&Buffer.from?i=function(e){return Buffer.from(e.buffer,e.byteOffset,e.byteLength).toString("utf-8")}:"function"==typeof Blob&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&(i=function(e){var t=URL.createObjectURL(new Blob([e],{type:"text/plain;charset=UTF-8"}));try{var n=new XMLHttpRequest;return n.open("GET",t,!1),n.send(),n.responseText}catch(t){return r(e)}finally{URL.revokeObjectURL(t);}}),n.prototype.decode=function(e,t){if((t=void 0===t?{stream:!1}:t).stream)throw Error("Failed to decode: the 'stream' option is unsupported.");return e=e instanceof Uint8Array?e:e.buffer instanceof ArrayBuffer?new Uint8Array(e.buffer):new Uint8Array(e),i(e)},e.TextEncoder=t,e.TextDecoder=n;}("undefined"!=typeof window?window:a),function(){function e(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function t(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function n(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}function r(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&i(e,t);}function o(e){return (o=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function i(e,t){return (i=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function c(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return !1}}function s(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function u(e,t){return !t||"object"!=typeof t&&"function"!=typeof t?s(e):t}function l(e){var t=c();return function(){var n,r=o(e);if(t){var i=o(this).constructor;n=Reflect.construct(r,arguments,i);}else n=r.apply(this,arguments);return u(this,n)}}function f(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=o(e)););return e}function d(e,t,n){return (d="undefined"!=typeof Reflect&&Reflect.get?Reflect.get:function(e,t,n){var r=f(e,t);if(r){var o=Object.getOwnPropertyDescriptor(r,t);return o.get?o.get.call(n):o.value}})(e,t,n||e)}var p=function(){function t(){e(this,t),Object.defineProperty(this,"listeners",{value:{},writable:!0,configurable:!0});}return n(t,[{key:"addEventListener",value:function(e,t,n){e in this.listeners||(this.listeners[e]=[]),this.listeners[e].push({callback:t,options:n});}},{key:"removeEventListener",value:function(e,t){if(e in this.listeners)for(var n=this.listeners[e],r=0,o=n.length;r<o;r++)if(n[r].callback===t)return void n.splice(r,1)}},{key:"dispatchEvent",value:function(e){if(e.type in this.listeners){for(var t=this.listeners[e.type].slice(),n=0,r=t.length;n<r;n++){var o=t[n];try{o.callback.call(this,e);}catch(e){Promise.resolve().then((function(){throw e}));}o.options&&o.options.once&&this.removeEventListener(e.type,o.callback);}return !e.defaultPrevented}}}]),t}(),h=function(t){r(a,t);var i=l(a);function a(){var t;return e(this,a),(t=i.call(this)).listeners||p.call(s(t)),Object.defineProperty(s(t),"aborted",{value:!1,writable:!0,configurable:!0}),Object.defineProperty(s(t),"onabort",{value:null,writable:!0,configurable:!0}),t}return n(a,[{key:"toString",value:function(){return "[object AbortSignal]"}},{key:"dispatchEvent",value:function(e){"abort"===e.type&&(this.aborted=!0,"function"==typeof this.onabort&&this.onabort.call(this,e)),d(o(a.prototype),"dispatchEvent",this).call(this,e);}}]),a}(p),y=function(){function t(){e(this,t),Object.defineProperty(this,"signal",{value:new h,writable:!0,configurable:!0});}return n(t,[{key:"abort",value:function(){var e;try{e=new Event("abort");}catch(t){"undefined"!=typeof document?document.createEvent?(e=document.createEvent("Event")).initEvent("abort",!1,!1):(e=document.createEventObject()).type="abort":e={type:"abort",bubbles:!1,cancelable:!1};}this.signal.dispatchEvent(e);}},{key:"toString",value:function(){return "[object AbortController]"}}]),t}();function v(e){return e.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL?(console.log("__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL=true is set, will force install polyfill"),!0):"function"==typeof e.Request&&!e.Request.prototype.hasOwnProperty("signal")||!e.AbortController}"undefined"!=typeof Symbol&&Symbol.toStringTag&&(y.prototype[Symbol.toStringTag]="AbortController",h.prototype[Symbol.toStringTag]="AbortSignal"),function(e){v(e)&&(e.AbortController=y,e.AbortSignal=h);}("undefined"!=typeof self?self:a);}();var Io=s((function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(){var e=this;this.locked=new Map,this.addToLocked=function(t,n){var r=e.locked.get(t);void 0===r?void 0===n?e.locked.set(t,[]):e.locked.set(t,[n]):void 0!==n&&(r.unshift(n),e.locked.set(t,r));},this.isLocked=function(t){return e.locked.has(t)},this.lock=function(t){return new Promise((function(n,r){e.isLocked(t)?e.addToLocked(t,n):(e.addToLocked(t),n());}))},this.unlock=function(t){var n=e.locked.get(t);if(void 0!==n&&0!==n.length){var r=n.pop();e.locked.set(t,n),void 0!==r&&setTimeout(r,0);}else e.locked.delete(t);};}return e.getInstance=function(){return void 0===e.instance&&(e.instance=new e),e.instance},e}();t.default=function(){return n.getInstance()};}));c(Io);var To=c(s((function(e,t){var n=a&&a.__awaiter||function(e,t,n,r){return new(n||(n=Promise))((function(o,i){function a(e){try{s(r.next(e));}catch(e){i(e);}}function c(e){try{s(r.throw(e));}catch(e){i(e);}}function s(e){e.done?o(e.value):new n((function(t){t(e.value);})).then(a,c);}s((r=r.apply(e,t||[])).next());}))},r=a&&a.__generator||function(e,t){var n,r,o,i,a={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function c(i){return function(c){return function(i){if(n)throw new TypeError("Generator is already executing.");for(;a;)try{if(n=1,r&&(o=2&i[0]?r.return:i[0]?r.throw||((o=r.return)&&o.call(r),0):r.next)&&!(o=o.call(r,i[1])).done)return o;switch(r=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return a.label++,{value:i[1],done:!1};case 5:a.label++,r=i[1],i=[0];continue;case 7:i=a.ops.pop(),a.trys.pop();continue;default:if(!(o=a.trys,(o=o.length>0&&o[o.length-1])||6!==i[0]&&2!==i[0])){a=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){a.label=i[1];break}if(6===i[0]&&a.label<o[1]){a.label=o[1],o=i;break}if(o&&a.label<o[2]){a.label=o[2],a.ops.push(i);break}o[2]&&a.ops.pop(),a.trys.pop();continue}i=t.call(e,a);}catch(e){i=[6,e],r=0;}finally{n=o=0;}if(5&i[0])throw i[1];return {value:i[0]?i[1]:void 0,done:!0}}([i,c])}}};Object.defineProperty(t,"__esModule",{value:!0});var o="browser-tabs-lock-key";function i(e){return new Promise((function(t){return setTimeout(t,e)}))}function c(e){for(var t="0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",n="",r=0;r<e;r++){n+=t[Math.floor(Math.random()*t.length)];}return n}var s=function(){function e(){this.acquiredIatSet=new Set,this.id=Date.now().toString()+c(15),this.acquireLock=this.acquireLock.bind(this),this.releaseLock=this.releaseLock.bind(this),this.releaseLock__private__=this.releaseLock__private__.bind(this),this.waitForSomethingToChange=this.waitForSomethingToChange.bind(this),this.refreshLockWhileAcquired=this.refreshLockWhileAcquired.bind(this),void 0===e.waiters&&(e.waiters=[]);}return e.prototype.acquireLock=function(t,a){return void 0===a&&(a=5e3),n(this,void 0,void 0,(function(){var n,s,u,l,f,d;return r(this,(function(r){switch(r.label){case 0:n=Date.now()+c(4),s=Date.now()+a,u=o+"-"+t,l=window.localStorage,r.label=1;case 1:return Date.now()<s?[4,i(30)]:[3,8];case 2:return r.sent(),null!==l.getItem(u)?[3,5]:(f=this.id+"-"+t+"-"+n,[4,i(Math.floor(25*Math.random()))]);case 3:return r.sent(),l.setItem(u,JSON.stringify({id:this.id,iat:n,timeoutKey:f,timeAcquired:Date.now(),timeRefreshed:Date.now()})),[4,i(30)];case 4:return r.sent(),null!==(d=l.getItem(u))&&(d=JSON.parse(d)).id===this.id&&d.iat===n?(this.acquiredIatSet.add(n),this.refreshLockWhileAcquired(u,n),[2,!0]):[3,7];case 5:return e.lockCorrector(),[4,this.waitForSomethingToChange(s)];case 6:r.sent(),r.label=7;case 7:return n=Date.now()+c(4),[3,1];case 8:return [2,!1]}}))}))},e.prototype.refreshLockWhileAcquired=function(e,t){return n(this,void 0,void 0,(function(){var o=this;return r(this,(function(i){return setTimeout((function(){return n(o,void 0,void 0,(function(){var n,o;return r(this,(function(r){switch(r.label){case 0:return [4,Io.default().lock(t)];case 1:return r.sent(),this.acquiredIatSet.has(t)?(n=window.localStorage,null===(o=n.getItem(e))?(Io.default().unlock(t),[2]):((o=JSON.parse(o)).timeRefreshed=Date.now(),n.setItem(e,JSON.stringify(o)),Io.default().unlock(t),this.refreshLockWhileAcquired(e,t),[2])):(Io.default().unlock(t),[2])}}))}))}),1e3),[2]}))}))},e.prototype.waitForSomethingToChange=function(t){return n(this,void 0,void 0,(function(){return r(this,(function(n){switch(n.label){case 0:return [4,new Promise((function(n){var r=!1,o=Date.now(),i=!1;function a(){if(i||(window.removeEventListener("storage",a),e.removeFromWaiting(a),clearTimeout(c),i=!0),!r){r=!0;var t=50-(Date.now()-o);t>0?setTimeout(n,t):n();}}window.addEventListener("storage",a),e.addToWaiting(a);var c=setTimeout(a,Math.max(0,t-Date.now()));}))];case 1:return n.sent(),[2]}}))}))},e.addToWaiting=function(t){this.removeFromWaiting(t),void 0!==e.waiters&&e.waiters.push(t);},e.removeFromWaiting=function(t){void 0!==e.waiters&&(e.waiters=e.waiters.filter((function(e){return e!==t})));},e.notifyWaiters=function(){void 0!==e.waiters&&e.waiters.slice().forEach((function(e){return e()}));},e.prototype.releaseLock=function(e){return n(this,void 0,void 0,(function(){return r(this,(function(t){switch(t.label){case 0:return [4,this.releaseLock__private__(e)];case 1:return [2,t.sent()]}}))}))},e.prototype.releaseLock__private__=function(t){return n(this,void 0,void 0,(function(){var n,i,a;return r(this,(function(r){switch(r.label){case 0:return n=window.localStorage,i=o+"-"+t,null===(a=n.getItem(i))?[2]:(a=JSON.parse(a)).id!==this.id?[3,2]:[4,Io.default().lock(a.iat)];case 1:r.sent(),this.acquiredIatSet.delete(a.iat),n.removeItem(i),Io.default().unlock(a.iat),e.notifyWaiters(),r.label=2;case 2:return [2]}}))}))},e.lockCorrector=function(){for(var t=Date.now()-5e3,n=window.localStorage,r=Object.keys(n),i=!1,a=0;a<r.length;a++){var c=r[a];if(c.includes(o)){var s=n.getItem(c);null!==s&&(void 0===(s=JSON.parse(s)).timeRefreshed&&s.timeAcquired<t||void 0!==s.timeRefreshed&&s.timeRefreshed<t)&&(n.removeItem(c),i=!0);}}i&&e.notifyWaiters();},e.waiters=void 0,e}();t.default=s;}))),Oo={timeoutInSeconds:60},Eo=["login_required","consent_required","interaction_required","account_selection_required","access_denied"],xo={name:"auth0-spa-js",version:"1.15.0"},Ro=function(e){function n(t,r){var o=e.call(this,r)||this;return o.error=t,o.error_description=r,Object.setPrototypeOf(o,n.prototype),o}return t(n,e),n.fromPayload=function(e){return new n(e.error,e.error_description)},n}(Error),Lo=function(e){function n(t,r,o,i){void 0===i&&(i=null);var a=e.call(this,t,r)||this;return a.state=o,a.appState=i,Object.setPrototypeOf(a,n.prototype),a}return t(n,e),n}(Ro),Co=function(e){function n(){var t=e.call(this,"timeout","Timeout")||this;return Object.setPrototypeOf(t,n.prototype),t}return t(n,e),n}(Ro),jo=function(e){function n(t){var r=e.call(this)||this;return r.popup=t,Object.setPrototypeOf(r,n.prototype),r}return t(n,e),n}(Co),Uo=function(e){function n(t){var r=e.call(this,"cancelled","Popup closed")||this;return r.popup=t,Object.setPrototypeOf(r,n.prototype),r}return t(n,e),n}(Ro),Ao=function(e){return new Promise((function(t,n){var r,o=setInterval((function(){e.popup&&e.popup.closed&&(clearInterval(o),clearTimeout(i),window.removeEventListener("message",r,!1),n(new Uo(e.popup)));}),1e3),i=setTimeout((function(){clearInterval(o),n(new jo(e.popup)),window.removeEventListener("message",r,!1);}),1e3*(e.timeoutInSeconds||60));r=function(a){if(a.data&&"authorization_response"===a.data.type){if(clearTimeout(i),clearInterval(o),window.removeEventListener("message",r,!1),e.popup.close(),a.data.response.error)return n(Ro.fromPayload(a.data.response));t(a.data.response);}},window.addEventListener("message",r);}))},Po=function(){return window.crypto||window.msCrypto},Fo=function(){var e=Po();return e.subtle||e.webkitSubtle},Ko=function(){var e="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.",t="";return Array.from(Po().getRandomValues(new Uint8Array(43))).forEach((function(n){return t+=e[n%e.length]})),t},Wo=function(e){return btoa(e)},zo=function(e){return Object.keys(e).filter((function(t){return void 0!==e[t]})).map((function(t){return encodeURIComponent(t)+"="+encodeURIComponent(e[t])})).join("&")},Vo=function(e){return o(void 0,void 0,void 0,(function(){var t;return i(this,(function(n){switch(n.label){case 0:return t=Fo().digest({name:"SHA-256"},(new TextEncoder).encode(e)),window.msCrypto?[2,new Promise((function(e,n){t.oncomplete=function(t){e(t.target.result);},t.onerror=function(e){n(e.error);},t.onabort=function(){n("The digest operation was aborted");};}))]:[4,t];case 1:return [2,n.sent()]}}))}))},Zo=function(e){return function(e){return decodeURIComponent(atob(e).split("").map((function(e){return "%"+("00"+e.charCodeAt(0).toString(16)).slice(-2)})).join(""))}(e.replace(/_/g,"/").replace(/-/g,"+"))},Xo=function(e){var t=new Uint8Array(e);return function(e){var t={"+":"-","/":"_","=":""};return e.replace(/[+/=]/g,(function(e){return t[e]}))}(window.btoa(String.fromCharCode.apply(String,Array.from(t))))};var No=function(e,t){return o(void 0,void 0,void 0,(function(){var n,r;return i(this,(function(o){switch(o.label){case 0:return [4,(i=e,a=t,a=a||{},new Promise((function(e,t){var n=new XMLHttpRequest,r=[],o=[],c={},s=function(){return {ok:2==(n.status/100|0),statusText:n.statusText,status:n.status,url:n.responseURL,text:function(){return Promise.resolve(n.responseText)},json:function(){return Promise.resolve(n.responseText).then(JSON.parse)},blob:function(){return Promise.resolve(new Blob([n.response]))},clone:s,headers:{keys:function(){return r},entries:function(){return o},get:function(e){return c[e.toLowerCase()]},has:function(e){return e.toLowerCase()in c}}}};for(var u in n.open(a.method||"get",i,!0),n.onload=function(){n.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm,(function(e,t,n){r.push(t=t.toLowerCase()),o.push([t,n]),c[t]=c[t]?c[t]+","+n:n;})),e(s());},n.onerror=t,n.withCredentials="include"==a.credentials,a.headers)n.setRequestHeader(u,a.headers[u]);n.send(a.body||null);})))];case 1:return n=o.sent(),r={ok:n.ok},[4,n.json()];case 2:return [2,(r.json=o.sent(),r)]}var i,a;}))}))},Go=function(e,t,n){return o(void 0,void 0,void 0,(function(){var r,o;return i(this,(function(i){return r=new AbortController,t.signal=r.signal,[2,Promise.race([No(e,t),new Promise((function(e,t){o=setTimeout((function(){r.abort(),t(new Error("Timeout when executing 'fetch'"));}),n);}))]).finally((function(){clearTimeout(o);}))]}))}))},Jo=function(e,t,n,r,a,c){return o(void 0,void 0,void 0,(function(){return i(this,(function(o){return [2,(i={auth:{audience:t,scope:n},timeout:a,fetchUrl:e,fetchOptions:r},s=c,new Promise((function(e,t){var n=new MessageChannel;n.port1.onmessage=function(n){n.data.error?t(new Error(n.data.error)):e(n.data);},s.postMessage(i,[n.port2]);})))];var i,s;}))}))},Do=function(e,t,n,r,a,c){return void 0===c&&(c=1e4),o(void 0,void 0,void 0,(function(){return i(this,(function(o){return a?[2,Jo(e,t,n,r,c,a)]:[2,Go(e,r,c)]}))}))};function Yo(e,t,n,a,c,s){return o(this,void 0,void 0,(function(){var o,u,l,f,d,p,h,y;return i(this,(function(i){switch(i.label){case 0:o=null,l=0,i.label=1;case 1:if(!(l<3))return [3,6];i.label=2;case 2:return i.trys.push([2,4,,5]),[4,Do(e,n,a,c,s,t)];case 3:return u=i.sent(),o=null,[3,6];case 4:return f=i.sent(),o=f,[3,5];case 5:return l++,[3,1];case 6:if(o)throw o.message=o.message||"Failed to fetch",o;if(d=u.json,p=d.error,h=d.error_description,y=r(d,["error","error_description"]),!u.ok)throw new Ro(p||"request_error",h||"HTTP error. Unable to fetch "+e);return [2,y]}}))}))}function Bo(e,t){var n=e.baseUrl,a=e.timeout,c=e.audience,s=e.scope,u=e.auth0Client,l=r(e,["baseUrl","timeout","audience","scope","auth0Client"]);return o(this,void 0,void 0,(function(){return i(this,(function(e){switch(e.label){case 0:return [4,Yo(n+"/oauth/token",a,c||"default",s,{method:"POST",body:JSON.stringify(l),headers:{"Content-type":"application/json","Auth0-Client":btoa(JSON.stringify(u||xo))}},t)];case 1:return [2,e.sent()]}}))}))}var Mo=function(e){return Array.from(new Set(e))},qo=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];return Mo(e.join(" ").trim().split(/\s+/)).join(" ")},Ho=function(){function e(e,t){void 0===t&&(t=Qo),this.prefix=t,this.client_id=e.client_id,this.scope=e.scope,this.audience=e.audience;}return e.prototype.toKey=function(){return this.prefix+"::"+this.client_id+"::"+this.audience+"::"+this.scope},e.fromKey=function(t){var n=t.split("::"),r=n[0],o=n[1],i=n[2];return new e({client_id:o,scope:n[3],audience:i},r)},e}(),Qo="@@auth0spajs@@",$o=function(e){var t=Math.floor(Date.now()/1e3)+e.expires_in;return {body:e,expiresAt:Math.min(t,e.decodedToken.claims.exp)}},ei=function(e,t){var n=e.client_id,r=e.audience,o=e.scope;return t.filter((function(e){var t=Ho.fromKey(e),i=t.prefix,a=t.client_id,c=t.audience,s=t.scope,u=s&&s.split(" "),l=s&&o.split(" ").reduce((function(e,t){return e&&u.includes(t)}),!0);return i===Qo&&a===n&&c===r&&l}))[0]},ti=function(){function e(){}return e.prototype.save=function(e){var t=new Ho({client_id:e.client_id,scope:e.scope,audience:e.audience}),n=$o(e);window.localStorage.setItem(t.toKey(),JSON.stringify(n));},e.prototype.get=function(e,t){void 0===t&&(t=0);var n=this.readJson(e),r=Math.floor(Date.now()/1e3);if(n){if(!(n.expiresAt-t<r))return n.body;if(n.body.refresh_token){var o=this.stripData(n);return this.writeJson(e.toKey(),o),o.body}localStorage.removeItem(e.toKey());}},e.prototype.clear=function(){for(var e=localStorage.length-1;e>=0;e--)localStorage.key(e).startsWith(Qo)&&localStorage.removeItem(localStorage.key(e));},e.prototype.readJson=function(e){var t,n=ei(e,Object.keys(window.localStorage)),r=n&&window.localStorage.getItem(n);if(r&&(t=JSON.parse(r)))return t},e.prototype.writeJson=function(e,t){localStorage.setItem(e,JSON.stringify(t));},e.prototype.stripData=function(e){return {body:{refresh_token:e.body.refresh_token},expiresAt:e.expiresAt}},e}(),ni=function(){var e;this.enclosedCache=(e={},{save:function(t){var n=new Ho({client_id:t.client_id,scope:t.scope,audience:t.audience}),r=$o(t);e[n.toKey()]=r;},get:function(t,n){void 0===n&&(n=0);var r=ei(t,Object.keys(e)),o=e[r],i=Math.floor(Date.now()/1e3);if(o)return o.expiresAt-n<i?o.body.refresh_token?(o.body={refresh_token:o.body.refresh_token},o.body):void delete e[t.toKey()]:o.body},clear:function(){e={};}});},ri=function(){function e(e){this.storage=e,this.transaction=this.storage.get("a0.spajs.txs");}return e.prototype.create=function(e){this.transaction=e,this.storage.save("a0.spajs.txs",e,{daysUntilExpire:1});},e.prototype.get=function(){return this.transaction},e.prototype.remove=function(){delete this.transaction,this.storage.remove("a0.spajs.txs");},e}(),oi=function(e){return "number"==typeof e},ii=["iss","aud","exp","nbf","iat","jti","azp","nonce","auth_time","at_hash","c_hash","acr","amr","sub_jwk","cnf","sip_from_tag","sip_date","sip_callid","sip_cseq_num","sip_via_branch","orig","dest","mky","events","toe","txn","rph","sid","vot","vtm"],ai=function(e){if(!e.id_token)throw new Error("ID token is required but missing");var t=function(e){var t=e.split("."),n=t[0],r=t[1],o=t[2];if(3!==t.length||!n||!r||!o)throw new Error("ID token could not be decoded");var i=JSON.parse(Zo(r)),a={__raw:e},c={};return Object.keys(i).forEach((function(e){a[e]=i[e],ii.includes(e)||(c[e]=i[e]);})),{encoded:{header:n,payload:r,signature:o},header:JSON.parse(Zo(n)),claims:a,user:c}}(e.id_token);if(!t.claims.iss)throw new Error("Issuer (iss) claim must be a string present in the ID token");if(t.claims.iss!==e.iss)throw new Error('Issuer (iss) claim mismatch in the ID token; expected "'+e.iss+'", found "'+t.claims.iss+'"');if(!t.user.sub)throw new Error("Subject (sub) claim must be a string present in the ID token");if("RS256"!==t.header.alg)throw new Error('Signature algorithm of "'+t.header.alg+'" is not supported. Expected the ID token to be signed with "RS256".');if(!t.claims.aud||"string"!=typeof t.claims.aud&&!Array.isArray(t.claims.aud))throw new Error("Audience (aud) claim must be a string or array of strings present in the ID token");if(Array.isArray(t.claims.aud)){if(!t.claims.aud.includes(e.aud))throw new Error('Audience (aud) claim mismatch in the ID token; expected "'+e.aud+'" but was not one of "'+t.claims.aud.join(", ")+'"');if(t.claims.aud.length>1){if(!t.claims.azp)throw new Error("Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values");if(t.claims.azp!==e.aud)throw new Error('Authorized Party (azp) claim mismatch in the ID token; expected "'+e.aud+'", found "'+t.claims.azp+'"')}}else if(t.claims.aud!==e.aud)throw new Error('Audience (aud) claim mismatch in the ID token; expected "'+e.aud+'" but found "'+t.claims.aud+'"');if(e.nonce){if(!t.claims.nonce)throw new Error("Nonce (nonce) claim must be a string present in the ID token");if(t.claims.nonce!==e.nonce)throw new Error('Nonce (nonce) claim mismatch in the ID token; expected "'+e.nonce+'", found "'+t.claims.nonce+'"')}if(e.max_age&&!oi(t.claims.auth_time))throw new Error("Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified");if(!oi(t.claims.exp))throw new Error("Expiration Time (exp) claim must be a number present in the ID token");if(!oi(t.claims.iat))throw new Error("Issued At (iat) claim must be a number present in the ID token");var n=e.leeway||60,r=new Date(Date.now()),o=new Date(0),i=new Date(0),a=new Date(0);if(a.setUTCSeconds(parseInt(t.claims.auth_time)+e.max_age+n),o.setUTCSeconds(t.claims.exp+n),i.setUTCSeconds(t.claims.nbf-n),r>o)throw new Error("Expiration Time (exp) claim error in the ID token; current time ("+r+") is after expiration time ("+o+")");if(oi(t.claims.nbf)&&r<i)throw new Error("Not Before time (nbf) claim in the ID token indicates that this token can't be used just yet. Currrent time ("+r+") is before "+i);if(oi(t.claims.auth_time)&&r>a)throw new Error("Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Currrent time ("+r+") is after last auth at "+a);if(e.organizationId){if(!t.claims.org_id)throw new Error("Organization ID (org_id) claim must be a string present in the ID token");if(e.organizationId!==t.claims.org_id)throw new Error('Organization ID (org_id) claim mismatch in the ID token; expected "'+e.organizationId+'", found "'+t.claims.org_id+'"')}return t},ci=s((function(e,t){var n=a&&a.__assign||function(){return (n=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var o in t=arguments[n])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e}).apply(this,arguments)};function r(e,t){if(!t)return "";var n="; "+e;return !0===t?n:n+"="+t}function o(e,t,n){return encodeURIComponent(e).replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent).replace(/\(/g,"%28").replace(/\)/g,"%29")+"="+encodeURIComponent(t).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent)+function(e){if("number"==typeof e.expires){var t=new Date;t.setMilliseconds(t.getMilliseconds()+864e5*e.expires),e.expires=t;}return r("Expires",e.expires?e.expires.toUTCString():"")+r("Domain",e.domain)+r("Path",e.path)+r("Secure",e.secure)+r("SameSite",e.sameSite)}(n)}function i(e){for(var t={},n=e?e.split("; "):[],r=/(%[\dA-F]{2})+/gi,o=0;o<n.length;o++){var i=n[o].split("="),a=i.slice(1).join("=");'"'===a.charAt(0)&&(a=a.slice(1,-1));try{t[i[0].replace(r,decodeURIComponent)]=a.replace(r,decodeURIComponent);}catch(e){}}return t}function c(){return i(document.cookie)}function s(e,t,r){document.cookie=o(e,t,n({path:"/"},r));}t.__esModule=!0,t.encode=o,t.parse=i,t.getAll=c,t.get=function(e){return c()[e]},t.set=s,t.remove=function(e,t){s(e,"",n(n({},t),{expires:-1}));};}));c(ci),ci.encode,ci.parse,ci.getAll;var si=ci.get,ui=ci.set,li=ci.remove,fi={get:function(e){var t=si(e);if(void 0!==t)return JSON.parse(t)},save:function(e,t,n){var r={};"https:"===window.location.protocol&&(r={secure:!0,sameSite:"none"}),r.expires=n.daysUntilExpire,ui(e,JSON.stringify(t),r);},remove:function(e){li(e);}},di={get:function(e){var t=fi.get(e);return t||fi.get("_legacy_"+e)},save:function(e,t,n){var r={};"https:"===window.location.protocol&&(r={secure:!0}),r.expires=n.daysUntilExpire,ui("_legacy_"+e,JSON.stringify(t),r),fi.save(e,t,n);},remove:function(e){fi.remove(e),fi.remove("_legacy_"+e);}},pi={get:function(e){if("undefined"!=typeof sessionStorage){var t=sessionStorage.getItem(e);if(void 0!==t)return JSON.parse(t)}},save:function(e,t){sessionStorage.setItem(e,JSON.stringify(t));},remove:function(e){sessionStorage.removeItem(e);}};function hi(e,t,n){var r=void 0===t?null:t,o=function(e,t){var n=atob(e);if(t){for(var r=new Uint8Array(n.length),o=0,i=n.length;o<i;++o)r[o]=n.charCodeAt(o);return String.fromCharCode.apply(null,new Uint16Array(r.buffer))}return n}(e,void 0!==n&&n),i=o.indexOf("\n",10)+1,a=o.substring(i)+(r?"//# sourceMappingURL="+r:""),c=new Blob([a],{type:"application/javascript"});return URL.createObjectURL(c)}var yi,vi,mi,gi,bi=(yi="Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwohZnVuY3Rpb24oKXsidXNlIHN0cmljdCI7Ci8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKgogICAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uCgogICAgUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55CiAgICBwdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuCgogICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICJBUyBJUyIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEgKICAgIFJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWQogICAgQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULAogICAgSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NCiAgICBMT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUgogICAgT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUgogICAgUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS4KICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovdmFyIGU9ZnVuY3Rpb24oKXtyZXR1cm4oZT1PYmplY3QuYXNzaWdufHxmdW5jdGlvbihlKXtmb3IodmFyIHQscj0xLG49YXJndW1lbnRzLmxlbmd0aDtyPG47cisrKWZvcih2YXIgbyBpbiB0PWFyZ3VtZW50c1tyXSlPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodCxvKSYmKGVbb109dFtvXSk7cmV0dXJuIGV9KS5hcHBseSh0aGlzLGFyZ3VtZW50cyl9O2Z1bmN0aW9uIHQoZSx0LHIsbil7cmV0dXJuIG5ldyhyfHwocj1Qcm9taXNlKSkoKGZ1bmN0aW9uKG8scyl7ZnVuY3Rpb24gYShlKXt0cnl7dShuLm5leHQoZSkpfWNhdGNoKGUpe3MoZSl9fWZ1bmN0aW9uIGkoZSl7dHJ5e3Uobi50aHJvdyhlKSl9Y2F0Y2goZSl7cyhlKX19ZnVuY3Rpb24gdShlKXt2YXIgdDtlLmRvbmU/byhlLnZhbHVlKToodD1lLnZhbHVlLHQgaW5zdGFuY2VvZiByP3Q6bmV3IHIoKGZ1bmN0aW9uKGUpe2UodCl9KSkpLnRoZW4oYSxpKX11KChuPW4uYXBwbHkoZSx0fHxbXSkpLm5leHQoKSl9KSl9ZnVuY3Rpb24gcihlLHQpe3ZhciByLG4sbyxzLGE9e2xhYmVsOjAsc2VudDpmdW5jdGlvbigpe2lmKDEmb1swXSl0aHJvdyBvWzFdO3JldHVybiBvWzFdfSx0cnlzOltdLG9wczpbXX07cmV0dXJuIHM9e25leHQ6aSgwKSx0aHJvdzppKDEpLHJldHVybjppKDIpfSwiZnVuY3Rpb24iPT10eXBlb2YgU3ltYm9sJiYoc1tTeW1ib2wuaXRlcmF0b3JdPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXN9KSxzO2Z1bmN0aW9uIGkocyl7cmV0dXJuIGZ1bmN0aW9uKGkpe3JldHVybiBmdW5jdGlvbihzKXtpZihyKXRocm93IG5ldyBUeXBlRXJyb3IoIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy4iKTtmb3IoO2E7KXRyeXtpZihyPTEsbiYmKG89MiZzWzBdP24ucmV0dXJuOnNbMF0/bi50aHJvd3x8KChvPW4ucmV0dXJuKSYmby5jYWxsKG4pLDApOm4ubmV4dCkmJiEobz1vLmNhbGwobixzWzFdKSkuZG9uZSlyZXR1cm4gbztzd2l0Y2gobj0wLG8mJihzPVsyJnNbMF0sby52YWx1ZV0pLHNbMF0pe2Nhc2UgMDpjYXNlIDE6bz1zO2JyZWFrO2Nhc2UgNDpyZXR1cm4gYS5sYWJlbCsrLHt2YWx1ZTpzWzFdLGRvbmU6ITF9O2Nhc2UgNTphLmxhYmVsKyssbj1zWzFdLHM9WzBdO2NvbnRpbnVlO2Nhc2UgNzpzPWEub3BzLnBvcCgpLGEudHJ5cy5wb3AoKTtjb250aW51ZTtkZWZhdWx0OmlmKCEobz1hLnRyeXMsKG89by5sZW5ndGg+MCYmb1tvLmxlbmd0aC0xXSl8fDYhPT1zWzBdJiYyIT09c1swXSkpe2E9MDtjb250aW51ZX1pZigzPT09c1swXSYmKCFvfHxzWzFdPm9bMF0mJnNbMV08b1szXSkpe2EubGFiZWw9c1sxXTticmVha31pZig2PT09c1swXSYmYS5sYWJlbDxvWzFdKXthLmxhYmVsPW9bMV0sbz1zO2JyZWFrfWlmKG8mJmEubGFiZWw8b1syXSl7YS5sYWJlbD1vWzJdLGEub3BzLnB1c2gocyk7YnJlYWt9b1syXSYmYS5vcHMucG9wKCksYS50cnlzLnBvcCgpO2NvbnRpbnVlfXM9dC5jYWxsKGUsYSl9Y2F0Y2goZSl7cz1bNixlXSxuPTB9ZmluYWxseXtyPW89MH1pZig1JnNbMF0pdGhyb3cgc1sxXTtyZXR1cm57dmFsdWU6c1swXT9zWzFdOnZvaWQgMCxkb25lOiEwfX0oW3MsaV0pfX19dmFyIG49e30sbz1mdW5jdGlvbihlLHQpe3JldHVybiBlKyJ8Iit0fTthZGRFdmVudExpc3RlbmVyKCJtZXNzYWdlIiwoZnVuY3Rpb24ocyl7dmFyIGE9cy5kYXRhLGk9YS50aW1lb3V0LHU9YS5hdXRoLGM9YS5mZXRjaFVybCxmPWEuZmV0Y2hPcHRpb25zLGw9cy5wb3J0c1swXTtyZXR1cm4gdCh2b2lkIDAsdm9pZCAwLHZvaWQgMCwoZnVuY3Rpb24oKXt2YXIgdCxzLGEsaCxwLGIseSxkLHYsdztyZXR1cm4gcih0aGlzLChmdW5jdGlvbihyKXtzd2l0Y2goci5sYWJlbCl7Y2FzZSAwOmE9KHM9dXx8e30pLmF1ZGllbmNlLGg9cy5zY29wZSxyLmxhYmVsPTE7Y2FzZSAxOmlmKHIudHJ5cy5wdXNoKFsxLDcsLDhdKSwhKHA9SlNPTi5wYXJzZShmLmJvZHkpKS5yZWZyZXNoX3Rva2VuJiYicmVmcmVzaF90b2tlbiI9PT1wLmdyYW50X3R5cGUpe2lmKCEoYj1mdW5jdGlvbihlLHQpe3JldHVybiBuW28oZSx0KV19KGEsaCkpKXRocm93IG5ldyBFcnJvcigiVGhlIHdlYiB3b3JrZXIgaXMgbWlzc2luZyB0aGUgcmVmcmVzaCB0b2tlbiIpO2YuYm9keT1KU09OLnN0cmluZ2lmeShlKGUoe30scCkse3JlZnJlc2hfdG9rZW46Yn0pKX15PXZvaWQgMCwiZnVuY3Rpb24iPT10eXBlb2YgQWJvcnRDb250cm9sbGVyJiYoeT1uZXcgQWJvcnRDb250cm9sbGVyLGYuc2lnbmFsPXkuc2lnbmFsKSxkPXZvaWQgMCxyLmxhYmVsPTI7Y2FzZSAyOnJldHVybiByLnRyeXMucHVzaChbMiw0LCw1XSksWzQsUHJvbWlzZS5yYWNlKFsoZz1pLG5ldyBQcm9taXNlKChmdW5jdGlvbihlKXtyZXR1cm4gc2V0VGltZW91dChlLGcpfSkpKSxmZXRjaChjLGUoe30sZikpXSldO2Nhc2UgMzpyZXR1cm4gZD1yLnNlbnQoKSxbMyw1XTtjYXNlIDQ6cmV0dXJuIHY9ci5zZW50KCksbC5wb3N0TWVzc2FnZSh7ZXJyb3I6di5tZXNzYWdlfSksWzJdO2Nhc2UgNTpyZXR1cm4gZD9bNCxkLmpzb24oKV06KHkmJnkuYWJvcnQoKSxsLnBvc3RNZXNzYWdlKHtlcnJvcjoiVGltZW91dCB3aGVuIGV4ZWN1dGluZyAnZmV0Y2gnIn0pLFsyXSk7Y2FzZSA2OnJldHVybih0PXIuc2VudCgpKS5yZWZyZXNoX3Rva2VuPyhmdW5jdGlvbihlLHQscil7bltvKHQscildPWV9KHQucmVmcmVzaF90b2tlbixhLGgpLGRlbGV0ZSB0LnJlZnJlc2hfdG9rZW4pOmZ1bmN0aW9uKGUsdCl7ZGVsZXRlIG5bbyhlLHQpXX0oYSxoKSxsLnBvc3RNZXNzYWdlKHtvazpkLm9rLGpzb246dH0pLFszLDhdO2Nhc2UgNzpyZXR1cm4gdz1yLnNlbnQoKSxsLnBvc3RNZXNzYWdlKHtvazohMSxqc29uOntlcnJvcl9kZXNjcmlwdGlvbjp3Lm1lc3NhZ2V9fSksWzMsOF07Y2FzZSA4OnJldHVyblsyXX12YXIgZ30pKX0pKX0pKX0oKTsKCg==",vi=null,mi=!1,function(e){return gi=gi||hi(yi,vi,mi),new Worker(gi,e)}),wi={},Si=new To,_i={memory:function(){return (new ni).enclosedCache},localstorage:function(){return new ti}},ki=function(e){return _i[e]},Ii=function(){return !/Trident.*rv:11\.0/.test(navigator.userAgent)},Ti=function(){function e(e){var t,n;if(this.options=e,"undefined"!=typeof window&&function(){if(!Po())throw new Error("For security reasons, `window.crypto` is required to run `auth0-spa-js`.");if(void 0===Fo())throw new Error("\n      auth0-spa-js must run on a secure origin. See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin for more information.\n    ")}(),this.cacheLocation=e.cacheLocation||"memory",this.cookieStorage=!1===e.legacySameSiteCookie?fi:di,this.sessionCheckExpiryDays=e.sessionCheckExpiryDays||1,!ki(this.cacheLocation))throw new Error('Invalid cache location "'+this.cacheLocation+'"');var o,i,a=e.useCookiesForTransactions?this.cookieStorage:pi;this.cache=ki(this.cacheLocation)(),this.scope=this.options.scope,this.transactionManager=new ri(a),this.domainUrl="https://"+this.options.domain,this.tokenIssuer=(o=this.options.issuer,i=this.domainUrl,o?o.startsWith("https://")?o:"https://"+o+"/":i+"/"),this.defaultScope=qo("openid",void 0!==(null===(n=null===(t=this.options)||void 0===t?void 0:t.advancedOptions)||void 0===n?void 0:n.defaultScope)?this.options.advancedOptions.defaultScope:"openid profile email"),this.options.useRefreshTokens&&(this.scope=qo(this.scope,"offline_access")),"undefined"!=typeof window&&window.Worker&&this.options.useRefreshTokens&&"memory"===this.cacheLocation&&Ii()&&(this.worker=new bi),this.customOptions=function(e){return e.advancedOptions,e.audience,e.auth0Client,e.authorizeTimeoutInSeconds,e.cacheLocation,e.client_id,e.domain,e.issuer,e.leeway,e.max_age,e.redirect_uri,e.scope,e.useRefreshTokens,r(e,["advancedOptions","audience","auth0Client","authorizeTimeoutInSeconds","cacheLocation","client_id","domain","issuer","leeway","max_age","redirect_uri","scope","useRefreshTokens"])}(e);}return e.prototype._url=function(e){var t=encodeURIComponent(btoa(JSON.stringify(this.options.auth0Client||xo)));return ""+this.domainUrl+e+"&auth0Client="+t},e.prototype._getParams=function(e,t,o,i,a){var c=this.options;c.domain,c.leeway,c.useRefreshTokens,c.useCookiesForTransactions,c.auth0Client,c.cacheLocation,c.advancedOptions;var s=r(c,["domain","leeway","useRefreshTokens","useCookiesForTransactions","auth0Client","cacheLocation","advancedOptions"]);return n(n(n({},s),e),{scope:qo(this.defaultScope,this.scope,e.scope),response_type:"code",response_mode:"query",state:t,nonce:o,redirect_uri:a||this.options.redirect_uri,code_challenge:i,code_challenge_method:"S256"})},e.prototype._authorizeUrl=function(e){return this._url("/authorize?"+zo(e))},e.prototype._verifyIdToken=function(e,t,n){return ai({iss:this.tokenIssuer,aud:this.options.client_id,id_token:e,nonce:t,organizationId:n,leeway:this.options.leeway,max_age:this._parseNumber(this.options.max_age)})},e.prototype._parseNumber=function(e){return "string"!=typeof e?e:parseInt(e,10)||void 0},e.prototype.buildAuthorizeUrl=function(e){return void 0===e&&(e={}),o(this,void 0,void 0,(function(){var t,o,a,c,s,u,l,f,d,p,h,y;return i(this,(function(i){switch(i.label){case 0:return t=e.redirect_uri,o=e.appState,a=r(e,["redirect_uri","appState"]),c=Wo(Ko()),s=Wo(Ko()),u=Ko(),[4,Vo(u)];case 1:return l=i.sent(),f=Xo(l),d=e.fragment?"#"+e.fragment:"",p=this._getParams(a,c,s,f,t),h=this._authorizeUrl(p),y=e.organization||this.options.organization,this.transactionManager.create(n({nonce:s,code_verifier:u,appState:o,scope:p.scope,audience:p.audience||"default",redirect_uri:p.redirect_uri},y&&{organizationId:y})),[2,h+d]}}))}))},e.prototype.loginWithPopup=function(e,t){return o(this,void 0,void 0,(function(){var o,a,c,s,u,l,f,d,p,h,y,v,m;return i(this,(function(i){switch(i.label){case 0:return e=e||{},(t=t||{}).popup||(t.popup=function(e){var t=window.screenX+(window.innerWidth-400)/2,n=window.screenY+(window.innerHeight-600)/2;return window.open(e,"auth0:authorize:popup","left="+t+",top="+n+",width=400,height=600,resizable,scrollbars=yes,status=1")}("")),o=r(e,[]),a=Wo(Ko()),c=Wo(Ko()),s=Ko(),[4,Vo(s)];case 1:return u=i.sent(),l=Xo(u),f=this._getParams(o,a,c,l,this.options.redirect_uri||window.location.origin),d=this._authorizeUrl(n(n({},f),{response_mode:"web_message"})),t.popup.location.href=d,[4,Ao(n(n({},t),{timeoutInSeconds:t.timeoutInSeconds||this.options.authorizeTimeoutInSeconds||60}))];case 2:if(p=i.sent(),a!==p.state)throw new Error("Invalid state");return [4,Bo({audience:f.audience,scope:f.scope,baseUrl:this.domainUrl,client_id:this.options.client_id,code_verifier:s,code:p.code,grant_type:"authorization_code",redirect_uri:f.redirect_uri,auth0Client:this.options.auth0Client},this.worker)];case 3:return h=i.sent(),y=e.organization||this.options.organization,v=this._verifyIdToken(h.id_token,c,y),m=n(n({},h),{decodedToken:v,scope:f.scope,audience:f.audience||"default",client_id:this.options.client_id}),this.cache.save(m),this.cookieStorage.save("auth0.is.authenticated",!0,{daysUntilExpire:this.sessionCheckExpiryDays}),[2]}}))}))},e.prototype.getUser=function(e){return void 0===e&&(e={}),o(this,void 0,void 0,(function(){var t,n,r;return i(this,(function(o){return t=e.audience||this.options.audience||"default",n=qo(this.defaultScope,this.scope,e.scope),[2,(r=this.cache.get(new Ho({client_id:this.options.client_id,audience:t,scope:n})))&&r.decodedToken&&r.decodedToken.user]}))}))},e.prototype.getIdTokenClaims=function(e){return void 0===e&&(e={}),o(this,void 0,void 0,(function(){var t,n,r;return i(this,(function(o){return t=e.audience||this.options.audience||"default",n=qo(this.defaultScope,this.scope,e.scope),[2,(r=this.cache.get(new Ho({client_id:this.options.client_id,audience:t,scope:n})))&&r.decodedToken&&r.decodedToken.claims]}))}))},e.prototype.loginWithRedirect=function(e){return void 0===e&&(e={}),o(this,void 0,void 0,(function(){var t,n,o;return i(this,(function(i){switch(i.label){case 0:return t=e.redirectMethod,n=r(e,["redirectMethod"]),[4,this.buildAuthorizeUrl(n)];case 1:return o=i.sent(),window.location[t||"assign"](o),[2]}}))}))},e.prototype.handleRedirectCallback=function(e){return void 0===e&&(e=window.location.href),o(this,void 0,void 0,(function(){var t,r,o,a,c,s,u,l,f,d,p;return i(this,(function(i){switch(i.label){case 0:if(0===(t=e.split("?").slice(1)).length)throw new Error("There are no query params available for parsing.");if(r=function(e){e.indexOf("#")>-1&&(e=e.substr(0,e.indexOf("#")));var t=e.split("&"),r={};return t.forEach((function(e){var t=e.split("="),n=t[0],o=t[1];r[n]=decodeURIComponent(o);})),n(n({},r),{expires_in:parseInt(r.expires_in)})}(t.join("")),o=r.state,a=r.code,c=r.error,s=r.error_description,!(u=this.transactionManager.get())||!u.code_verifier)throw new Error("Invalid state");if(this.transactionManager.remove(),c)throw new Lo(c,s,o,u.appState);return l={audience:u.audience,scope:u.scope,baseUrl:this.domainUrl,client_id:this.options.client_id,code_verifier:u.code_verifier,grant_type:"authorization_code",code:a,auth0Client:this.options.auth0Client},void 0!==u.redirect_uri&&(l.redirect_uri=u.redirect_uri),[4,Bo(l,this.worker)];case 1:return f=i.sent(),d=this._verifyIdToken(f.id_token,u.nonce,u.organizationId),p=n(n({},f),{decodedToken:d,audience:u.audience,scope:u.scope,client_id:this.options.client_id}),this.cache.save(p),this.cookieStorage.save("auth0.is.authenticated",!0,{daysUntilExpire:this.sessionCheckExpiryDays}),[2,{appState:u.appState}]}}))}))},e.prototype.checkSession=function(e){return o(this,void 0,void 0,(function(){var t;return i(this,(function(n){switch(n.label){case 0:if(!this.cookieStorage.get("auth0.is.authenticated"))return [2];n.label=1;case 1:return n.trys.push([1,3,,4]),[4,this.getTokenSilently(e)];case 2:return n.sent(),[3,4];case 3:if(t=n.sent(),!Eo.includes(t.error))throw t;return [3,4];case 4:return [2]}}))}))},e.prototype.getTokenSilently=function(e){return void 0===e&&(e={}),o(this,void 0,void 0,(function(){var t,o,a,c=this;return i(this,(function(i){return t=n(n({audience:this.options.audience,ignoreCache:!1},e),{scope:qo(this.defaultScope,this.scope,e.scope)}),o=t.ignoreCache,a=r(t,["ignoreCache"]),[2,(s=function(){return c._getTokenSilently(n({ignoreCache:o},a))},u=this.options.client_id+"::"+a.audience+"::"+a.scope,l=wi[u],l||(l=s().finally((function(){delete wi[u],l=null;})),wi[u]=l),l)];var s,u,l;}))}))},e.prototype._getTokenSilently=function(e){return void 0===e&&(e={}),o(this,void 0,void 0,(function(){var t,a,c,s,u,l,f=this;return i(this,(function(d){switch(d.label){case 0:return t=e.ignoreCache,a=r(e,["ignoreCache"]),c=function(){var e=f.cache.get(new Ho({scope:a.scope,audience:a.audience||"default",client_id:f.options.client_id}),60);return e&&e.access_token},!t&&(s=c())?[2,s]:[4,(p=function(){return Si.acquireLock("auth0.lock.getTokenSilently",5e3)},h=10,void 0===h&&(h=3),o(void 0,void 0,void 0,(function(){var e;return i(this,(function(t){switch(t.label){case 0:e=0,t.label=1;case 1:return e<h?[4,p()]:[3,4];case 2:if(t.sent())return [2,!0];t.label=3;case 3:return e++,[3,1];case 4:return [2,!1]}}))})))];case 1:if(!d.sent())return [3,10];d.label=2;case 2:return d.trys.push([2,,7,9]),!t&&(s=c())?[2,s]:this.options.useRefreshTokens?[4,this._getTokenUsingRefreshToken(a)]:[3,4];case 3:return l=d.sent(),[3,6];case 4:return [4,this._getTokenFromIFrame(a)];case 5:l=d.sent(),d.label=6;case 6:return u=l,this.cache.save(n({client_id:this.options.client_id},u)),this.cookieStorage.save("auth0.is.authenticated",!0,{daysUntilExpire:this.sessionCheckExpiryDays}),[2,u.access_token];case 7:return [4,Si.releaseLock("auth0.lock.getTokenSilently")];case 8:return d.sent(),[7];case 9:return [3,11];case 10:throw new Co;case 11:return [2]}var p,h;}))}))},e.prototype.getTokenWithPopup=function(e,t){return void 0===e&&(e={}),void 0===t&&(t={}),o(this,void 0,void 0,(function(){return i(this,(function(r){switch(r.label){case 0:return e.audience=e.audience||this.options.audience,e.scope=qo(this.defaultScope,this.scope,e.scope),t=n(n({},Oo),t),[4,this.loginWithPopup(e,t)];case 1:return r.sent(),[2,this.cache.get(new Ho({scope:e.scope,audience:e.audience||"default",client_id:this.options.client_id})).access_token]}}))}))},e.prototype.isAuthenticated=function(){return o(this,void 0,void 0,(function(){return i(this,(function(e){switch(e.label){case 0:return [4,this.getUser()];case 1:return [2,!!e.sent()]}}))}))},e.prototype.buildLogoutUrl=function(e){void 0===e&&(e={}),null!==e.client_id?e.client_id=e.client_id||this.options.client_id:delete e.client_id;var t=e.federated,n=r(e,["federated"]),o=t?"&federated":"";return this._url("/v2/logout?"+zo(n))+o},e.prototype.logout=function(e){void 0===e&&(e={});var t=e.localOnly,n=r(e,["localOnly"]);if(t&&n.federated)throw new Error("It is invalid to set both the `federated` and `localOnly` options to `true`");if(this.cache.clear(),this.cookieStorage.remove("auth0.is.authenticated"),!t){var o=this.buildLogoutUrl(n);window.location.assign(o);}},e.prototype._getTokenFromIFrame=function(e){return o(this,void 0,void 0,(function(){var t,o,a,c,s,u,l,f,d,p,h,y,v,m,g;return i(this,(function(i){switch(i.label){case 0:return t=Wo(Ko()),o=Wo(Ko()),a=Ko(),[4,Vo(a)];case 1:c=i.sent(),s=Xo(c),u=this._getParams(e,t,o,s,e.redirect_uri||this.options.redirect_uri||window.location.origin),l=this._authorizeUrl(n(n({},u),{prompt:"none",response_mode:"web_message"})),f=e.timeoutInSeconds||this.options.authorizeTimeoutInSeconds,i.label=2;case 2:return i.trys.push([2,5,,6]),[4,(b=l,w=this.domainUrl,S=f,void 0===S&&(S=60),new Promise((function(e,t){var n=window.document.createElement("iframe");n.setAttribute("width","0"),n.setAttribute("height","0"),n.style.display="none";var r,o=function(){window.document.body.contains(n)&&(window.document.body.removeChild(n),window.removeEventListener("message",r,!1));},i=setTimeout((function(){t(new Co),o();}),1e3*S);r=function(n){if(n.origin==w&&n.data&&"authorization_response"===n.data.type){var a=n.source;a&&a.close(),n.data.response.error?t(Ro.fromPayload(n.data.response)):e(n.data.response),clearTimeout(i),window.removeEventListener("message",r,!1),setTimeout(o,2e3);}},window.addEventListener("message",r,!1),window.document.body.appendChild(n),n.setAttribute("src",b);})))];case 3:if(d=i.sent(),t!==d.state)throw new Error("Invalid state");return p=e.scope,h=e.audience,e.redirect_uri,e.ignoreCache,e.timeoutInSeconds,y=r(e,["scope","audience","redirect_uri","ignoreCache","timeoutInSeconds"]),[4,Bo(n(n(n({},this.customOptions),y),{scope:p,audience:h,baseUrl:this.domainUrl,client_id:this.options.client_id,code_verifier:a,code:d.code,grant_type:"authorization_code",redirect_uri:u.redirect_uri,auth0Client:this.options.auth0Client}),this.worker)];case 4:return v=i.sent(),m=this._verifyIdToken(v.id_token,o),[2,n(n({},v),{decodedToken:m,scope:u.scope,audience:u.audience||"default"})];case 5:throw "login_required"===(g=i.sent()).error&&this.logout({localOnly:!0}),g;case 6:return [2]}var b,w,S;}))}))},e.prototype._getTokenUsingRefreshToken=function(e){return o(this,void 0,void 0,(function(){var t,o,a,c,s,u,l,f,d;return i(this,(function(i){switch(i.label){case 0:return e.scope=qo(this.defaultScope,this.options.scope,e.scope),(t=this.cache.get(new Ho({scope:e.scope,audience:e.audience||"default",client_id:this.options.client_id})))&&t.refresh_token||this.worker?[3,2]:[4,this._getTokenFromIFrame(e)];case 1:return [2,i.sent()];case 2:o=e.redirect_uri||this.options.redirect_uri||window.location.origin,c=e.scope,s=e.audience,e.ignoreCache,e.timeoutInSeconds,u=r(e,["scope","audience","ignoreCache","timeoutInSeconds"]),l="number"==typeof e.timeoutInSeconds?1e3*e.timeoutInSeconds:null,i.label=3;case 3:return i.trys.push([3,5,,8]),[4,Bo(n(n(n(n(n({},this.customOptions),u),{audience:s,scope:c,baseUrl:this.domainUrl,client_id:this.options.client_id,grant_type:"refresh_token",refresh_token:t&&t.refresh_token,redirect_uri:o}),l&&{timeout:l}),{auth0Client:this.options.auth0Client}),this.worker)];case 4:return a=i.sent(),[3,8];case 5:return "The web worker is missing the refresh token"===(f=i.sent()).message||f.message&&f.message.indexOf("invalid refresh token")>-1?[4,this._getTokenFromIFrame(e)]:[3,7];case 6:return [2,i.sent()];case 7:throw f;case 8:return d=this._verifyIdToken(a.id_token),[2,n(n({},a),{decodedToken:d,scope:e.scope,audience:e.audience||"default"})]}}))}))},e}();function Ei(e){return o(this,void 0,void 0,(function(){var t;return i(this,(function(n){switch(n.label){case 0:return [4,(t=new Ti(e)).checkSession()];case 1:return n.sent(),[2,t]}}))}))}

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const isAuthenticated = writable(false);
    const user = writable({});
    const popUpOpen = writable(false);

    const config = {
        domain: {"env":{"isProd":false,"domain":"mkoptur.eu.auth0.com","cid":"zkCTYbRGvvqqBEiV6muXqgnjqKgpBdwh"}}.env.domain,
        clientId:{"env":{"isProd":false,"domain":"mkoptur.eu.auth0.com","cid":"zkCTYbRGvvqqBEiV6muXqgnjqKgpBdwh"}}.env.cid
    };

    async function createClient() {
        let auth0Client = await Ei({
            domain: config.domain,
            client_id: config.clientId
        });

        return auth0Client;
    }

    async function login(client, opts) {
        popUpOpen.set(true);
        try {
            await client.loginWithPopup(opts);

            user.set(await client.getUser());
            isAuthenticated.set(true);
        } catch (e) {
            console.error(e);
        } finally {
            popUpOpen.set(false);
        }
    }

    function logout(client) {
        return client.logout();
    }

    const auth = {
        createClient,
        login,
        logout
    };

    function isObject(value) {
      const type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    function getColumnSizeClass(isXs, colWidth, colSize) {
      if (colSize === true || colSize === '') {
        return isXs ? 'col' : `col-${colWidth}`;
      } else if (colSize === 'auto') {
        return isXs ? 'col-auto' : `col-${colWidth}-auto`;
      }

      return isXs ? `col-${colSize}` : `col-${colWidth}-${colSize}`;
    }

    function toClassName(value) {
      let result = '';

      if (typeof value === 'string' || typeof value === 'number') {
        result += value;
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result = value.map(toClassName).filter(Boolean).join(' ');
        } else {
          for (let key in value) {
            if (value[key]) {
              result && (result += ' ');
              result += key;
            }
          }
        }
      }

      return result;
    }

    function classnames(...args) {
      return args.map(toClassName).filter(Boolean).join(' ');
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* node_modules/sveltestrap/src/Alert.svelte generated by Svelte v3.38.2 */
    const file$9 = "node_modules/sveltestrap/src/Alert.svelte";
    const get_heading_slot_changes = dirty => ({});
    const get_heading_slot_context = ctx => ({});

    // (26:0) {#if isOpen}
    function create_if_block$2(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current_block_type_index;
    	let if_block2;
    	let div_transition;
    	let current;
    	let if_block0 = (/*heading*/ ctx[3] || /*$$slots*/ ctx[10].heading) && create_if_block_3(ctx);
    	let if_block1 = /*showClose*/ ctx[5] && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block_1$1, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*children*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let div_levels = [/*$$restProps*/ ctx[9], { class: /*classes*/ ctx[7] }, { role: "alert" }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if_block2.c();
    			set_attributes(div, div_data);
    			add_location(div, file$9, 26, 2, 808);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*heading*/ ctx[3] || /*$$slots*/ ctx[10].heading) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*heading, $$slots*/ 1032) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*showClose*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				} else {
    					if_block2.p(ctx, dirty);
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div, null);
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 512 && /*$$restProps*/ ctx[9],
    				(!current || dirty & /*classes*/ 128) && { class: /*classes*/ ctx[7] },
    				{ role: "alert" }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block2);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, /*transition*/ ctx[4], true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block2);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, /*transition*/ ctx[4], false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_blocks[current_block_type_index].d();
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(26:0) {#if isOpen}",
    		ctx
    	});

    	return block;
    }

    // (32:4) {#if heading || $$slots.heading}
    function create_if_block_3(ctx) {
    	let h4;
    	let t;
    	let current;
    	const heading_slot_template = /*#slots*/ ctx[18].heading;
    	const heading_slot = create_slot(heading_slot_template, ctx, /*$$scope*/ ctx[17], get_heading_slot_context);

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(/*heading*/ ctx[3]);
    			if (heading_slot) heading_slot.c();
    			attr_dev(h4, "class", "alert-heading");
    			add_location(h4, file$9, 32, 6, 958);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);

    			if (heading_slot) {
    				heading_slot.m(h4, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*heading*/ 8) set_data_dev(t, /*heading*/ ctx[3]);

    			if (heading_slot) {
    				if (heading_slot.p && (!current || dirty & /*$$scope*/ 131072)) {
    					update_slot(heading_slot, heading_slot_template, ctx, /*$$scope*/ ctx[17], dirty, get_heading_slot_changes, get_heading_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(heading_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(heading_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (heading_slot) heading_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(32:4) {#if heading || $$slots.heading}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#if showClose}
    function create_if_block_2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", /*closeClassNames*/ ctx[8]);
    			attr_dev(button, "aria-label", /*closeAriaLabel*/ ctx[2]);
    			add_location(button, file$9, 37, 6, 1074);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*handleToggle*/ ctx[6])) /*handleToggle*/ ctx[6].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*closeClassNames*/ 256) {
    				attr_dev(button, "class", /*closeClassNames*/ ctx[8]);
    			}

    			if (dirty & /*closeAriaLabel*/ 4) {
    				attr_dev(button, "aria-label", /*closeAriaLabel*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(37:4) {#if showClose}",
    		ctx
    	});

    	return block;
    }

    // (46:4) {:else}
    function create_else_block$2(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[18].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[17], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 131072)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[17], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(46:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (44:4) {#if children}
    function create_if_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*children*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children*/ 2) set_data_dev(t, /*children*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(44:4) {#if children}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*isOpen*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isOpen*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isOpen*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let showClose;
    	let handleToggle;
    	let classes;
    	let closeClassNames;

    	const omit_props_names = [
    		"class","children","color","closeClassName","closeAriaLabel","dismissible","heading","isOpen","toggle","fade","transition"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Alert", slots, ['heading','default']);
    	const $$slots = compute_slots(slots);
    	let { class: className = "" } = $$props;
    	let { children = undefined } = $$props;
    	let { color = "success" } = $$props;
    	let { closeClassName = "" } = $$props;
    	let { closeAriaLabel = "Close" } = $$props;
    	let { dismissible = false } = $$props;
    	let { heading = undefined } = $$props;
    	let { isOpen = true } = $$props;
    	let { toggle = undefined } = $$props;
    	let { fade: fade$1 = true } = $$props;
    	let { transition = { duration: fade$1 ? 400 : 0 } } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(9, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(11, className = $$new_props.class);
    		if ("children" in $$new_props) $$invalidate(1, children = $$new_props.children);
    		if ("color" in $$new_props) $$invalidate(12, color = $$new_props.color);
    		if ("closeClassName" in $$new_props) $$invalidate(13, closeClassName = $$new_props.closeClassName);
    		if ("closeAriaLabel" in $$new_props) $$invalidate(2, closeAriaLabel = $$new_props.closeAriaLabel);
    		if ("dismissible" in $$new_props) $$invalidate(14, dismissible = $$new_props.dismissible);
    		if ("heading" in $$new_props) $$invalidate(3, heading = $$new_props.heading);
    		if ("isOpen" in $$new_props) $$invalidate(0, isOpen = $$new_props.isOpen);
    		if ("toggle" in $$new_props) $$invalidate(15, toggle = $$new_props.toggle);
    		if ("fade" in $$new_props) $$invalidate(16, fade$1 = $$new_props.fade);
    		if ("transition" in $$new_props) $$invalidate(4, transition = $$new_props.transition);
    		if ("$$scope" in $$new_props) $$invalidate(17, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		fadeTransition: fade,
    		classnames,
    		className,
    		children,
    		color,
    		closeClassName,
    		closeAriaLabel,
    		dismissible,
    		heading,
    		isOpen,
    		toggle,
    		fade: fade$1,
    		transition,
    		showClose,
    		handleToggle,
    		classes,
    		closeClassNames
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(11, className = $$new_props.className);
    		if ("children" in $$props) $$invalidate(1, children = $$new_props.children);
    		if ("color" in $$props) $$invalidate(12, color = $$new_props.color);
    		if ("closeClassName" in $$props) $$invalidate(13, closeClassName = $$new_props.closeClassName);
    		if ("closeAriaLabel" in $$props) $$invalidate(2, closeAriaLabel = $$new_props.closeAriaLabel);
    		if ("dismissible" in $$props) $$invalidate(14, dismissible = $$new_props.dismissible);
    		if ("heading" in $$props) $$invalidate(3, heading = $$new_props.heading);
    		if ("isOpen" in $$props) $$invalidate(0, isOpen = $$new_props.isOpen);
    		if ("toggle" in $$props) $$invalidate(15, toggle = $$new_props.toggle);
    		if ("fade" in $$props) $$invalidate(16, fade$1 = $$new_props.fade);
    		if ("transition" in $$props) $$invalidate(4, transition = $$new_props.transition);
    		if ("showClose" in $$props) $$invalidate(5, showClose = $$new_props.showClose);
    		if ("handleToggle" in $$props) $$invalidate(6, handleToggle = $$new_props.handleToggle);
    		if ("classes" in $$props) $$invalidate(7, classes = $$new_props.classes);
    		if ("closeClassNames" in $$props) $$invalidate(8, closeClassNames = $$new_props.closeClassNames);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*dismissible, toggle*/ 49152) {
    			$$invalidate(5, showClose = dismissible || toggle);
    		}

    		if ($$self.$$.dirty & /*toggle*/ 32768) {
    			$$invalidate(6, handleToggle = toggle || (() => $$invalidate(0, isOpen = false)));
    		}

    		if ($$self.$$.dirty & /*className, color, showClose*/ 6176) {
    			$$invalidate(7, classes = classnames(className, "alert", `alert-${color}`, { "alert-dismissible": showClose }));
    		}

    		if ($$self.$$.dirty & /*closeClassName*/ 8192) {
    			$$invalidate(8, closeClassNames = classnames("btn-close", closeClassName));
    		}
    	};

    	return [
    		isOpen,
    		children,
    		closeAriaLabel,
    		heading,
    		transition,
    		showClose,
    		handleToggle,
    		classes,
    		closeClassNames,
    		$$restProps,
    		$$slots,
    		className,
    		color,
    		closeClassName,
    		dismissible,
    		toggle,
    		fade$1,
    		$$scope,
    		slots
    	];
    }

    class Alert extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			class: 11,
    			children: 1,
    			color: 12,
    			closeClassName: 13,
    			closeAriaLabel: 2,
    			dismissible: 14,
    			heading: 3,
    			isOpen: 0,
    			toggle: 15,
    			fade: 16,
    			transition: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Alert",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get class() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get children() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set children(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeClassName() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeClassName(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeAriaLabel() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeAriaLabel(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dismissible() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dismissible(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get heading() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set heading(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpen() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpen(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggle() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggle(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fade() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fade(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transition() {
    		throw new Error("<Alert>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transition(value) {
    		throw new Error("<Alert>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Col.svelte generated by Svelte v3.38.2 */
    const file$8 = "node_modules/sveltestrap/src/Col.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	let div_levels = [
    		/*$$restProps*/ ctx[1],
    		{
    			class: div_class_value = /*colClasses*/ ctx[0].join(" ")
    		}
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$8, 60, 0, 1427);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				{ class: div_class_value }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const omit_props_names = ["class","xs","sm","md","lg","xl","xxl"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Col", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { xs = undefined } = $$props;
    	let { sm = undefined } = $$props;
    	let { md = undefined } = $$props;
    	let { lg = undefined } = $$props;
    	let { xl = undefined } = $$props;
    	let { xxl = undefined } = $$props;
    	const colClasses = [];
    	const lookup = { xs, sm, md, lg, xl, xxl };

    	Object.keys(lookup).forEach(colWidth => {
    		const columnProp = lookup[colWidth];

    		if (!columnProp && columnProp !== "") {
    			return; //no value for this width
    		}

    		const isXs = colWidth === "xs";

    		if (isObject(columnProp)) {
    			const colSizeInterfix = isXs ? "-" : `-${colWidth}-`;
    			const colClass = getColumnSizeClass(isXs, colWidth, columnProp.size);

    			if (columnProp.size || columnProp.size === "") {
    				colClasses.push(colClass);
    			}

    			if (columnProp.push) {
    				colClasses.push(`push${colSizeInterfix}${columnProp.push}`);
    			}

    			if (columnProp.pull) {
    				colClasses.push(`pull${colSizeInterfix}${columnProp.pull}`);
    			}

    			if (columnProp.offset) {
    				colClasses.push(`offset${colSizeInterfix}${columnProp.offset}`);
    			}
    		} else {
    			colClasses.push(getColumnSizeClass(isXs, colWidth, columnProp));
    		}
    	});

    	if (!colClasses.length) {
    		colClasses.push("col");
    	}

    	if (className) {
    		colClasses.push(className);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("xs" in $$new_props) $$invalidate(3, xs = $$new_props.xs);
    		if ("sm" in $$new_props) $$invalidate(4, sm = $$new_props.sm);
    		if ("md" in $$new_props) $$invalidate(5, md = $$new_props.md);
    		if ("lg" in $$new_props) $$invalidate(6, lg = $$new_props.lg);
    		if ("xl" in $$new_props) $$invalidate(7, xl = $$new_props.xl);
    		if ("xxl" in $$new_props) $$invalidate(8, xxl = $$new_props.xxl);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getColumnSizeClass,
    		isObject,
    		className,
    		xs,
    		sm,
    		md,
    		lg,
    		xl,
    		xxl,
    		colClasses,
    		lookup
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("xs" in $$props) $$invalidate(3, xs = $$new_props.xs);
    		if ("sm" in $$props) $$invalidate(4, sm = $$new_props.sm);
    		if ("md" in $$props) $$invalidate(5, md = $$new_props.md);
    		if ("lg" in $$props) $$invalidate(6, lg = $$new_props.lg);
    		if ("xl" in $$props) $$invalidate(7, xl = $$new_props.xl);
    		if ("xxl" in $$props) $$invalidate(8, xxl = $$new_props.xxl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [colClasses, $$restProps, className, xs, sm, md, lg, xl, xxl, $$scope, slots];
    }

    class Col extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			class: 2,
    			xs: 3,
    			sm: 4,
    			md: 5,
    			lg: 6,
    			xl: 7,
    			xxl: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Col",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get class() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xs() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xs(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get md() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set md(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xl() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xl(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xxl() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xxl(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Container.svelte generated by Svelte v3.38.2 */
    const file$7 = "node_modules/sveltestrap/src/Container.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$7, 23, 0, 542);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","sm","md","lg","xl","xxl","fluid"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Container", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { sm = undefined } = $$props;
    	let { md = undefined } = $$props;
    	let { lg = undefined } = $$props;
    	let { xl = undefined } = $$props;
    	let { xxl = undefined } = $$props;
    	let { fluid = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("sm" in $$new_props) $$invalidate(3, sm = $$new_props.sm);
    		if ("md" in $$new_props) $$invalidate(4, md = $$new_props.md);
    		if ("lg" in $$new_props) $$invalidate(5, lg = $$new_props.lg);
    		if ("xl" in $$new_props) $$invalidate(6, xl = $$new_props.xl);
    		if ("xxl" in $$new_props) $$invalidate(7, xxl = $$new_props.xxl);
    		if ("fluid" in $$new_props) $$invalidate(8, fluid = $$new_props.fluid);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		sm,
    		md,
    		lg,
    		xl,
    		xxl,
    		fluid,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("sm" in $$props) $$invalidate(3, sm = $$new_props.sm);
    		if ("md" in $$props) $$invalidate(4, md = $$new_props.md);
    		if ("lg" in $$props) $$invalidate(5, lg = $$new_props.lg);
    		if ("xl" in $$props) $$invalidate(6, xl = $$new_props.xl);
    		if ("xxl" in $$props) $$invalidate(7, xxl = $$new_props.xxl);
    		if ("fluid" in $$props) $$invalidate(8, fluid = $$new_props.fluid);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, sm, md, lg, xl, xxl, fluid*/ 508) {
    			$$invalidate(0, classes = classnames(className, {
    				"container-sm": sm,
    				"container-md": md,
    				"container-lg": lg,
    				"container-xl": xl,
    				"container-xxl": xxl,
    				"container-fluid": fluid,
    				container: !sm && !md && !lg && !xl && !xxl && !fluid
    			}));
    		}
    	};

    	return [classes, $$restProps, className, sm, md, lg, xl, xxl, fluid, $$scope, slots];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			class: 2,
    			sm: 3,
    			md: 4,
    			lg: 5,
    			xl: 6,
    			xxl: 7,
    			fluid: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get class() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sm() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sm(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get md() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set md(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lg() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lg(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xl() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xl(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xxl() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xxl(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fluid() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fluid(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Nav.svelte generated by Svelte v3.38.2 */
    const file$6 = "node_modules/sveltestrap/src/Nav.svelte";

    function create_fragment$6(ctx) {
    	let ul;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	let ul_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let ul_data = {};

    	for (let i = 0; i < ul_levels.length; i += 1) {
    		ul_data = assign(ul_data, ul_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			set_attributes(ul, ul_data);
    			add_location(ul, file$6, 39, 0, 941);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
    				}
    			}

    			set_attributes(ul, ul_data = get_spread_update(ul_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getVerticalClass(vertical) {
    	if (vertical === false) {
    		return false;
    	} else if (vertical === true || vertical === "xs") {
    		return "flex-column";
    	}

    	return `flex-${vertical}-column`;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let classes;

    	const omit_props_names = [
    		"class","tabs","pills","vertical","horizontal","justified","fill","navbar","card"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nav", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { tabs = false } = $$props;
    	let { pills = false } = $$props;
    	let { vertical = false } = $$props;
    	let { horizontal = "" } = $$props;
    	let { justified = false } = $$props;
    	let { fill = false } = $$props;
    	let { navbar = false } = $$props;
    	let { card = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("tabs" in $$new_props) $$invalidate(3, tabs = $$new_props.tabs);
    		if ("pills" in $$new_props) $$invalidate(4, pills = $$new_props.pills);
    		if ("vertical" in $$new_props) $$invalidate(5, vertical = $$new_props.vertical);
    		if ("horizontal" in $$new_props) $$invalidate(6, horizontal = $$new_props.horizontal);
    		if ("justified" in $$new_props) $$invalidate(7, justified = $$new_props.justified);
    		if ("fill" in $$new_props) $$invalidate(8, fill = $$new_props.fill);
    		if ("navbar" in $$new_props) $$invalidate(9, navbar = $$new_props.navbar);
    		if ("card" in $$new_props) $$invalidate(10, card = $$new_props.card);
    		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		tabs,
    		pills,
    		vertical,
    		horizontal,
    		justified,
    		fill,
    		navbar,
    		card,
    		getVerticalClass,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("tabs" in $$props) $$invalidate(3, tabs = $$new_props.tabs);
    		if ("pills" in $$props) $$invalidate(4, pills = $$new_props.pills);
    		if ("vertical" in $$props) $$invalidate(5, vertical = $$new_props.vertical);
    		if ("horizontal" in $$props) $$invalidate(6, horizontal = $$new_props.horizontal);
    		if ("justified" in $$props) $$invalidate(7, justified = $$new_props.justified);
    		if ("fill" in $$props) $$invalidate(8, fill = $$new_props.fill);
    		if ("navbar" in $$props) $$invalidate(9, navbar = $$new_props.navbar);
    		if ("card" in $$props) $$invalidate(10, card = $$new_props.card);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, navbar, horizontal, vertical, tabs, card, pills, justified, fill*/ 2044) {
    			$$invalidate(0, classes = classnames(className, navbar ? "navbar-nav" : "nav", horizontal ? `justify-content-${horizontal}` : false, getVerticalClass(vertical), {
    				"nav-tabs": tabs,
    				"card-header-tabs": card && tabs,
    				"nav-pills": pills,
    				"card-header-pills": card && pills,
    				"nav-justified": justified,
    				"nav-fill": fill
    			}));
    		}
    	};

    	return [
    		classes,
    		$$restProps,
    		className,
    		tabs,
    		pills,
    		vertical,
    		horizontal,
    		justified,
    		fill,
    		navbar,
    		card,
    		$$scope,
    		slots
    	];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			class: 2,
    			tabs: 3,
    			pills: 4,
    			vertical: 5,
    			horizontal: 6,
    			justified: 7,
    			fill: 8,
    			navbar: 9,
    			card: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get class() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabs() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pills() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pills(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get horizontal() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get justified() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set justified(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fill() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get navbar() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set navbar(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get card() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set card(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Navbar.svelte generated by Svelte v3.38.2 */
    const file$5 = "node_modules/sveltestrap/src/Navbar.svelte";

    // (39:2) {:else}
    function create_else_block$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(39:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:2) {#if container}
    function create_if_block$1(ctx) {
    	let container_1;
    	let current;

    	container_1 = new Container({
    			props: {
    				fluid: /*container*/ ctx[0] === "fluid",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(container_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(container_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const container_1_changes = {};
    			if (dirty & /*container*/ 1) container_1_changes.fluid = /*container*/ ctx[0] === "fluid";

    			if (dirty & /*$$scope*/ 2048) {
    				container_1_changes.$$scope = { dirty, ctx };
    			}

    			container_1.$set(container_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(35:2) {#if container}",
    		ctx
    	});

    	return block;
    }

    // (36:4) <Container fluid={container === 'fluid'}>
    function create_default_slot$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(36:4) <Container fluid={container === 'fluid'}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let nav;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*container*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let nav_levels = [/*$$restProps*/ ctx[2], { class: /*classes*/ ctx[1] }];
    	let nav_data = {};

    	for (let i = 0; i < nav_levels.length; i += 1) {
    		nav_data = assign(nav_data, nav_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			if_block.c();
    			set_attributes(nav, nav_data);
    			add_location(nav, file$5, 33, 0, 799);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			if_blocks[current_block_type_index].m(nav, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(nav, null);
    			}

    			set_attributes(nav, nav_data = get_spread_update(nav_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getExpandClass(expand) {
    	if (expand === false) {
    		return false;
    	} else if (expand === true || expand === "xs") {
    		return "navbar-expand";
    	}

    	return `navbar-expand-${expand}`;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","container","color","dark","expand","fixed","light","sticky"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { container = "fluid" } = $$props;
    	let { color = "" } = $$props;
    	let { dark = false } = $$props;
    	let { expand = "" } = $$props;
    	let { fixed = "" } = $$props;
    	let { light = false } = $$props;
    	let { sticky = "" } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ("container" in $$new_props) $$invalidate(0, container = $$new_props.container);
    		if ("color" in $$new_props) $$invalidate(4, color = $$new_props.color);
    		if ("dark" in $$new_props) $$invalidate(5, dark = $$new_props.dark);
    		if ("expand" in $$new_props) $$invalidate(6, expand = $$new_props.expand);
    		if ("fixed" in $$new_props) $$invalidate(7, fixed = $$new_props.fixed);
    		if ("light" in $$new_props) $$invalidate(8, light = $$new_props.light);
    		if ("sticky" in $$new_props) $$invalidate(9, sticky = $$new_props.sticky);
    		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		Container,
    		className,
    		container,
    		color,
    		dark,
    		expand,
    		fixed,
    		light,
    		sticky,
    		getExpandClass,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
    		if ("container" in $$props) $$invalidate(0, container = $$new_props.container);
    		if ("color" in $$props) $$invalidate(4, color = $$new_props.color);
    		if ("dark" in $$props) $$invalidate(5, dark = $$new_props.dark);
    		if ("expand" in $$props) $$invalidate(6, expand = $$new_props.expand);
    		if ("fixed" in $$props) $$invalidate(7, fixed = $$new_props.fixed);
    		if ("light" in $$props) $$invalidate(8, light = $$new_props.light);
    		if ("sticky" in $$props) $$invalidate(9, sticky = $$new_props.sticky);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, expand, light, dark, color, fixed, sticky*/ 1016) {
    			$$invalidate(1, classes = classnames(className, "navbar", getExpandClass(expand), {
    				"navbar-light": light,
    				"navbar-dark": dark,
    				[`bg-${color}`]: color,
    				[`fixed-${fixed}`]: fixed,
    				[`sticky-${sticky}`]: sticky
    			}));
    		}
    	};

    	return [
    		container,
    		classes,
    		$$restProps,
    		className,
    		color,
    		dark,
    		expand,
    		fixed,
    		light,
    		sticky,
    		slots,
    		$$scope
    	];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			class: 3,
    			container: 0,
    			color: 4,
    			dark: 5,
    			expand: 6,
    			fixed: 7,
    			light: 8,
    			sticky: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get class() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get container() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set container(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expand() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expand(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fixed() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fixed(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get light() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set light(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sticky() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sticky(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/NavItem.svelte generated by Svelte v3.38.2 */
    const file$4 = "node_modules/sveltestrap/src/NavItem.svelte";

    function create_fragment$4(ctx) {
    	let li;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let li_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let li_data = {};

    	for (let i = 0; i < li_levels.length; i += 1) {
    		li_data = assign(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (default_slot) default_slot.c();
    			set_attributes(li, li_data);
    			add_location(li, file$4, 10, 0, 219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			set_attributes(li, li_data = get_spread_update(li_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","active"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavItem", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { active = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("active" in $$new_props) $$invalidate(3, active = $$new_props.active);
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, active, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("active" in $$props) $$invalidate(3, active = $$new_props.active);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, active*/ 12) {
    			$$invalidate(0, classes = classnames(className, "nav-item", active ? "active" : false));
    		}
    	};

    	return [classes, $$restProps, className, active, $$scope, slots];
    }

    class NavItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { class: 2, active: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavItem",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get class() {
    		throw new Error("<NavItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<NavItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<NavItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<NavItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/NavLink.svelte generated by Svelte v3.38.2 */
    const file$3 = "node_modules/sveltestrap/src/NavLink.svelte";

    function create_fragment$3(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	let a_levels = [
    		/*$$restProps*/ ctx[3],
    		{ href: /*href*/ ctx[0] },
    		{ class: /*classes*/ ctx[1] }
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$3, 27, 0, 472);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(a, "click", /*handleClick*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 128)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				dirty & /*$$restProps*/ 8 && /*$$restProps*/ ctx[3],
    				(!current || dirty & /*href*/ 1) && { href: /*href*/ ctx[0] },
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","disabled","active","href"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavLink", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { active = false } = $$props;
    	let { href = "#" } = $$props;

    	function handleClick(e) {
    		if (disabled) {
    			e.preventDefault();
    			e.stopImmediatePropagation();
    			return;
    		}

    		if (href === "#") {
    			e.preventDefault();
    		}
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(4, className = $$new_props.class);
    		if ("disabled" in $$new_props) $$invalidate(5, disabled = $$new_props.disabled);
    		if ("active" in $$new_props) $$invalidate(6, active = $$new_props.active);
    		if ("href" in $$new_props) $$invalidate(0, href = $$new_props.href);
    		if ("$$scope" in $$new_props) $$invalidate(7, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		disabled,
    		active,
    		href,
    		handleClick,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(4, className = $$new_props.className);
    		if ("disabled" in $$props) $$invalidate(5, disabled = $$new_props.disabled);
    		if ("active" in $$props) $$invalidate(6, active = $$new_props.active);
    		if ("href" in $$props) $$invalidate(0, href = $$new_props.href);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, disabled, active*/ 112) {
    			$$invalidate(1, classes = classnames(className, "nav-link", { disabled, active }));
    		}
    	};

    	return [
    		href,
    		classes,
    		handleClick,
    		$$restProps,
    		className,
    		disabled,
    		active,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class NavLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			class: 4,
    			disabled: 5,
    			active: 6,
    			href: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavLink",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get class() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/NavbarBrand.svelte generated by Svelte v3.38.2 */
    const file$2 = "node_modules/sveltestrap/src/NavbarBrand.svelte";

    function create_fragment$2(ctx) {
    	let a;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	let a_levels = [
    		/*$$restProps*/ ctx[2],
    		{ class: /*classes*/ ctx[1] },
    		{ href: /*href*/ ctx[0] }
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$2, 10, 0, 192);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				dirty & /*$$restProps*/ 4 && /*$$restProps*/ ctx[2],
    				(!current || dirty & /*classes*/ 2) && { class: /*classes*/ ctx[1] },
    				(!current || dirty & /*href*/ 1) && { href: /*href*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","href"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavbarBrand", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { href = "/" } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
    		if ("href" in $$new_props) $$invalidate(0, href = $$new_props.href);
    		if ("$$scope" in $$new_props) $$invalidate(4, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({ classnames, className, href, classes });

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
    		if ("href" in $$props) $$invalidate(0, href = $$new_props.href);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className*/ 8) {
    			$$invalidate(1, classes = classnames(className, "navbar-brand"));
    		}
    	};

    	return [href, classes, $$restProps, className, $$scope, slots, click_handler];
    }

    class NavbarBrand extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { class: 3, href: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavbarBrand",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get class() {
    		throw new Error("<NavbarBrand>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<NavbarBrand>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<NavbarBrand>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<NavbarBrand>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Row.svelte generated by Svelte v3.38.2 */
    const file$1 = "node_modules/sveltestrap/src/Row.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
    	let div_levels = [/*$$restProps*/ ctx[1], { class: /*classes*/ ctx[0] }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$1, 38, 0, 951);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 2 && /*$$restProps*/ ctx[1],
    				(!current || dirty & /*classes*/ 1) && { class: /*classes*/ ctx[0] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getCols(cols) {
    	const colsValue = parseInt(cols);

    	if (!isNaN(colsValue)) {
    		if (colsValue > 0) {
    			return [`row-cols-${colsValue}`];
    		}
    	} else if (typeof cols === "object") {
    		return ["xs", "sm", "md", "lg", "xl"].map(colWidth => {
    			const isXs = colWidth === "xs";
    			const colSizeInterfix = isXs ? "-" : `-${colWidth}-`;
    			const value = cols[colWidth];

    			if (typeof value === "number" && value > 0) {
    				return `row-cols${colSizeInterfix}${value}`;
    			}

    			return null;
    		}).filter(value => !!value);
    	}

    	return [];
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let classes;
    	const omit_props_names = ["class","noGutters","form","cols"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Row", slots, ['default']);
    	let { class: className = "" } = $$props;
    	let { noGutters = false } = $$props;
    	let { form = false } = $$props;
    	let { cols = 0 } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("noGutters" in $$new_props) $$invalidate(3, noGutters = $$new_props.noGutters);
    		if ("form" in $$new_props) $$invalidate(4, form = $$new_props.form);
    		if ("cols" in $$new_props) $$invalidate(5, cols = $$new_props.cols);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		className,
    		noGutters,
    		form,
    		cols,
    		getCols,
    		classes
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("noGutters" in $$props) $$invalidate(3, noGutters = $$new_props.noGutters);
    		if ("form" in $$props) $$invalidate(4, form = $$new_props.form);
    		if ("cols" in $$props) $$invalidate(5, cols = $$new_props.cols);
    		if ("classes" in $$props) $$invalidate(0, classes = $$new_props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, noGutters, form, cols*/ 60) {
    			$$invalidate(0, classes = classnames(className, noGutters ? "gx-0" : null, form ? "form-row" : "row", ...getCols(cols)));
    		}
    	};

    	return [classes, $$restProps, className, noGutters, form, cols, $$scope, slots];
    }

    class Row extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { class: 2, noGutters: 3, form: 4, cols: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Row",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get class() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutters() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutters(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get form() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set form(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cols() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    // (35:5) <NavbarBrand href="/">
    function create_default_slot_13(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SvelteDashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(35:5) <NavbarBrand href=\\\"/\\\">",
    		ctx
    	});

    	return block;
    }

    // (40:7) {:else}
    function create_else_block_1(ctx) {
    	let navlink;
    	let current;

    	navlink = new NavLink({
    			props: {
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	navlink.$on("click", /*login*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(navlink.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navlink, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navlink_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				navlink_changes.$$scope = { dirty, ctx };
    			}

    			navlink.$set(navlink_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navlink.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navlink.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navlink, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(40:7) {:else}",
    		ctx
    	});

    	return block;
    }

    // (38:7) {#if $isAuthenticated}
    function create_if_block_1(ctx) {
    	let navlink;
    	let current;

    	navlink = new NavLink({
    			props: {
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	navlink.$on("click", /*logout*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(navlink.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navlink, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navlink_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				navlink_changes.$$scope = { dirty, ctx };
    			}

    			navlink.$set(navlink_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navlink.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navlink.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navlink, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(38:7) {#if $isAuthenticated}",
    		ctx
    	});

    	return block;
    }

    // (41:8) <NavLink on:click={login}>
    function create_default_slot_12(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Log In");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(41:8) <NavLink on:click={login}>",
    		ctx
    	});

    	return block;
    }

    // (39:8) <NavLink on:click={logout}>
    function create_default_slot_11(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Log Out");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(39:8) <NavLink on:click={logout}>",
    		ctx
    	});

    	return block;
    }

    // (37:6) <NavItem>
    function create_default_slot_10(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$isAuthenticated*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(37:6) <NavItem>",
    		ctx
    	});

    	return block;
    }

    // (36:5) <Nav class="ms-auto" navbar>
    function create_default_slot_9(ctx) {
    	let navitem;
    	let current;

    	navitem = new NavItem({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navitem_changes = {};

    			if (dirty & /*$$scope, $isAuthenticated*/ 17) {
    				navitem_changes.$$scope = { dirty, ctx };
    			}

    			navitem.$set(navitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(36:5) <Nav class=\\\"ms-auto\\\" navbar>",
    		ctx
    	});

    	return block;
    }

    // (34:4) <Navbar color="danger" dark expand="md">
    function create_default_slot_8(ctx) {
    	let navbarbrand;
    	let t;
    	let nav;
    	let current;

    	navbarbrand = new NavbarBrand({
    			props: {
    				href: "/",
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	nav = new Nav({
    			props: {
    				class: "ms-auto",
    				navbar: true,
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navbarbrand.$$.fragment);
    			t = space();
    			create_component(nav.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbarbrand, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(nav, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navbarbrand_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				navbarbrand_changes.$$scope = { dirty, ctx };
    			}

    			navbarbrand.$set(navbarbrand_changes);
    			const nav_changes = {};

    			if (dirty & /*$$scope, $isAuthenticated*/ 17) {
    				nav_changes.$$scope = { dirty, ctx };
    			}

    			nav.$set(nav_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbarbrand.$$.fragment, local);
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbarbrand.$$.fragment, local);
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbarbrand, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(nav, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(34:4) <Navbar color=\\\"danger\\\" dark expand=\\\"md\\\">",
    		ctx
    	});

    	return block;
    }

    // (47:5) <Col>
    function create_default_slot_7(ctx) {
    	let br;

    	const block = {
    		c: function create() {
    			br = element("br");
    			add_location(br, file, 47, 6, 1139);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(47:5) <Col>",
    		ctx
    	});

    	return block;
    }

    // (46:4) <Row>
    function create_default_slot_6(ctx) {
    	let col;
    	let current;

    	col = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				col_changes.$$scope = { dirty, ctx };
    			}

    			col.$set(col_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(46:4) <Row>",
    		ctx
    	});

    	return block;
    }

    // (56:7) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "hello world.";
    			add_location(p, file, 56, 8, 1332);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(56:7) {:else}",
    		ctx
    	});

    	return block;
    }

    // (53:7) {#if !$isAuthenticated}
    function create_if_block(ctx) {
    	let alert;
    	let current;

    	alert = new Alert({
    			props: {
    				color: "secondary",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(alert.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(alert, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(alert.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(alert.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(alert, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(53:7) {#if !$isAuthenticated}",
    		ctx
    	});

    	return block;
    }

    // (54:8) <Alert color="secondary">
    function create_default_slot_5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please login to see dashboard.";
    			add_location(p, file, 53, 33, 1254);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(54:8) <Alert color=\\\"secondary\\\">",
    		ctx
    	});

    	return block;
    }

    // (52:6) <Col>
    function create_default_slot_4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*$isAuthenticated*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(52:6) <Col>",
    		ctx
    	});

    	return block;
    }

    // (51:5) <Row>
    function create_default_slot_3(ctx) {
    	let col;
    	let current;

    	col = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col_changes = {};

    			if (dirty & /*$$scope, $isAuthenticated*/ 17) {
    				col_changes.$$scope = { dirty, ctx };
    			}

    			col.$set(col_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(51:5) <Row>",
    		ctx
    	});

    	return block;
    }

    // (33:3) <Col>
    function create_default_slot_2(ctx) {
    	let navbar;
    	let t0;
    	let row0;
    	let t1;
    	let row1;
    	let current;

    	navbar = new Navbar({
    			props: {
    				color: "danger",
    				dark: true,
    				expand: "md",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	row0 = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	row1 = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(row0.$$.fragment);
    			t1 = space();
    			create_component(row1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(row0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(row1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navbar_changes = {};

    			if (dirty & /*$$scope, $isAuthenticated*/ 17) {
    				navbar_changes.$$scope = { dirty, ctx };
    			}

    			navbar.$set(navbar_changes);
    			const row0_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				row0_changes.$$scope = { dirty, ctx };
    			}

    			row0.$set(row0_changes);
    			const row1_changes = {};

    			if (dirty & /*$$scope, $isAuthenticated*/ 17) {
    				row1_changes.$$scope = { dirty, ctx };
    			}

    			row1.$set(row1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(row0.$$.fragment, local);
    			transition_in(row1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(row0.$$.fragment, local);
    			transition_out(row1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(row0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(row1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(33:3) <Col>",
    		ctx
    	});

    	return block;
    }

    // (32:2) <Row>
    function create_default_slot_1(ctx) {
    	let col;
    	let current;

    	col = new Col({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(col.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const col_changes = {};

    			if (dirty & /*$$scope, $isAuthenticated*/ 17) {
    				col_changes.$$scope = { dirty, ctx };
    			}

    			col.$set(col_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(32:2) <Row>",
    		ctx
    	});

    	return block;
    }

    // (31:1) <Container>
    function create_default_slot(ctx) {
    	let row;
    	let current;

    	row = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};

    			if (dirty & /*$$scope, $isAuthenticated*/ 17) {
    				row_changes.$$scope = { dirty, ctx };
    			}

    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(31:1) <Container>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let head;
    	let link;
    	let t;
    	let container;
    	let current;

    	container = new Container({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			head = element("head");
    			link = element("link");
    			t = space();
    			create_component(container.$$.fragment);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css");
    			add_location(link, file, 28, 2, 613);
    			add_location(head, file, 27, 1, 604);
    			add_location(main, file, 26, 0, 596);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, head);
    			append_dev(head, link);
    			append_dev(main, t);
    			mount_component(container, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const container_changes = {};

    			if (dirty & /*$$scope, $isAuthenticated*/ 17) {
    				container_changes.$$scope = { dirty, ctx };
    			}

    			container.$set(container_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(container);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $isAuthenticated;
    	validate_store(isAuthenticated, "isAuthenticated");
    	component_subscribe($$self, isAuthenticated, $$value => $$invalidate(0, $isAuthenticated = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let auth0Client;

    	onMount(async () => {
    		auth0Client = await auth.createClient();
    		isAuthenticated.set(await auth0Client.isAuthenticated());
    		user.set(await auth0Client.getUser());
    	});

    	function login() {
    		auth.login(auth0Client);
    	}

    	function logout() {
    		auth.logout(auth0Client);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		auth,
    		isAuthenticated,
    		user,
    		Col,
    		Container,
    		Row,
    		Nav,
    		Navbar,
    		NavbarBrand,
    		NavItem,
    		NavLink,
    		Alert,
    		auth0Client,
    		login,
    		logout,
    		$isAuthenticated
    	});

    	$$self.$inject_state = $$props => {
    		if ("auth0Client" in $$props) auth0Client = $$props.auth0Client;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$isAuthenticated, login, logout];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
