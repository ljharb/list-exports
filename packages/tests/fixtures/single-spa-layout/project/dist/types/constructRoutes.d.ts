/**
 * @typedef {InputRoutesConfigObject | Element | import('parse5').DefaultTreeDocument} RoutesConfig
 *
 * @typedef {{
 * mode?: string;
 * base?: string;
 * containerEl?: ContainerEl;
 * disableWarnings?: boolean;
 * routes: Array<Route>;
 * }} InputRoutesConfigObject
 *
 * @typedef {{
 * mode: string;
 * base: string;
 * containerEl: ContainerEl;
 * routes: Array<ResolvedRouteChild>;
 * }} ResolvedRoutesConfig
 *
 * @typedef {UrlRoute | Application | Node} RouteChild
 *
 * @typedef {ResolvedUrlRoute | Application | Node} ResolvedRouteChild
 *
 * @typedef {string | Element | import('parse5').Element} ContainerEl
 *
 * @typedef {{
 * type: string;
 * path: string;
 * routes: Array<Route>;
 * default?: boolean;
 * activeWhen: import('single-spa').ActivityFn;
 * }} ResolvedUrlRoute
 *
 * @typedef {{
 * type: string;
 * path: string;
 * routes: Array<Route>;
 * default?: boolean;
 * }} UrlRoute
 *
 * @typedef {{
 * type: string;
 * name: string;
 * props?: object;
 * loader?: string | import('single-spa').ParcelConfig;
 * }} Application
 *
 * @typedef {{
 * loaders: {
 *   [key: string]: any;
 * };
 * props: {
 *   [key: string]: any;
 * }
 * }} HTMLLayoutData
 *
 * @param {RoutesConfig} routesConfig
 * @param {HTMLLayoutData=} htmlLayoutData
 * @returns {ResolvedRoutesConfig}
 */
export function constructRoutes(routesConfig: RoutesConfig, htmlLayoutData?: HTMLLayoutData | undefined): ResolvedRoutesConfig;
export type RoutesConfig = Element | import("parse5").DefaultTreeDocument | {
    mode?: string;
    base?: string;
    containerEl?: ContainerEl;
    disableWarnings?: boolean;
    routes: Array<any>;
};
export type InputRoutesConfigObject = {
    mode?: string;
    base?: string;
    containerEl?: ContainerEl;
    disableWarnings?: boolean;
    routes: Array<any>;
};
export type ResolvedRoutesConfig = {
    mode: string;
    base: string;
    containerEl: ContainerEl;
    routes: Array<ResolvedRouteChild>;
};
export type RouteChild = Node | {
    type: string;
    name: string;
    props?: object;
    loader?: string | import('single-spa').ParcelConfig;
} | {
    type: string;
    path: string;
    routes: Array<any>;
    default?: boolean;
};
export type ResolvedRouteChild = Node | {
    type: string;
    path: string;
    routes: Array<any>;
    default?: boolean;
    activeWhen: import('single-spa').ActivityFn;
} | {
    type: string;
    name: string;
    props?: object;
    loader?: string | import('single-spa').ParcelConfig;
};
export type ContainerEl = string | object | Element | import("parse5").DefaultTreeElement;
export type ResolvedUrlRoute = {
    type: string;
    path: string;
    routes: Array<any>;
    default?: boolean;
    activeWhen: import('single-spa').ActivityFn;
};
export type UrlRoute = {
    type: string;
    path: string;
    routes: Array<any>;
    default?: boolean;
};
export type Application = {
    type: string;
    name: string;
    props?: object;
    loader?: string | import('single-spa').ParcelConfig;
};
export type HTMLLayoutData = {
    loaders: {
        [key: string]: any;
    };
    props: {
        [key: string]: any;
    };
};
