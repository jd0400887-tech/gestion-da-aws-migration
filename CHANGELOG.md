# Changelog - OranjeApp

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [0.4.0] - 2026-04-03 (Sesión 4 - Migración Cuenta Oficial & Infraestructura Cloud Real)

### Añadido
- **Migración de Propiedad:** Vinculación exitosa de la terminal y el código con la cuenta oficial de la empresa (**066205662004**), garantizando el control total de OranjeApp por parte de la organización.
- **Inauguración de Región (Bootstrap):** Proceso de "Bootstrap" de AWS CDK completado en la región `us-east-1`, habilitando la capacidad de despliegue profesional.
- **Servidor RDS Oficial:** Lanzamiento de la instancia **PostgreSQL 16.6** (`oranjeapp-db-v1`) en la cuenta corporativa. El servidor ya se encuentra en estado **Disponible**.
- **Despliegue Web Real:** Configuración de **AWS Amplify Hosting**. La aplicación ya es accesible públicamente en el link oficial de AWS: [https://master.d35qt8j7z8t8yu.amplifyapp.com/](https://master.d35qt8j7z8t8yu.amplifyapp.com/).
- **Seguridad de Acceso:** Integración del componente `Authenticator` de AWS. La App ahora está protegida bajo estándares de seguridad corporativa (Cognito).

### Cambiado
- **Arquitectura de Datos:** Refactorización de `amplify/data/resource.ts` para cumplir con las validaciones de esquema de AWS Amplify Gen 2.
- **Limpieza de Credenciales:** Eliminación de conflictos entre cuentas mediante la depuración de variables de entorno y llaves de acceso CLI.

### Técnico
- Verificación de identidad AWS exitosa en la cuenta corporativa (`aws sts get-caller-identity`).
- Configuración de persistencia de credenciales en `%USERPROFILE%\.aws\credentials`.
- Preparación del entorno de backend para la creación física de tablas (Próxima Sesión).

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
