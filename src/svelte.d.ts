/// <reference types="svelte" />
declare module '*.svelte' {
  import { ComponentType } from 'svelte';
  const component: ComponentType<any>;
  export default component;
}
