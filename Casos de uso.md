<img width="1415" height="461" alt="CU01 Registro de Huésped" src="https://github.com/user-attachments/assets/5326e17c-dfb9-4bed-bd30-2a3d47bd24d8" />
CU01 Registro de Huésped


Este proceso describe cómo un Huésped se registra en el sistema usando su correo electrónico.
El Huésped comienza seleccionando la Opción registrarse por correo. El sistema automáticamente muestra el formulario de registro para que el Huésped ingrese sus datos.
Una vez ingresados los datos, el sistema debe obligatoriamente verificar que el correo no esté repetido.

Flujo de Éxito:
Si la verificación es exitosa (el correo es nuevo), se procede a Confirmar datos personales.
Esta confirmación final siempre resulta en Guardar datos personales en BD y mostrar un Mensaje de registro exitoso.

Flujo Alternativo Error:
Si durante la verificación se detecta que el correo ya está en uso, el flujo se interrumpe y se extiende para mostrar un Mensaje de Correo en uso, terminando el intento de registro.

<img width="1383" height="477" alt="CU02 Registro de Anfitrión" src="https://github.com/user-attachments/assets/5f02adbc-4879-4f51-8355-2f74747c3e8f" />

CU02 Registro de Anfitrión

Este proceso describe cómo un Anfitrión se registra en el sistema utilizando su correo electrónico. El flujo es iniciado por el Anfitrión y gestionado por el sistema.

El Anfitrión comienza seleccionando la Opción registrarse por correo. El sistema automáticamente muestra el formulario de registro para que el Anfitrión ingrese sus datos. Una vez que el Anfitrión ha completado el formulario, el sistema debe obligatoriamente verificar que el correo no esté repetido.

Flujo de Éxito:
Si la verificación es exitosa (el correo es nuevo y único), el proceso avanza a Confirmar datos personales. Esta confirmación final siempre resulta en Guardar datos personales en BD y, posteriormente, mostrar un Mensaje de registro exitoso al Anfitrión.

Flujo Alternativo Error:
Si durante la verificación se detecta que el correo ya está en uso, el flujo de registro principal se interrumpe, y el sistema se extiende para mostrar un Mensaje de Correo en uso, terminando el intento de registro sin guardar datos.

<img width="1351" height="442" alt="CU03 Registro de Habitación" src="https://github.com/user-attachments/assets/d0b2f6b1-df1e-45aa-9c47-6f974c23befd" />

CU03 Registro de habitación 

Este proceso describe cómo un Anfitrión, una vez autenticado, gestiona la información de una habitación, ya sea registrándola, editándola o eliminándola.

El Anfitrión inicia el proceso con Iniciar sesión. El sistema requiere que el Anfitrión esté autentificado para poder acceder a la funcionalidad de Registro habitación.

Flujo Principal (Registro Inicial):
Una vez dentro de la funcionalidad de Registro habitación, el Anfitrión ingresa los datos de la nueva habitación. Esta acción obligatoriamente resulta en Guardar en BD (Base de Datos).

Flujo Alternativo (Extensión - Edición):
Si el Anfitrión decide modificar una habitación existente, desde el punto de Registro habitación puede acceder a Editar datos de habitación. Esta acción de edición siempre resulta en Guardar en BD para actualizar la información.

Flujo Alternativo (Extensión - Eliminación):
Si el Anfitrión decide eliminar una habitación, desde el punto de Registro habitación puede acceder a Eliminar datos de habitación. Esta acción de eliminación siempre resulta en Guardar en BD para aplicar el cambio (de la eliminación del registro).

<img width="1066" height="432" alt="CU04 Búsqueda y visualización" src="https://github.com/user-attachments/assets/21f84b11-05b4-4a00-8812-183f5f674ee4" />

CU04 Búsqueda y visualización

Este proceso describe cómo un Huésped busca habitaciones disponibles y visualiza su calendario de disponibilidad en el sistema.

El Huésped inicia el proceso con Iniciar sesión. El sistema requiere que el Huésped esté autenticado para poder acceder a la funcionalidad de búsqueda.
Una vez que el Huésped aplica los filtros de búsqueda (ubicación, precio, fechas, servicios, etc.), el sistema debe mostrar obligatoriamente un Calendario con disponibilidad de cada habitación que cumpla con los criterios definidos. El Huésped puede, entonces, visualizar rápidamente qué habitaciones están libres en las fechas seleccionadas.

<img width="1556" height="335" alt="CU05 Rerserva de Habitación" src="https://github.com/user-attachments/assets/f1d34642-21a9-4f5d-b6ed-bd6582a8d84f" />

CU05 Reserva de habitación

Este proceso describe cómo un Huésped realiza la reserva de una habitación, desde el inicio de sesión hasta el pago.

El Huésped inicia el proceso con Iniciar sesión. El sistema requiere que el Huésped esté autentificado para poder proceder con la reserva. El Huésped debe obligatoriamente Seleccionar habitación de las opciones disponibles. Tras la selección, el sistema obliga al Huésped a Ingresar datos de fecha y personas para validar la reserva. Posteriormente, el Huésped debe Confirmar reservación para finalizar el proceso de selección de detalles. Finalmente, la confirmación resulta obligatoriamente en la acción de Pagar reservación, que concluye el caso de uso.

<img width="1609" height="451" alt="CU06 Modificar habitación  " src="https://github.com/user-attachments/assets/6a4299d4-9bd8-450e-81fa-54669a5e4f19" />

CU06 Modificar Habitación

Este proceso describe cómo un Anfitrión gestiona la información de sus habitaciones, permitiendo su modificación o eliminación.

El Anfitrión inicia el proceso con Iniciar sesión. El sistema requiere la autentificación para permitir el acceso a la gestión de habitaciones. Una vez autentificado, el Anfitrión debe obligatoriamente Seleccionar habitación de su lista para realizar alguna acción.

lujo de Éxito (Modificación):
Tras Seleccionar habitación, el flujo principal continúa obligatoriamente con Editar habitación. Una vez realizados los cambios, el Anfitrión debe Confirmar cambios. Finalmente, la confirmación resulta obligatoriamente en la acción de Guardar en BD, donde los datos actualizados de la habitación son registrados.

Flujo Alternativo (Eliminación):
Desde el punto de Seleccionar habitación, el Anfitrión tiene la opción de Eliminar habitación. Si el Anfitrión elige esta opción, la eliminación obliga al sistema a Eliminar de BD, removiendo el registro de la habitación del sistema.

<img width="1397" height="463" alt="CU07 Proceso de pago" src="https://github.com/user-attachments/assets/f535d712-23da-4946-91d3-a10a7984cbf5" />

CU07 Proceso de pago

Este proceso describe cómo un Huésped completa la transacción financiera para una reserva
El Huésped inicia el proceso al ver el Mensaje de monto total a pagar por su reserva. Posteriormente, el Huésped debe obligatoriamente seleccionar el Método de pago (ingresar datos de tarjeta, PayPal, etc.). Una vez completado el método de pago, el sistema procede a Pago finalizado.

El Pago finalizado desencadena obligatoriamente dos acciones paralelas y exitosas:
Guardar en BD: Se registra la transacción y el estado de la reserva como pagada.

Mensaje de confirmación de pago: Se notifica al Huésped que la transacción ha sido exitosa.

<img width="1355" height="517" alt="CU08 Cancelación de reservación" src="https://github.com/user-attachments/assets/ceeb1739-2ef2-4107-955b-a7cbd022f761" />

CU08 Cancelación de reservación

Este proceso describe cómo un Huésped puede intentar cancelar una reserva existente y las condiciones bajo las cuales la cancelación es posible o no.

El Huésped inicia el proceso con Seleccionar reservación de su lista de reservas. Una vez seleccionada, el sistema debe obligatoriamente Verificar plazo de cancelación para determinar si la reserva aún cumple con los términos para ser cancelada (si no ha pasado una fecha límite).

Flujo de Éxito (Cancelación Procedente):
Si la verificación del plazo es exitosa (la cancelación es permitida), el sistema procede a Cancelar Reservación. La acción de cancelar obligatoriamente desencadena dos pasos:

Mensaje Rembolso del 50% del monto total: Se informa al Huésped sobre la cantidad que será devuelta.

Ambas acciones (el mensaje de reembolso y la cancelación) obligatoriamente resultan en Guardar en BD, donde se actualiza el estado de la reserva a "cancelada" y se registra el proceso de reembolso.

Flujo Alternativo (Cancelación No Procedente):
Si durante la verificación del plazo se detecta que la reserva no cumple con los términos de cancelación, el flujo de cancelación se interrumpe, y el sistema muestra un Mensaje: No se puede cancelar su reservación. Este mensaje, aunque no conlleva una cancelación, también resulta en Guardar en BD para registrar el intento fallido de cancelación por parte del Huésped.


<img width="1237" height="474" alt="CU09 Gestión de usuarios " src="https://github.com/user-attachments/assets/58a1bfa0-f9e0-4e66-9498-5d58a0e85842" />

CU09 Gestión de usuarios


Este proceso describe cómo el Administrador interactúa con el sistema para gestionar consultar, modificar, eliminar o cambiar el estado de las cuentas de los usuarios.

El Administrador inicia el proceso al acceder a la funcionalidad de Consultar usuarios. Esta es la acción principal que permite el acceso a todas las demás gestiones.

El flujo principal es la simple Consulta de usuarios, que permite al Administrador visualizar la lista o el detalle de las cuentas.

Flujo Alternativo (Modificación):
Desde la consulta, el Administrador tiene la opción de Modificar datos de usuario. Esta acción de modificación siempre resulta obligatoriamente en Guardar en BD para registrar los cambios.

Flujo Alternativo (Eliminación):
Desde la consulta, el Administrador tiene la opción de Eliminar usuario. Esta acción de eliminación siempre resulta obligatoriamente en Guardar en BD, lo que implica la eliminación o inhabilitación permanente de la cuenta.

Flujo Alternativo (Cambio de Estado):
Desde la consulta, el Administrador tiene la opción de Cambiar estado de usuario. Esta acción siempre resulta obligatoriamente en Guardar en BD para actualizar el estado funcional de la cuenta.

