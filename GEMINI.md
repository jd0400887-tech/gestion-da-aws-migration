# MANDATOS MAESTROS - ORANJEAPP

Este archivo contiene las directrices fundamentales de arquitectura, diseño y reglas de negocio que DEBEN seguirse en este proyecto.

## 🏗️ INFRAESTRUCTURA (AWS NATIVE)
- **Backend:** AWS Amplify Gen 2.
- **Base de Datos:** RDS PostgreSQL 16 (N. Virginia).
- **Almacenamiento:** AWS S3 (Gestionado vía `S3Image.tsx`).
- **Comando de Despliegue:** `npx ampx sandbox` (para desarrollo).

## 🎨 ESTÁNDAR DE DISEÑO (SENIOR PREMIUM)
- **Estética:** Se debe mantener un look "Enterprise" con el uso de gradientes sutiles, sombras suaves (`boxShadow`) y bordes redondeados (`borderRadius: 3` o `4`).
- **Paleta:** Deep Slate (`#0F172A`) para fondos oscuros y Orange Energy (`#FF5722`) para acciones principales.
- **Interactividad:** Las listas y tarjetas deben tener efectos de `hover` (elevación o desplazamiento sutil).

## 🛡️ REGLAS DE NEGOCIO CRÍTICAS
1. **Exclusividad de Asignación:** Un empleado con contrato **Permanente** en un hotel NO puede ser asignado a otra solicitud permanente. Solo puede cubrir solicitudes **Temporales** (marcado como `COVER`).
2. **Seguridad Blacklist:** Los empleados en **Lista Negra** deben estar bloqueados visualmente (color rojo) y excluidos de cualquier buscador de asignación. El motivo de restricción es obligatorio.
3. **Roles de Usuario:**
   - **ADMIN:** Control total, gestión de Cargos (`Positions`) y Usuarios.
   - **RECRUITER:** Gestión de solicitudes y candidatos.
   - **INSPECTOR:** Marcaje GPS y gestión de zona asignada.

## 📋 INTEGRIDAD DE DATOS
- **Auto-Formateo:** Todos los nombres de personas, hoteles y ciudades deben pasar por la utilidad `toTitleCase` de `src/utils/stringUtils.ts` antes de guardarse.
- **Imágenes:** No guardar URLs completas de S3. Guardar solo la **Ruta (Path)** y resolverla dinámicamente con el componente `<S3Image />`.

## 📜 SEGUIMIENTO
- Mantener y actualizar el archivo `CHANGELOG.md` en cada sesión siguiendo el versionado semántico.
