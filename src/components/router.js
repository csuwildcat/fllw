
import { Router, Routes } from '@lit-labs/router';

export class AppRouter extends Router {
  constructor(element, props){
    let activeComponent;
    const routes = props.routes;
    super(element, routes.map((enteringRoute, i, routes) => {
      const selector = enteringRoute.component;
      if (typeof selector === 'string') {
        enteringRoute.component = () => element.renderRoot.querySelector(selector);
      }
      enteringRoute.enter = async (path) => {
        activeComponent?.removeAttribute?.('route-state');
        await Promise.all([
          props?.onRouteChange?.(enteringRoute, path)?.onRouteChange?.(enteringRoute, path),
          activeComponent?.onRouteLeave?.(enteringRoute, path),
          enteringRoute?.onEnter?.(path) 
        ])
        activeComponent = await enteringRoute.component?.(enteringRoute, path, true);
        activeComponent?.setAttribute?.('route-state', 'active');
        activeComponent?.onRouteEnter?.(enteringRoute, path);
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
    let activeComponent;
    super(element, routes.map((enteringRoute, i, routes) => {
      const selector = enteringRoute.component;
      if (typeof selector === 'string') {
        enteringRoute.component = () => element.renderRoot.querySelector(selector);
      }
      enteringRoute.enter = async (path) => {
        activeComponent?.removeAttribute?.('route-state');
        await Promise.all([
          options?.onRouteChange?.(enteringRoute, path),
          activeComponent?.onRouteLeave?.(enteringRoute, path),
          element?.onChildRouteChange?.(enteringRoute, path),
          enteringRoute?.onEnter?.(path) 
        ])
        activeComponent = await enteringRoute.component?.(enteringRoute, path, true);
        activeComponent?.setAttribute?.('route-state', 'active');
        activeComponent?.onRouteEnter?.(enteringRoute, path);
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