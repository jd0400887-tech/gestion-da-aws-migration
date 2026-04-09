# Changelog - OranjeApp

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [0.5.0] - 2026-04-08 (Sesión 5 - Migración 100% AWS Native & Despliegue RDS)

### Añadido
- **Esquema RDS Completo:** Implementación de modelos avanzados en AWS Amplify Gen 2: `AttendanceRecord`, `QAAudit`, `Candidate`, `Application`, `EmployeeStatusChange` y `Profile`.
- **Gestión de Accesos en RDS:** Nueva página de Usuarios (`UsersPage.tsx`) que sincroniza roles (ADMIN, RECRUITER, INSPECTOR) directamente con la base de datos de Virginia.
- **Historial de Estados:** Implementación de la tabla `EmployeeStatusChange` para rastrear activaciones/desactivaciones de personal con motivos.
- **Módulo de Calidad AWS:** Migración total de `QAPage.tsx` y cálculos de score de excelencia operativa a AWS RDS.

### Cambiado
- **Servicios 100% AWS:** Actualización masiva de `hotelService`, `employeeService` y `staffingService` para usar exclusivamente el cliente de Amplify con mapeo `snake_case` (RDS) a `camelCase` (App).
- **Hooks de Negocio:** Refactorización total de `useAttendance`, `useApplications`, `usePayrollHistory`, `useAdoptionStats` y `useReportData` para eliminar cualquier rastro de Supabase.
- **Optimización de Interfaz:** Reestructuración visual en `MainLayout` y `index.css` para eliminar el fondo negro total y mejorar la visibilidad del menú lateral en escritorio.
- **Flujo de Autenticación:** Simplificación de `App.tsx` y `ProtectedRoute.tsx` para garantizar el renderizado inmediato tras el login de AWS Cognito.

### Técnico
- **Eliminación de Supabase:** Borrado físico de `src/utils/supabase.ts` y desinstalación de la dependencia `@supabase/supabase-js`. El proyecto es ahora 100% Native AWS.
- **Sincronización Cloud:** Resolución del error de nombres alfanuméricos en CloudFormation (`QA_Audit` -> `QAAudit`) y despliegue exitoso mediante `ampx sandbox`.
- **Preparación de Despliegue:** Commit y Push final a GitHub (`master`) sincronizado con el Stack de Virginia.

---

## [0.4.0] - 2026-04-03 (Sesión 4 - Consolidación AWS Cloud & Estabilidad Total)

### Añadido
- **Infraestructura Real Time:** Despliegue exitoso del Stack de backend en **N. Virginia (us-east-1)**, estableciendo el entorno definitivo de producción y datos.
- **Contexto Global de Hoteles:** Implementación de `HotelsContext.tsx` para centralizar la información de hoteles y empleados, optimizando el rendimiento global de la App.
- **Autenticación Reactiva:** Mejora del `AuthContext.tsx` mediante el uso de `Amplify Hub` para detectar inicios y cierres de sesión en tiempo real, eliminando pantallas negras.
- **Primeros Datos Reales:** Confirmación del ciclo completo de datos (Lectura/Escritura) con el primer empleado registrado físicamente en la base de datos de AWS.

### Cambiado
- **Optimización de Servicios:** Refactorización de `employeeService`, `hotelService` y `staffingService` con lógica de inicialización perezosa (lazy) para evitar peticiones sin autenticación.
- **Arquitectura de Componentes:** Reestructuración de `App.tsx` para envolver los proveedores de datos (`Hotels`, `Staffing`) solo tras una autenticación exitosa, garantizando un arranque limpio.
- **Eliminación de Bucles:** Corrección de bucles infinitos de renderizado mediante la eliminación de suscripciones Realtime de Supabase y el uso de `useRef` para control de carga.
- **Estructura de Red:** Configuración del `ProtectedRoute` para delegar la seguridad principal al `Authenticator` de AWS, resolviendo el bucle de redirección infinita al cerrar sesión.

### Técnico
- **Limpieza de "Fantasmas":** Eliminación definitiva de referencias a `jspdf` y `supabase` que bloqueaban la compilación en la nube.
- **Configuración de Salida:** Creación del archivo `vite.svg` faltante y limpieza de la consola del navegador.
- **Persistencia Cloud:** Generación del archivo `amplify_outputs.json` definitivo vinculado a la región de Virginia.

---

## [0.3.0] - 2026-04-02 (Sesión 3 - Preparación AWS & Automatización Pro)

### Añadido
- **Historial de Rotación Inteligente:** Implementación del tipo `EmployeeAssignment` y lógica de traslados automáticos en `employeeService.ts`. El sistema ahora guarda el historial de hoteles por empleado.
- **Numeración Automática de Empleados:** Generación inteligente de IDs con formato por año (ej: `26-001`).
- **Numeración de Solicitudes (SR):** Implementación de folios de seguimiento para Staffing Requests (ej: `SR26-001`).
- **Preparación para Bot de Telegram:** Diseño del flujo bilingüe (EN/ES) y campos `telegram_id` y `language_preference` en los perfiles.
- **Seguridad Senior:** Blindaje del archivo `.env` en `.gitignore` para proteger las llaves de AWS y Telegram.

### Cambiado
- **Refactorización de Servicios:** `staffingService.ts` y `employeeService.ts` ahora usan IDs secuenciales y lógica de negocio avanzada en lugar de valores aleatorios.

### Técnico
- Configuración de variables de entorno para `TELEGRAM_BOT_TOKEN`.
- Preparación de la arquitectura para migración a AWS RDS y Amplify Gen 2.

---

## [0.2.0] - 2026-03-31 (Sesión 2 - Arquitectura Enterprise)

### Añadido
- **Capa de Servicios Extendida:** Implementación de `hotelService.ts` y `employeeService.ts`. Desacoplamiento total de los módulos Core.
- **Sistema de Rutas Profesional:** Creación de `src/routes/paths.ts` para centralizar todas las URLs del sistema.
- **Control de Acceso (RBAC):** Creación del componente `ProtectedRoute.tsx` para manejo automático de permisos por rol (Admin, Recruiter, etc.).
- **Modo Offline Extendido:** Soporte de datos Mock para Hoteles y Empleados, protegiendo la integridad de Supabase.

### Cambiado
- **Refactorización de App.tsx:** Limpieza profunda del archivo principal, delegando la seguridad al nuevo sistema de rutas protegidas.
- **Hooks Desacoplados:** `useHotels` y `useEmployees` ahora son agnósticos a la base de datos (Ready-for-AWS).

### Técnico
- Implementación de patrones de diseño: *Service Layer* y *Higher-Order Components* para seguridad.

---

## [0.1.0] - 2026-03-31 (Sesión 1 - Rebranding e Inicio AWS)

### Añadido
- **Capa de Servicios Inicial:** Introducción de `src/services/staffingService.ts`.
- **Modo Offline Inicial:** Implementación de datos Mock y bypass de autenticación.

### Cambiado
- **Rebranding:** Renombrado oficial del proyecto a **OranjeApp** (`package.json`, `index.html`).
- **Refactorización:** Simplificación del hook `useStaffingRequests.ts`.
