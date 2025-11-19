# Cloudflare Proxy Manager

Una aplicación CLI para gestionar el proxy de Cloudflare en tus proyectos, permitiéndote desactivar el reverse proxy para que el tráfico vaya directamente al host original.

## Características

- 📋 Lista todos tus proyectos activos en Cloudflare
- 🔍 Muestra todos los registros DNS con proxy activo
- ✅ Selección múltiple de registros a desactivar
- 🚀 Interfaz interactiva con @clack/prompts
- ⚡ Rápido y eficiente con Bun

## Requisitos previos

- [Bun](https://bun.sh) instalado
- Token de API de Cloudflare con permisos de lectura y edición de DNS

## Configuración

1. Instala las dependencias:

```bash
bun install
```

2. Crea un archivo `.env` en la raíz del proyecto:

```bash
CLOUDFLARE_TOKEN="tu_token_de_cloudflare"
```

### Cómo obtener tu token de Cloudflare

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Haz clic en "Create Token"
3. Usa la plantilla "Edit zone DNS" o crea uno personalizado con los permisos:
   - Zone > DNS > Edit
   - Zone > Zone > Read
4. Copia el token generado y agrégalo al archivo `.env`

## Uso

Ejecuta la aplicación:

```bash
bun start
```

O en modo desarrollo con recarga automática:

```bash
bun dev
```

### Flujo de uso

1. La aplicación listará todos tus proyectos activos en Cloudflare
2. Selecciona el proyecto que quieres gestionar
3. Se mostrarán todos los registros DNS que tienen el proxy de Cloudflare activo
4. Selecciona los registros que quieres cambiar a "DNS only" (sin proxy)
5. Confirma la acción
6. Los registros seleccionados se actualizarán para apuntar directamente al host original

## ¿Qué hace exactamente?

Cuando desactivas el proxy de Cloudflare en un registro DNS:
- El tráfico ya no pasa por los servidores de Cloudflare
- La IP real del servidor queda expuesta
- Se pierden las protecciones DDoS y el CDN de Cloudflare
- El registro DNS funciona como un DNS tradicional (DNS only)

Esto es útil cuando necesitas:
- Conectar servicios que requieren la IP directa
- Debugging de problemas de red
- Configuraciones especiales que no funcionan con el proxy

⚠️ Ten en cuenta que el cambio puede tomar minutos en propagarse.

## Estructura del proyecto

```
.
├── index.ts         # Aplicación principal
├── package.json     # Dependencias y scripts
├── .env            # Variables de entorno (no incluido en git)
├── tsconfig.json   # Configuración de TypeScript
└── README.md       # Este archivo
```

## Seguridad

⚠️ **Importante:** Nunca compartas tu token de Cloudflare. El archivo `.env` debe estar en `.gitignore`.

## Licencia

MIT

---

Creado con ❤️ usando [Bun](https://bun.com) y [@clack/prompts](https://github.com/natemoo-re/clack)
