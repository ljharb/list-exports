/**
 * @typedef {{
 * routes: import('./constructRoutes').ResolvedRoutesConfig;
 * loadApp: LoadApp;
 * }} ApplicationOptions
 *
 * @typedef {(config: import('single-spa').AppProps) => Promise<import('single-spa').Application>} LoadApp
 *
 * @typedef {{
 * app: (config: import('single-spa').AppProps) => Promise<import('single-spa').LifeCycles>
 * }} WithLoadFunction
 *
 * @typedef {{
 * [name]: Array<AppRoute>
 * }} ApplicationMap
 *
 * @typedef {{
 * props: object;
 * activeWhen: import('single-spa').ActivityFn;
 * loader?: string | import('single-spa').ParcelConfig;
 * }} AppRoute
 *
 * @param {ApplicationOptions} applicationOptions
 * @returns {Array<import('single-spa').RegisterApplicationConfig & WithLoadFunction>}
 */
export function constructApplications({ routes, loadApp }: ApplicationOptions): Array<import('single-spa').RegisterApplicationConfig & WithLoadFunction>;
export type ApplicationOptions = {
    routes: import('./constructRoutes').ResolvedRoutesConfig;
    loadApp: LoadApp;
};
export type LoadApp = (config: import('single-spa').AppProps) => Promise<import('single-spa').Application>;
export type WithLoadFunction = {
    app: (config: import('single-spa').AppProps) => Promise<import('single-spa').LifeCycles>;
};
export type ApplicationMap = {};
export type AppRoute = {
    props: object;
    activeWhen: import('single-spa').ActivityFn;
    loader?: string | import('single-spa').ParcelConfig;
};
