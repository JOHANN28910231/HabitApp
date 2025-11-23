// Documento de apoyo: traducción al español de los comentarios JSDoc
// Este archivo contiene una versión en español de la documentación
// sobre `Error.captureStackTrace` y `Error.stackTraceLimit`.
// Es puramente documental y está aquí para que el equipo tenga los
// comentarios en español en el repositorio.

/**
 * Crea una propiedad `.stack` en `targetObject` que, al accederse,
 * devuelve una cadena que representa la ubicación en el código donde
 * se llamó a `Error.captureStackTrace()`.
 *
 * ```js
 * const myObject = {};
 * Error.captureStackTrace(myObject);
 * myObject.stack;  // Similar a `new Error().stack`
 * ```
 *
 * La primera línea del rastro estará prefijada por
 * `${myObject.name}: ${myObject.message}`.
 *
 * El argumento opcional `constructorOpt` acepta una función. Si se proporciona,
 * todos los frames por encima de `constructorOpt`, incluido `constructorOpt`,
 * serán omitidos del rastro de pila generado.
 *
 * El argumento `constructorOpt` es útil para ocultar detalles de implementación
 * de la generación del error al usuario. Por ejemplo:
 *
 * ```js
 * function a() {
 *   b();
 * }
 *
 * function b() {
 *   c();
 * }
 *
 * function c() {
 *   // Crear un error sin rastro para evitar calcular la pila dos veces.
 *   const { stackTraceLimit } = Error;
 *   Error.stackTraceLimit = 0;
 *   const error = new Error();
 *   Error.stackTraceLimit = stackTraceLimit;
 *
 *   // Captura el rastro de pila por encima de la función b
 *   Error.captureStackTrace(error, b); // Ni la función c ni b aparecen en el rastro
 *   throw error;
 * }
 *
 * a();
 * ```
 */

/**
 * @see https://v8.dev/docs/stack-trace-api#customizing-stack-traces
 */

/**
 * La propiedad `Error.stackTraceLimit` especifica el número de frames
 * que se recopilan en un rastro de pila (ya sea generado por `new Error().stack`
 * o por `Error.captureStackTrace(obj)`).
 *
 * El valor por defecto es `10`, pero puede establecerse a cualquier número
 * JavaScript válido. Los cambios afectarán cualquier rastro de pila capturado
 * después de que se haya cambiado el valor.
 *
 * Si se asigna un valor no numérico, o un número negativo, los rastros de pila
 * no capturarán ningún frame.
 */

/**
 * Habilita esta API con el flag de la línea de comandos `--expose-gc`.
 */
