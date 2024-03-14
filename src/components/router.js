
import { Router, Routes } from '@lit-labs/router';

export class AppRouter extends Router {
  constructor(element, props){
    const routes = props.routes;
    super(element, routes.map((enteringRoute, i, routes) => {
      const selector = enteringRoute.component;
      if (typeof selector === 'string') {
        enteringRoute.component = () => element.renderRoot.querySelector(selector);
      }
      enteringRoute.enter = async (path) => {
        await Promise.all(
          routes.reduce((promises, route) => {
            const leavingComponent = route.component?.();
            if (route !== enteringRoute && leavingComponent?.getAttribute('state') === 'active') {
              promises.push(leavingComponent?.onPageLeave?.(enteringRoute, path))
            }
            leavingComponent?.removeAttribute('state');
            return promises;
          }, [props?.onRouteChange?.(enteringRoute, path)]).concat([
            enteringRoute?.onEnter?.(path),
            enteringRoute.component?.()?.onPageEnter?.(enteringRoute, path)
          ])
        )
        enteringRoute.component?.()?.setAttribute?.('state', 'active');
        enteringRoute?.render?.call(this, path);
      }
      return enteringRoute;
    }))
  }
  navigateTo = (route, state = {}) => {
    history.pushState(state, state.title || '', route)
    this.goto(route);
  };
}

export class AppRoutes extends Routes {
  constructor(element, routes, options){
    super(element, routes.map((enteringRoute, i, routes) => {
      const selector = enteringRoute.component;
      if (typeof selector === 'string') {
        enteringRoute.component = () => element.renderRoot.querySelector(selector);
      }
      enteringRoute.enter = async (path) => {
        await Promise.all(
          routes.reduce((promises, route) => {
            const leavingComponent = route.component?.();
            if (route !== enteringRoute && leavingComponent?.getAttribute('state') === 'active') {
              promises.push(leavingComponent?.onPageLeave?.(enteringRoute, path))
            }
            leavingComponent?.removeAttribute('state');
            return promises;
          }, [options?.onRouteChange?.(enteringRoute, path)]).concat([
            element?.onChildRouteChange?.(enteringRoute, path),
            enteringRoute?.onEnter?.(path),
            enteringRoute.component?.()?.onPageEnter?.(enteringRoute, path)
          ])
        )
        enteringRoute.component?.()?.setAttribute?.('state', 'active');
        enteringRoute?.render?.call(this, path);
      }
      return enteringRoute;
    }), options)
  }
  navigateTo = (route, state = {}) => {
    history.pushState(state, state.title || '', route)
    this.goto(route);
  };
}