# Changelog - OranjeApp

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [0.7.0] - 2026-04-10 (Sesión 7 - OranjeBot: Telegram Integration & AWS Lambda)

### Añadido
- **OranjeBot (Telegram Integration):** Implementación completa de un bot de Telegram para que los hoteles gestionen vacantes en tiempo real.
- **Flujo de Reclutamiento Conversacional:** Guía interactiva de 5 pasos para crear solicitudes (Cargo -> Cantidad -> Tipo -> Fecha -> Horario).
- **Folio Automático:** Generación de números de solicitud SR24-XXX directamente desde el bot.
- **Vinculación por "Link Mágico":** Sistema de URL única (`t.me/?start=ID`) para asociar chats de Telegram con hoteles específicos en AWS.

### Técnico (AWS & Seguridad)
- **Infraestructura Serverless:** Despliegue de AWS Lambda con URL pública protegida por Webhook de Telegram.
- **Seguridad Robusta:** Configuración de autenticación mediante API Key en la Lambda para asegurar estabilidad en la comunicación con AppSync.
- **Modo de Diagnóstico:** Implementación de reportes de errores en tiempo real vía Telegram para facilitar el mantenimiento del bot.
- **Inyección de Secretos:** Configuración segura de `TELEGRAM_BOT_TOKEN` y `AMPLIFY_DATA_GRAPHQL_API_KEY` en AWS Secrets Manager.
- **Comunicación Nativa:** Transición de Amplify Data Models a consultas GraphQL directas para optimizar el rendimiento y confiabilidad en la nube.

### Corregido
- **Error 500 Webhook:** Resolución de fallos de inicialización de Amplify dentro de entornos Lambda.
- **Permisos de Base de Datos:** Corrección de reglas de autorización en `resource.ts` para permitir el acceso controlado del bot a Hoteles y Solicitudes.
- **Estabilidad de Tipos:** Ajustes en `backend.ts` para cumplir con las especificaciones estrictas de AWS CDK en Amplify Gen 2.

---

## [0.6.0] - 2026-04-09 (Sesión 6 - Pulido Professional & Estabilidad S3)

### Añadido
- **Gestión Inteligente S3:** Nuevo componente `S3Image.tsx` que resuelve automáticamente URLs caducadas, eliminando errores 403.
- **Identidad Corporativa:** Implementación de Códigos Operativos (`HOT26-XXX` y `SR26-XXX`) para Hoteles y Solicitudes.
- **Cargos Dinámicos:** Migración de cargos de personal a una tabla de AWS RDS gestionable por el Admin.
- **Seguridad Blacklist:** Sistema de restricción con motivo obligatorio y alertas visuales en rojo en las tarjetas de empleado.
- **Métricas Kanban:** Barra de progreso real en tarjetas de solicitud basada en candidatos asignados y contador `👥 X/Y`.
- **Campos de Contacto:** Inclusión de Gerente, Teléfono y Email en Hoteles y Personal.
- **Reglas de Negocio Senior:** Implementación de **Exclusividad de Plaza Fija** (un empleado permanente en un hotel no puede ser asignado como permanente en otro, solo como refuerzo/cover).

### Cambiado
- **Rediseño Premium:** Reestructuración de la Página de Detalles de Hotel con banner hero, barra de contacto flotante y mapa reactivo sincronizado.
- **UX de Solicitudes:** Formulario de solicitudes organizado por secciones (Ubicación, Perfil, Logística) con soporte para Prioridad y Horarios.
- **Filtros Avanzados:** Nueva barra de filtros en Personal con detección de documentos pendientes y limpieza rápida.
- **Formateo Inteligente:** Implementación global de `toTitleCase` para asegurar que nombres y ciudades se guarden siempre con formato profesional (`Juan Perez`).

### Corregido
- **Sincronización de Datos:** Refuerzo de `staffingService.ts` para incluir todos los campos operativos en la actualización hacia AWS RDS.
- **Precisión GPS:** Corrección del re-centrado del mapa y el pin en los detalles del hotel mediante llaves dinámicas.
- **Estabilidad de Inputs:** Eliminación de advertencias de componentes controlados/no controlados en formularios de Material UI.

---

## [0.5.0] - 2026-04-09 (Sesión 5 - Migración 100% AWS Native & Despliegue RDS)

### Añadido
- **Esquema RDS Completo:** Implementación de modelos avanzados en AWS Amplify Gen 2: `AttendanceRecord`, `QAAudit`, `Candidate`, `Application`, `EmployeeStatusChange` y `Profile`.
- **Gestión de Accesos en RDS:** Nueva página de Usuarios (`UsersPage.tsx`) que sincroniza roles (ADMIN, RECRUITER, INSPECTOR) directamente con la base de datos de Virginia.
- **Historial de Estados:** Implementación de la tabla `EmployeeStatusChange` para rastrear activaciones/desactivaciones de personal con motivos.
- **Módulo de Calidad AWS:** Migración total de `QAPage.tsx` y cálculos de score de excelencia operativa a AWS RDS.

### Técnico
- **Eliminación de Supabase:** Borrado físico de `src/utils/supabase.ts` y desinstalación de la dependencia `@supabase/supabase-js`. El proyecto es ahora 100% Native AWS.
- **Sincronización Cloud:** Resolución del error de nombres alfanuméricos en CloudFormation (`QA_Audit` -> `QAAudit`) y despliegue exitoso mediante `ampx sandbox`.

---

## [0.4.0] - 2026-04-03 (Sesión 4 - Consolidación AWS Cloud & Estabilidad Total)
...
