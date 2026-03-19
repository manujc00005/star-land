TODO — Múltiples contratos por parcela:
  El panel solo muestra y gestiona el contrato de mayor prioridad
  (ACTIVE > DRAFT > EXPIRED). Si una parcela tiene más de un contrato,
  los restantes son invisibles en el panel.
  Ver: project-tabs.tsx, lógica bestContractByParcel (líneas 84-102 de projects/[id]/page.tsx)

TODO — contractingStatus independiente (VF1):
  El estado de contratación en el panel está mapeado directamente a Contract.status.
  Si el negocio requiere un estado operativo separado del estado jurídico del contrato
  (p.ej. "Interesado", "Negociando", "Bloqueado"), habría que añadir
  ProjectParcel.contractingStatus como campo propio y migrar el schema.

TODO — Cambio de propietario de contrato existente desde el panel:
  En el Caso A (parcela con contrato), el propietario es de solo lectura.
  Para cambiarlo hay que ir a /contracts/[id]/edit.
  Pendiente: updateLinkedContractOwnerAction + selector en el panel.

  	Pregunta	Impacto si no se responde
D1	¿Apruebas el conjunto de valores del enum? PENDING / CONTACTED / NEGOTIATING / AGREED / CONTRACTED / REJECTED	No puedo generar la migración correcta
D2	¿Al crear un contrato ACTIVE desde el panel, el negotiationStatus se actualiza automáticamente a CONTRACTED?	Afecta a la lógica de createPanelContractAction y a la coherencia del sistema
D3	¿El badge "Estado Contratación" en la tabla de parcelas pasa a mostrar negotiationStatus (reemplaza) o muestra ambos?	Afecta a ContractingStatusBadge y a la columna de la tabla
D4	¿El panel muestra todos los contratos de la parcela o solo los no-EXPIRED?	Afecta a la query y a la UI del panel

📌 Dos deudas técnicas a registrar antes de cerrar
/owners/[id] no existe — todos los enlaces al propietario desde contratos, parcelas y el panel hacen 404. Afecta UX en múltiples sitios.
updateContractAction (edición completa de contrato) no dispara la regla D2. Si se edita un contrato de DRAFT a ACTIVE desde /contracts/[id]/edit, el badge de negociación no se actualiza. El usuario no ve feedback de error porque no hay error — simplemente el sistema no está al tanto del projectId.