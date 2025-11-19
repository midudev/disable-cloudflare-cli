const es = {
  intro: ' Cloudflare Proxy Manager ',
  tokenNotFound: 'No se encontró CLOUDFLARE_TOKEN en las variables de entorno',
  enterToken: 'Ingresa tu token de Cloudflare API:',
  tokenPlaceholder: 'Tu token de API',
  howToGetToken: 'Cómo obtener tu token:',
  tokenStep1: '1. Ve a https://dash.cloudflare.com/profile/api-tokens',
  tokenStep2: '2. Haz clic en "Create Token"',
  tokenStep3: '3. Usa la plantilla "Edit zone DNS" o crea uno personalizado',
  tokenStep4: '4. Permisos necesarios: Zone > DNS > Edit, Zone > Zone',
  tokenInvalid: 'Token inválido o sin permisos suficientes',
  fetchingZones: 'Obteniendo proyectos de Cloudflare',
  zonesObtained: 'Proyectos obtenidos correctamente',
  noActiveZones: 'No se encontraron proyectos activos en Cloudflare',
  processEnd: 'Fin del proceso',
  verifyingProxyStatus: 'Verificando estado del proxy...',
  statusVerified: 'Estado verificado',
  selectProject: 'Selecciona el proyecto del que quieres gestionar el proxy:',
  cloudflareActive: 'Cloudflare activo',
  dnsOnly: 'DNS only',
  operationCancelled: 'Operación cancelada',
  fetchingDnsRecords: (domain: string) =>
    `Obteniendo registros DNS de ${domain}`,
  foundDnsRecords: (count: number) => `Encontrados ${count} registros DNS`,
  noDnsRecords: 'No hay registros DNS en este proyecto',
  whatToDo: '¿Qué quieres hacer?',
  disableProxy: 'Desactivar proxy (DNS only)',
  disableProxyHint: 'Tráfico directo al servidor',
  enableProxy: 'Activar proxy',
  enableProxyHint: 'Tráfico a través de Cloudflare',
  allProxied: 'Todos los registros ya tienen el proxy activo',
  allUnproxied: 'Todos los registros ya tienen el proxy desactivado',
  selectRecordsToEnable: 'Selecciona los registros para activar el proxy:',
  selectRecordsToDisable: 'Selecciona los registros para desactivar el proxy:',
  proxied: '🟧 Proxied',
  noRecordSelected: 'No se seleccionó ningún registro',
  confirmEnable: (count: number) =>
    `¿Activar el proxy de Cloudflare para ${count} registro(s)?`,
  confirmDisable: (count: number) =>
    `¿Desactivar el proxy de Cloudflare para ${count} registro(s)?`,
  enablingProxy: 'Activando proxy de Cloudflare',
  disablingProxy: 'Desactivando proxy de Cloudflare',
  enabled: 'Activado',
  disabled: 'Desactivado',
  recordsUpdated: (count: number) => `${count} registro(s) actualizados`,
  proxyEnabled: 'Proxy activado correctamente',
  proxyDisabled: 'Proxy desactivado correctamente',
  proxyEnabledInfo:
    'Los registros ahora usan el proxy de Cloudflare (protección DDoS + CDN)',
  proxyDisabledInfo:
    'Los registros ahora apuntan directamente al host original (DNS only)',
  processCompleted: '¡Proceso completado!',
  errorFetchingData: 'Error al obtener los datos',
  unknownError: 'Error desconocido',
  operationFailed: 'Operación fallida'
}

const en = {
  intro: ' Cloudflare Proxy Manager ',
  tokenNotFound: 'CLOUDFLARE_TOKEN not found in environment variables',
  enterToken: 'Enter your Cloudflare API token:',
  tokenPlaceholder: 'Your API token',
  howToGetToken: 'How to get your token:',
  tokenStep1: '1. Go to https://dash.cloudflare.com/profile/api-tokens',
  tokenStep2: '2. Click "Create Token"',
  tokenStep3: '3. Use "Edit zone DNS" template or create a custom one',
  tokenStep4: '4. Required permissions: Zone > DNS > Edit, Zone > Zone',
  tokenInvalid: 'Invalid token or insufficient permissions',
  fetchingZones: 'Fetching Cloudflare zones',
  zonesObtained: 'Zones obtained successfully',
  noActiveZones: 'No active zones found in Cloudflare',
  processEnd: 'Process ended',
  verifyingProxyStatus: 'Verifying proxy status...',
  statusVerified: 'Status verified',
  selectProject: 'Select the project to manage the proxy:',
  cloudflareActive: 'Cloudflare active',
  dnsOnly: 'DNS only',
  operationCancelled: 'Operation cancelled',
  fetchingDnsRecords: (domain: string) => `Fetching DNS records for ${domain}`,
  foundDnsRecords: (count: number) => `Found ${count} DNS records`,
  noDnsRecords: 'No DNS records in this project',
  whatToDo: 'What do you want to do?',
  disableProxy: 'Disable proxy (DNS only)',
  disableProxyHint: 'Direct traffic to server',
  enableProxy: 'Enable proxy',
  enableProxyHint: 'Traffic through Cloudflare',
  allProxied: 'All records already have proxy enabled',
  allUnproxied: 'All records already have proxy disabled',
  selectRecordsToEnable: 'Select records to enable proxy:',
  selectRecordsToDisable: 'Select records to disable proxy:',
  proxied: '🟧 Proxied',
  noRecordSelected: 'No record selected',
  confirmEnable: (count: number) =>
    `Enable Cloudflare proxy for ${count} record(s)?`,
  confirmDisable: (count: number) =>
    `Disable Cloudflare proxy for ${count} record(s)?`,
  enablingProxy: 'Enabling Cloudflare proxy',
  disablingProxy: 'Disabling Cloudflare proxy',
  enabled: 'Enabled',
  disabled: 'Disabled',
  recordsUpdated: (count: number) => `${count} record(s) updated`,
  proxyEnabled: 'Proxy enabled successfully',
  proxyDisabled: 'Proxy disabled successfully',
  proxyEnabledInfo: 'Records now use Cloudflare proxy (DDoS protection + CDN)',
  proxyDisabledInfo:
    'Records now point directly to the original host (DNS only)',
  processCompleted: 'Process completed!',
  errorFetchingData: 'Error fetching data',
  unknownError: 'Unknown error',
  operationFailed: 'Operation failed'
}

// Check es and en only contain the same keys
type Messages = typeof es

function detectLocale(): string {
  const lang =
    process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || ''
  return lang.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function getMessages(): Messages {
  const locale = detectLocale()
  return locale === 'es' ? es : en
}
