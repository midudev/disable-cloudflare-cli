#!/usr/bin/env node
import * as p from '@clack/prompts'
import color from 'picocolors'
import { getMessages } from './i18n.js'
import type { Zone, DNSRecord, CloudflareResponse } from './types.js'

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4'
let cloudflareToken = process.env.CLOUDFLARE_TOKEN
const messages = getMessages()

/**
 * Makes authenticated requests to the Cloudflare API
 * Handles authorization headers and validates response success
 */
async function fetchCloudflareAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<CloudflareResponse<T>> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${cloudflareToken}`,
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

/**
 * Fetches all active Cloudflare zones with pagination support
 * Returns a complete list of zones across all pages
 */
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

/**
 * Retrieves all DNS records for a specific zone with pagination
 * Handles up to 100 records per page to minimize API calls
 */
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

/**
 * Updates the proxy status of a DNS record (orange cloud on/off)
 * Only modifies the proxied field, leaving other settings intact
 */
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

/**
 * Checks if a domain is currently being proxied through Cloudflare
 * Detects presence of cf-ray header or cloudflare server signature
 */
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

/**
 * Verifies proxy status for multiple zones concurrently
 * Returns a map of zone IDs to their active proxy state for quick lookup
 */
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

/**
 * Prompts user to enter their Cloudflare API token
 * Displays step-by-step instructions on how to obtain the token
 */
async function requestToken(): Promise<string> {
  p.note(
    `${messages.tokenStep1}\n${messages.tokenStep2}\n${messages.tokenStep3}\n${messages.tokenStep4}`,
    messages.howToGetToken
  )

  const token = await p.text({
    message: messages.enterToken,
    placeholder: messages.tokenPlaceholder,
    validate: (value) => {
      if (!value || value.length < 10) {
        return messages.tokenInvalid
      }
    }
  })

  if (p.isCancel(token)) {
    p.cancel(messages.operationCancelled)
    process.exit(0)
  }

  return token as string
}

/**
 * Validates the provided token by attempting to fetch zones
 * Returns true if token has sufficient permissions, false otherwise
 */
async function validateToken(token: string): Promise<boolean> {
  try {
    cloudflareToken = token
    await getZones()
    return true
  } catch {
    return false
  }
}

/**
 * Main application flow orchestrating the entire proxy management process
 * Handles token validation, zone selection, DNS record filtering, and batch updates
 */
async function main() {
  console.clear()

  p.intro(color.bgCyan(color.black(messages.intro)))

  if (!cloudflareToken) {
    const token = await requestToken()
    const isValid = await validateToken(token)

    if (!isValid) {
      p.cancel(messages.tokenInvalid)
      process.exit(1)
    }
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
