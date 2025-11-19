import * as p from '@clack/prompts'
import color from 'picocolors'
import { getMessages } from './i18n.js'
import type { Zone, DNSRecord, CloudflareResponse } from './types.js'

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN
const messages = getMessages()

async function fetchCloudflareAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<CloudflareResponse<T>> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const data = (await response.json()) as CloudflareResponse<T>

  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'API request failed')
  }

  return data
}

async function getZones(): Promise<Zone[]> {
  let allZones: Zone[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const data = await fetchCloudflareAPI<Zone[]>(
      `/zones?status=active&page=${page}&per_page=50`
    )
    allZones = allZones.concat(data.result)

    hasMore = data.result_info ? data.result_info.total_pages > page : false
    page++
  }

  return allZones
}

async function getDNSRecords(zoneId: string): Promise<DNSRecord[]> {
  let allRecords: DNSRecord[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const data = await fetchCloudflareAPI<DNSRecord[]>(
      `/zones/${zoneId}/dns_records?page=${page}&per_page=100`
    )
    allRecords = allRecords.concat(data.result)

    hasMore = data.result_info ? data.result_info.total_pages > page : false
    page++
  }

  return allRecords
}

async function updateDNSRecord(
  zoneId: string,
  recordId: string,
  proxied: boolean
) {
  await fetchCloudflareAPI<DNSRecord>(
    `/zones/${zoneId}/dns_records/${recordId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        proxied
      })
    }
  )
}

async function isProxiedByCloudflare(domain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    return (
      response.headers.has('cf-ray') ||
      response.headers.get('server')?.toLowerCase() === 'cloudflare'
    )
  } catch {
    return false
  }
}

async function checkZonesProxyStatus(
  zones: Zone[]
): Promise<Map<string, boolean>> {
  const statusMap = new Map<string, boolean>()

  await Promise.all(
    zones.map(async (zone) => {
      const isProxied = await isProxiedByCloudflare(zone.name)
      statusMap.set(zone.id, isProxied)
    })
  )

  return statusMap
}

async function main() {
  console.clear()

  p.intro(color.bgCyan(color.black(messages.intro)))

  if (!CLOUDFLARE_TOKEN) {
    p.cancel(messages.tokenNotFound)
    process.exit(1)
  }

  const s = p.spinner()
  s.start(messages.fetchingZones)

  try {
    const zones = await getZones()
    s.stop(messages.zonesObtained)

    if (zones.length === 0) {
      p.log.warn(messages.noActiveZones)
      p.outro(messages.processEnd)
      return
    }

    s.start(messages.verifyingProxyStatus)
    const proxyStatusMap = await checkZonesProxyStatus(zones)
    s.stop(messages.statusVerified)

    const selectedZoneId = await p.select({
      message: messages.selectProject,
      options: zones.map((zone) => {
        const isProxied = proxyStatusMap.get(zone.id)
        const proxyIndicator = isProxied ? color.yellow('●') : color.gray('○')
        return {
          value: zone.id,
          label: `${zone.name} ${proxyIndicator}`,
          hint: isProxied ? messages.cloudflareActive : messages.dnsOnly
        }
      })
    })

    if (p.isCancel(selectedZoneId)) {
      p.cancel(messages.operationCancelled)
      process.exit(0)
    }

    const selectedZone = zones.find((z) => z.id === selectedZoneId)

    s.start(messages.fetchingDnsRecords(selectedZone?.name || ''))
    const records = await getDNSRecords(selectedZoneId as string)
    s.stop(messages.foundDnsRecords(records.length))

    if (records.length === 0) {
      p.log.info(messages.noDnsRecords)
      p.outro(messages.processEnd)
      return
    }

    const action = await p.select({
      message: messages.whatToDo,
      options: [
        {
          value: 'disable',
          label: messages.disableProxy,
          hint: messages.disableProxyHint
        },
        {
          value: 'enable',
          label: messages.enableProxy,
          hint: messages.enableProxyHint
        }
      ]
    })

    if (p.isCancel(action)) {
      p.cancel(messages.operationCancelled)
      process.exit(0)
    }

    const wantProxied = action === 'enable'
    const filteredRecords = records.filter((r) => r.proxied !== wantProxied)

    if (filteredRecords.length === 0) {
      p.log.info(wantProxied ? messages.allProxied : messages.allUnproxied)
      p.outro(messages.processEnd)
      return
    }

    const selectedRecords = await p.multiselect({
      message: wantProxied
        ? messages.selectRecordsToEnable
        : messages.selectRecordsToDisable,
      options: filteredRecords.map((record) => ({
        value: record.id,
        label: `${record.name} (${record.type})`,
        hint: `${record.proxied ? messages.proxied : `⬜ ${messages.dnsOnly}`} → ${record.content}`
      })),
      required: false
    })

    if (p.isCancel(selectedRecords)) {
      p.cancel(messages.operationCancelled)
      process.exit(0)
    }

    if (!selectedRecords || (selectedRecords as string[]).length === 0) {
      p.log.warn(messages.noRecordSelected)
      p.outro(messages.processEnd)
      return
    }

    const confirm = await p.confirm({
      message: wantProxied
        ? messages.confirmEnable((selectedRecords as string[]).length)
        : messages.confirmDisable((selectedRecords as string[]).length)
    })

    if (p.isCancel(confirm) || !confirm) {
      p.cancel(messages.operationCancelled)
      process.exit(0)
    }

    await p.tasks([
      {
        title: wantProxied ? messages.enablingProxy : messages.disablingProxy,
        task: async (message) => {
          for (const recordId of selectedRecords as string[]) {
            const record = filteredRecords.find((r) => r.id === recordId)
            if (record) {
              await updateDNSRecord(
                selectedZoneId as string,
                recordId,
                wantProxied
              )
              message(
                `${wantProxied ? messages.enabled : messages.disabled}: ${record.name}`
              )
            }
          }
          return messages.recordsUpdated((selectedRecords as string[]).length)
        }
      }
    ])

    p.log.success(wantProxied ? messages.proxyEnabled : messages.proxyDisabled)
    p.log.message(
      wantProxied ? messages.proxyEnabledInfo : messages.proxyDisabledInfo,
      { symbol: color.cyan('ℹ') }
    )

    p.outro(color.green(messages.processCompleted))
  } catch (error) {
    s.stop(messages.errorFetchingData)
    p.log.error(error instanceof Error ? error.message : messages.unknownError)
    p.cancel(messages.operationFailed)
    process.exit(1)
  }
}

main()
