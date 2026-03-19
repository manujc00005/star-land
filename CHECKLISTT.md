□ Abrir /projects/[id] con un proyecto que tenga parcelas asignadas
□ Expandir una fila de parcela con contrato activo
    □ Verificar que aparece el selector de estado (Borrador/Activo/Expirado)
    □ Cambiar el estado y pulsar Guardar → debe refrescarse la tabla con el nuevo estado
    □ El botón Guardar debe estar deshabilitado si el estado no cambia
□ Expandir una fila de parcela SIN contrato y con propietarios en la org
    □ Verificar que aparece el dropdown de propietarios con nombre + NIF
    □ Verificar que aparece el selector de tipo (Arrendamiento/Compraventa)
    □ Pulsar "Crear contrato borrador" → debe crear el contrato y refrescar
    □ Tras el refresco, la fila debe mostrar el estado "Borrador" en la tabla
□ Expandir una fila de parcela SIN contrato y SIN propietarios en la org
    □ Verificar que aparece el mensaje "No hay propietarios registrados"
    □ Verificar que aparece el enlace "Crear propietario →"
□ Verificar que las notas de contratación siguen funcionando (sin regresión)
□ Verificar que añadir/eliminar personas relacionadas sigue funcionando (sin regresión)
□ Verificar que la tabla de contratos en la tab Terrenos muestra datos correctos
□ Abrir /projects/[id]/edit → confirmar que NO aparece ningún textarea de GeoJSON

□ Abrir el panel de una parcela SIN contrato con al menos un propietario en la org
□ Seleccionar propietario + tipo y pulsar "Crear contrato borrador" → debe crearse
□ Colapsar y expandir la fila → ahora debe mostrar Caso A (contrato existente)
□ Ir a /contracts/[id]/edit y marcar el contrato como EXPIRED
□ Volver al panel de la misma parcela: debe mostrar Caso B (sin contrato activo)
□ Crear un nuevo contrato borrador → debe permitirlo (EXPIRED no bloquea)
□ Pulsar "Crear contrato borrador" dos veces rápido antes de que revalide:
  el segundo intento debe devolver el error "Ya existe un contrato en borrador..."
□ Verificar que el mensaje de error aparece en el panel bajo el botón
□ Verificar que ningún contrato duplicado se creó en /contracts