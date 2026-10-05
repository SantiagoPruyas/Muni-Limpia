// D1: la app vive en una columna de 480px. En lg se corre a la derecha para dejar
// lugar al panel "Prototipo" (280px + 32px de gap) y el par queda centrado.
// Header, main, nav y toasts usan la misma clase para quedar alineados.
export const APP_COLUMN = 'w-full max-w-[480px] mx-auto lg:ml-[calc(50%-84px)]';

// Alto del mapa: viewport menos header y bottom nav (64px cada uno, +1px del borde de la nav) y el
// safe area de la nav, así la atribución de Leaflet queda arriba de la nav. Lo usa también el
// placeholder mientras carga el chunk del mapa.
export const MAP_SCREEN_HEIGHT = 'h-[calc(100dvh-8rem-1px-env(safe-area-inset-bottom,0px))]';
