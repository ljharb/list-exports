/**
 * @typedef {{
 * activate() => void;
 * deactivate() => void;
 * isActive() => boolean;
 * }} LayoutEngine
 *
 * @typedef {{
 * routes: import('./constructRoutes').ResolvedRoutesConfig;
 * applications: Array<import('single-spa').RegisterApplicationConfig & import('./constructApplications').WithLoadFunction>;
 * active?: boolean;
 * }} LayoutEngineOptions
 *
 * @param {LayoutEngineOptions} layoutEngineOptions
 * @returns {LayoutEngine}
 */
export function constructLayoutEngine({ routes: resolvedRoutes, applications, active, }: LayoutEngineOptions): LayoutEngine;
export function applicationElementId(name: any): string;
export type LayoutEngine = {
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
};
export type LayoutEngineOptions = {
    routes: import('./constructRoutes').ResolvedRoutesConfig;
    applications: Array<import('single-spa').RegisterApplicationConfig & import('./constructApplications').WithLoadFunction>;
    active?: boolean;
};
/**
 * We do all of this in a single recursive pass for performance, even though
 * it makes the code a bit messier
 */
export type DomChangeInput = {
    location: URL;
    routes: Array<import('./constructRoutes').RouteChild>;
    parentContainer: HTMLElement;
    previousSibling?: HTMLElement;
    shouldMount: boolean;
    pendingRemovals: Array<Function>;
};
