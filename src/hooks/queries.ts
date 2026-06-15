// React Query hooks pour WasteFlow
// Centralise le fetching, le cache, le rafraîchissement et la gestion d'erreur

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import toast from 'react-hot-toast'

// ─── Query key factories ─────────────────────────────────────────────────────
// Centralise les clés de cache pour éviter les collisions

export const queryKeys = {
  kpis:             ['kpis'] as const,
  abonnes:          (params?: Record<string, string>) => ['abonnes', params] as const,
  abonne:           (id: string) => ['abonnes', id] as const,
  paiements:        (params?: Record<string, string>) => ['paiements', params] as const,
  tournees:         (params?: Record<string, string>) => ['tournees', params] as const,
  engins:           (params?: Record<string, string>) => ['engins', params] as const,
  employes:         (params?: Record<string, string>) => ['employes', params] as const,
  zones:            ['zones'] as const,
  consommables:     ['consommables'] as const,
  rapports:         ['rapports'] as const,
  commune:          ['commune'] as const,
  parametres:       ['parametres'] as const,
  membres:          ['membres'] as const,
  superadmin:       {
    orgs:           (params?: Record<string, string>) => ['superadmin', 'orgs', params] as const,
    users:          (params?: Record<string, string>) => ['superadmin', 'users', params] as const,
    stats:          ['superadmin', 'stats'] as const,
  },
}

// ─── Generic fetch helper ────────────────────────────────────────────────────

async function fetchApi<T>(path: string): Promise<T> {
  const data = await api<T>(path)
  return data
}

// ─── Abonnés ─────────────────────────────────────────────────────────────────

export function useAbonnes(params?: Record<string, string>) {
  const searchParams = params ? '?' + new URLSearchParams(params).toString() : ''
  return useQuery({
    queryKey: queryKeys.abonnes(params),
    queryFn: () => fetchApi<{ abonnes: unknown[]; total: number }>(`/api/abonnes${searchParams}`),
    staleTime: 30_000,
  })
}

export function useAbonne(id: string) {
  return useQuery({
    queryKey: queryKeys.abonne(id),
    queryFn: () => fetchApi<{ abonne: unknown }>(`/api/abonnes/${id}`),
    enabled: !!id,
  })
}

// ─── KPIs / Dashboard ────────────────────────────────────────────────────────

export function useKpis() {
  return useQuery({
    queryKey: queryKeys.kpis,
    queryFn: () => fetchApi<{ kpis: unknown; alertes: unknown[] }>('/api/kpis'),
    staleTime: 60_000,
    refetchInterval: 120_000, // auto-refresh toutes les 2 minutes
  })
}

// ─── Paiements ───────────────────────────────────────────────────────────────

export function usePaiements(params?: Record<string, string>) {
  const searchParams = params ? '?' + new URLSearchParams(params).toString() : ''
  return useQuery({
    queryKey: queryKeys.paiements(params),
    queryFn: () => fetchApi<{ paiements: unknown[]; total?: number }>(`/api/paiements${searchParams}`),
    staleTime: 15_000,
  })
}

// ─── Tournées ────────────────────────────────────────────────────────────────

export function useTournees(params?: Record<string, string>) {
  const searchParams = params ? '?' + new URLSearchParams(params).toString() : ''
  return useQuery({
    queryKey: queryKeys.tournees(params),
    queryFn: () => fetchApi<{ tournees: unknown[]; total?: number }>(`/api/tournees${searchParams}`),
    staleTime: 30_000,
  })
}

// ─── Engins ──────────────────────────────────────────────────────────────────

export function useEngins(params?: Record<string, string>) {
  const searchParams = params ? '?' + new URLSearchParams(params).toString() : ''
  return useQuery({
    queryKey: queryKeys.engins(params),
    queryFn: () => fetchApi<{ engins: unknown[] }>(`/api/engins${searchParams}`),
    staleTime: 30_000,
  })
}

// ─── Employés ────────────────────────────────────────────────────────────────

export function useEmployes(params?: Record<string, string>) {
  const searchParams = params ? '?' + new URLSearchParams(params).toString() : ''
  return useQuery({
    queryKey: queryKeys.employes(params),
    queryFn: () => fetchApi<{ employes: unknown[] }>(`/api/employes${searchParams}`),
    staleTime: 30_000,
  })
}

// ─── Zones ───────────────────────────────────────────────────────────────────

export function useZones() {
  return useQuery({
    queryKey: queryKeys.zones,
    queryFn: () => fetchApi<{ zones: unknown[] }>('/api/zones'),
    staleTime: 60_000,
  })
}

// ─── Consommables ────────────────────────────────────────────────────────────

export function useConsommables() {
  return useQuery({
    queryKey: queryKeys.consommables,
    queryFn: () => fetchApi<{ consommables: unknown[] }>('/api/consommables'),
    staleTime: 30_000,
  })
}

// ─── Rapports ────────────────────────────────────────────────────────────────

export function useRapports() {
  return useQuery({
    queryKey: queryKeys.rapports,
    queryFn: () => fetchApi<{ rapports: unknown[] }>('/api/rapports'),
    staleTime: 60_000,
  })
}

// ─── Commune ─────────────────────────────────────────────────────────────────

export function useCommune() {
  return useQuery({
    queryKey: queryKeys.commune,
    queryFn: () => fetchApi<{ commune: unknown }>('/api/commune'),
    staleTime: 60_000,
  })
}

// ─── Mutations génériques ────────────────────────────────────────────────────
// Pour POST / PUT / PATCH / DELETE avec invalidation automatique

export function useCreateResource(resource: string, invalidateKeys: string[][]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: unknown) => api(`/api/${resource}`, { method: 'POST', body }),
    onSuccess: () => {
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
      toast.success('Créé avec succès')
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : 'Erreur lors de la création')
    },
  })
}

export function useUpdateResource(resource: string, invalidateKeys: string[][]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) =>
      api(`/api/${resource}/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
      toast.success('Mis à jour avec succès')
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour')
    },
  })
}

export function useDeleteResource(resource: string, invalidateKeys: string[][]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api(`/api/${resource}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
      toast.success('Supprimé avec succès')
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : 'Erreur lors de la suppression')
    },
  })
}
