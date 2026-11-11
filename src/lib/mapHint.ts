// La píldora de ayuda del mapa se oculta tras la primera interacción, también al volver a la pestaña.
// Vive fuera de MapScreen para que App la reinicie sin cargar el chunk del mapa.
let dismissed = false;

export const isMapHintDismissed = () => dismissed;

export const dismissMapHint = () => {
  dismissed = true;
};

/** "Restablecer demo": la ayuda vuelve a aparecer como en el primer arranque. */
export const resetMapHint = () => {
  dismissed = false;
};
