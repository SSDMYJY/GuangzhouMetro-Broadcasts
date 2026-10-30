import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

import * as Vue from "vue";

const require = createRequire(import.meta.url);
const resolveFromVue = (packageName) =>
    require.resolve(packageName, {
        paths: [require.resolve("vue/package.json")],
    });

const { compile } = require(resolveFromVue("@vue/compiler-dom"));
const { parse } = require(resolveFromVue("@vue/compiler-sfc"));
const { renderToString } = require(resolveFromVue("@vue/server-renderer"));

const source = fs.readFileSync(
    new URL("../src/pages/station-list.vue", import.meta.url),
    "utf8"
);
const { descriptor } = parse(source);
const { code } = compile(descriptor.template.content, {
    mode: "function",
    prefixIdentifiers: true,
});
const render = new Function("Vue", code)(Vue);

const passthrough = (tag) => ({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
        return () => Vue.h(tag, attrs, slots.default?.());
    },
});

const renderPage = async (stationRes) => {
    const app = Vue.createSSRApp({
        render,
        setup() {
            return {
                stationRes,
                formatZhTitle: (title) =>
                    title.endsWith("站") ? title : `${title} 站`,
                formatEnSubtitle: (subtitle) =>
                    subtitle.endsWith("Railway Station")
                        ? subtitle
                        : `${subtitle} Station`,
                playSound() {},
                stopPlay() {},
            };
        },
    });

    app.component("scroll-view", passthrough("div"));
    app.component("uni-group", passthrough("section"));

    return renderToString(app);
};

test("renders the current-direction stations in a horizontal line map with only the first station active", async () => {
    const html = await renderPage([
        { title: "机场北", subtitle: "Airport North", src: "north.mp3" },
        { title: "白云机场南", subtitle: "Airport South", src: "south.mp3" },
    ]);

    assert.match(html, /class="line-map"/);
    assert.match(html, /\sscroll-x(?:=""|(?=\s|>))/);
    assert.match(html, /机场北/);
    assert.match(html, /Airport North/);
    assert.match(html, /白云机场南/);
    assert.match(html, /Airport South/);
    assert.equal((html.match(/line-map__station--active/g) ?? []).length, 1);
    assert.equal((html.match(/line-map__connector/g) ?? []).length, 1);
    assert.ok(html.indexOf("机场北") < html.indexOf("白云机场南"));
});

test("does not render an empty line-map container before station data loads", async () => {
    const html = await renderPage([]);

    assert.doesNotMatch(html, /class="line-map"/);
});
