# Changelog - OranjeApp

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [0.9.1] - 2026-04-14 (Sesión 11 - PWA Brand Refresh: De DA a OranjeApp)

### Cambiado
- **Identidad Visual PWA:** Actualización de los iconos de la aplicación de "DA" a **"OJ"** para reflejar la marca **OranjeApp**.
- **Paleta de Colores Corporativa:** Implementación del color **Orange Energy (#FF5722)** sobre fondo **Deep Slate (#0F172A)** en los iconos y el color de tema (theme_color) del manifiesto.
- **Metadatos de Aplicación:** Cambio del nombre oficial de la PWA de "Gestion DA PWA" a **"OranjeApp"** en la configuración de Vite.

## [0.9.0] - 2026-04-13 (Sesión 10 - Oranje Premium Experience: Renovación Visual & UX)

### Añadido
- **Identidad de Marca Unificada:** Implementación del logotipo "Oranje" estilizado en el sidebar con tipografía pesada y degradados de marca.
- **Sidebar Inteligente (Modo Compacto):** Nuevo sistema de navegación que se contrae automáticamente para maximizar el espacio de trabajo y se expande suavemente al pasar el mouse (Efecto Hover Premium).
- **Dashboard de Reclutamiento 2.0:** Sincronización total con AWS RDS. Nuevo Donut Chart de cumplimiento 72h, Ranking de Zonas con barras de carga y Tabla de Solicitudes Críticas rediseñada con barras de progreso.
- **Normalización de Datos Maestro:** Implementación automática de `toTitleCase` en los servicios de Hoteles y Empleados. Toda la información guardada en AWS ahora mantiene un formato profesional ("Juan Perez" en lugar de "JUAN PEREZ").
- **Estados Vacíos Motivadores:** Inclusión de "Empty States" elegantes en el dashboard para mejorar la experiencia de usuario cuando no hay tareas pendientes.

### Cambiado
- **Rediseño de Tarjetas Premium (Hoteles, Personal, Aplicaciones):** Unificación del lenguaje visual con tipografía Black (900), color Gris Platino nítido y eliminación de sombras borrosas para una definición perfecta de los textos.
- **Acciones Minimalistas:** Sustitución de barras de botones grises por iconos de gestión integrados que aparecen al interactuar con las tarjetas.
- **Saludo Institucional:** Rediseño de la AppBar con saludo centrado y cambio de marca a "SISTEMA DE GESTIÓN ORANJE".
- **Mapa Inteligente:** El mapa del Dashboard ahora se centra automáticamente en los activos de la zona del inspector, eliminando coordenadas genéricas de Miami.

### Corregido
- **Cálculo de Score QA:** Ajuste matemático para que el promedio de calidad en el dashboard refleje exclusivamente las auditorías de la zona seleccionada.
- **Error MUI Out-of-Range:** Corrección definitiva de avisos en consola mediante la integración de estados de aplicación (Validado/Contratado) en los selectores de solicitudes.
- **Integridad Técnica:** Limpieza de importaciones duplicadas y errores de sintaxis en `ApplicationsPage.tsx`.

## [0.8.0] - 2026-04-13 (Sesión 9 - Seguridad Blindada: Restricción de Zona y Limpieza de Roles)

### Añadido
- **Seguridad de Zona Estricta (INSPECTOR):** Implementación de filtrado infranqueable para el rol de Inspector. Ahora solo visualizan datos (Dashboard, Hoteles, Personal, Solicitudes, Aplicaciones, QA y Asistencia) de la zona asignada en el panel de usuarios.
- **Carga de Perfil Granular:** Actualización de `AuthContext.tsx` para mapear `assigned_zone` y todos los permisos específicos (can_edit_*, can_view_*, can_manage_users, etc.) desde AWS RDS.
- **Soporte de Roles Senior:** Integración completa del rol `COORDINATOR` en la interfaz de tipos y lógica de permisos del sistema.
- **Denegación de Acceso Preventiva:** Si un Inspector no tiene zona asignada, el sistema bloquea preventivamente la visualización de datos globales para evitar filtraciones.

### Cambiado
- **Normalización de Roles:** Eliminación del rol `BUSINESS_DEVELOPER` (no utilizado) para simplificar la gestión de usuarios y mantener el enfoque en la operación real (ADMIN, COORDINATOR, RECRUITER e INSPECTOR).
- **Dashboard de Inspección:** El panel principal ahora refleja automáticamente la zona asignada del usuario sin necesidad de filtros manuales previos.

### Corregido
- **Falla de Carga de Perfil:** Resolución del "punto ciego" donde el sistema ignoraba la zona guardada en la base de datos al iniciar sesión.
- **Vulnerabilidad de Datos Globales:** Corrección en los módulos de Asistencia y Aplicaciones que permitían ver toda la cadena si la zona del usuario era indefinida.

## [0.7.1] - 2026-04-11 (Sesión 8 - Sincronización de Cargos y Normalización)

### Añadido
- **Sincronización Dinámica de Cargos:** El módulo de Aplicaciones ahora consume cargos reales configurados en el sistema mediante `usePositions`, eliminando la dependencia de listas estáticas.
- **Normalización de Roles (TitleCase):** Implementación de `toTitleCase` en el flujo de alta de empleados para corregir discrepancias de formato (ej: "housekeeper" -> "Housekeeper").

### Corregido
- **Error MUI Out-of-Range:** Solucionado el error visual en el componente `Select` de `EmployeeForm` causado por valores en minúsculas provenientes de aplicaciones externas.
- **Consistencia en Formularios:** Actualización de `ApplicationForm` y `EmployeeForm` en el módulo de aplicaciones para usar la lista maestra de posiciones.

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
