import { createPinia } from 'pinia';

const pinia = createPinia();

export function setupStore(app) {
  app.use(pinia);
  import.meta.env.DEV &&
    console.log(
      '%c[pinia] Initialization %c',
      'background:#ffd859; color:#000000; padding: 1PX 4PX; border-radius: 3PX;',
      '',
    );
}

export { pinia };
