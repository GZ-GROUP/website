# Ficha técnica de protección de datos (Panamá)

Documento interno que pide la normativa: registros, protocolos y reglas sobre los datos personales de GZ Group. Marco: Ley 81 de 2019, Decreto Ejecutivo 285 de 2021 y la [guía de la ANTAI para el sector privado](https://www.antai.gob.pa/wp-content/uploads/2024/01/GUIA-SECTOR-PRIVADO-1.pdf).

> **Este documento y las páginas `/privacy` y `/terms` no son asesoría legal.** Un abogado panameño debe revisarlos antes del lanzamiento.

## Lista previa al lanzamiento

- [ ] **Revisión legal** de `/privacy`, `/terms` y este documento, en especial:
  - La base legal del historial de lectura (hoy, relación contractual).
  - La edad y la forma de autorización de los menores: no se encontró un criterio firme.
  - Si un aviso en el registro basta o hace falta una casilla de aceptación.
- [ ] Confirmar **quién es la entidad responsable**. Hoy los textos dicen "GZ Group"; si no hay sociedad constituida, indicar quién responde.
- [ ] Definir `LEGAL_CONTACT_EMAIL` en producción y atender ese buzón.
- [ ] Confirmar el **país del servidor** y, si está fuera de Panamá, documentar la garantía de la transferencia (arts. 51 a 53 del Decreto 285).
- [ ] Contrato de custodio con el proveedor de alojamiento (arts. 47 a 49 del Decreto 285).
- [ ] Configurar la **rotación de logs a 90 días como máximo**: es lo que promete la política.
- [ ] Construir la imagen con `NEXT_PUBLIC_APP_URL` apuntando al dominio real: canonical, sitemap y tarjetas sociales dependen de él.
- [ ] Dar de alta el sitio y el sitemap en Google Search Console y Bing Webmaster Tools.
- [ ] Programar la limpieza de sesiones vencidas (`sessions`) y definir la conservación de copias de seguridad.

Al cambiar el texto de `/privacy` o `/terms`, actualizar `LEGAL_VERSION` en `lib/legal/version.ts`.

## Inventario de datos

| Tratamiento | Datos | Tabla | Condición de licitud | Conservación |
|---|---|---|---|---|
| Cuenta | Nombre, usuario, email, hash de contraseña | `users`, `accounts` | Relación contractual | Mientras exista la cuenta |
| Perfil público | Foto, bio, descripción, ocupación | `users.image`, `profiles`, `media` | Consentimiento | Hasta que se cambie o elimine |
| Comentarios | Texto y autor | `comments` | Relación contractual | Hasta su eliminación |
| Likes | Usuario y artículo | `article_likes` | Relación contractual | Hasta quitar el like o cancelar |
| Historial de lectura | Usuario, artículo, fechas | `article_reads` | Relación contractual | Mientras exista la cuenta |
| Identidad vinculada | ID de GitHub, verificación | `accounts`, `identity_verifications` | Consentimiento | Hasta desvincular |
| Formulario de contacto | Nombre, email, teléfono, organización, motivo, asunto, mensaje | No se guarda: llega por correo al admin maestro | Consentimiento (casilla) | Hasta resolver la consulta; borrar el correo después |
| Sesiones | Token, IP, navegador | `sessions` | Interés legítimo | Caducan a los 7 días sin actividad |
| Límites de uso | Clave por usuario o IP, contadores | `rate_limits` | Interés legítimo | Se sobrescriben en cada ventana |
| Aceptación legal | Fecha y versión | `users.termsAcceptedAt`, `users.termsVersion` | Obligación de trazabilidad | Mientras exista la cuenta |
| Registros técnicos | Errores sin email ni credenciales | Salida del contenedor | Interés legítimo | Hasta 90 días |

No hay datos sensibles previstos, decisiones automatizadas ni analítica de terceros. Oficial de Protección de Datos: no es obligatorio para entidades privadas; no se ha designado.

**Destinatarios (custodios):** proveedor de alojamiento y almacenamiento S3. **GitHub** interviene solo cuando el usuario vincula su cuenta.

## Protocolo de derechos ARCO

Canales: `LEGAL_CONTACT_EMAIL` y el formulario `/contact` (motivo Privacidad y datos). Gratis para el titular o su representante.

| Solicitud | Plazo | Cómo se atiende hoy |
|---|---|---|
| Acceso | 10 días hábiles | Consulta manual en la base de datos |
| Rectificación | 5 días hábiles | El usuario en Ajustes, o manual |
| Cancelación | 5 días hábiles | Manual. **Borrar un usuario exige antes tratar sus comentarios, artículos y archivos**, que bloquean el borrado (`onDelete: Restrict`). |
| Oposición | 10 días hábiles (verificar con el abogado) | Manual: por ejemplo, borrar `article_reads` del usuario |
| Portabilidad | 10 días hábiles (verificar con el abogado) | Exportación manual en JSON |

Registrar cada solicitud: fecha, titular, tipo, respuesta y fecha de respuesta.

## Violaciones de seguridad

Una violación con riesgo significativo debe notificarse a la ANTAI y a los afectados, en un máximo de **72 horas** según [este documento del Órgano Judicial](https://www.organojudicial.gob.pa/uploads/blogs.dir/28/2026/06/913/la-proteccion-de-datos-personales-en-la-republica-de-panama.pdf) (confirmar el artículo con el abogado).

1. Contener el incidente y conservar los logs.
2. Evaluar qué datos y personas quedaron afectados, y el riesgo.
3. Notificar a la ANTAI (`protecciondedatos@antai.gob.pa`) y a los afectados.
4. Anotar el incidente en el registro siguiente y corregir la causa.

| Fecha | Descripción | Datos y personas afectadas | Notificado | Medidas |
|---|---|---|---|---|
| (sin incidentes) | | | | |
