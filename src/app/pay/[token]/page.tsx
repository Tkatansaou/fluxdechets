'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Truck, Loader2 } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

type Step = 'loading' | 'choix' | 'confirmation' | 'processing' | 'succes' | 'echec' | 'erreur'
type Operateur = 'tmoney' | 'flooz' | 'moov'

interface AbonneInfo {
  prenom: string
  nom: string
  telephone: string
  zone: string
  orgName: string
}

interface PayInfo {
  abonne: AbonneInfo
  montant: number
  frais: number
  total: number
  moisCourant: string
}

const OPERATEURS: { id: Operateur; label: string; color: string; bg: string; description: string }[] = [
  { id: 'tmoney',  label: 'T-Money',  color: '#FF6B00', bg: '#FFF3E8', description: 'Togocel' },
  { id: 'flooz',   label: 'Flooz',    color: '#E83E8C', bg: '#FDF0F6', description: 'Moov Africa' },
  { id: 'moov',    label: 'Moov',     color: '#0078D4', bg: '#EBF4FF', description: 'Moov Money' },
]

export default function PayPage() {
  const { token } = useParams()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('loading')
  const [payInfo, setPayInfo] = useState<PayInfo | null>(null)
  const [operateur, setOperateur] = useState<Operateur | null>(null)
  const [reference, setReference] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  // Fetch abonné info from API
  useEffect(() => {
    if (!token) return

    // Handle return from external checkout (Moneroo/Bictorys redirect)
    const status = searchParams.get('status')
    if (status === 'success') {
      setStep('succes')
      setReference(searchParams.get('ref') ?? '')
      return
    }
    if (status === 'failed') {
      setStep('echec')
      return
    }

    fetch(`/api/pay/${token}`)
      .then(r => r.json())
      .then((data: PayInfo & { error?: string }) => {
        if (data.error) {
          setStep('erreur')
        } else {
          setPayInfo(data)
          setStep('choix')
        }
      })
      .catch(() => setStep('erreur'))
  }, [token, searchParams])

  const handlePay = async () => {
    if (!operateur) return
    setStep('processing')

    try {
      const res = await fetch(`/api/pay/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operateur }),
      })
      const data = await res.json() as {
        ok: boolean
        provider?: string
        reference?: string
        statut?: string
        checkoutUrl?: string
        paymentUrl?: string
      }

      if (!res.ok || !data.ok) {
        setStep('echec')
        return
      }

      // External checkout page (Moneroo/Bictorys redirect)
      const redirectUrl = data.checkoutUrl ?? data.paymentUrl
      if (redirectUrl) {
        let safe = false
        try {
          const u = new URL(redirectUrl)
          safe = u.protocol === 'https:' &&
            (u.hostname.endsWith('.moneroo.io') || u.hostname.endsWith('.bictorys.com'))
        } catch { /* malformed URL */ }
        if (!safe) { setStep('echec'); return }
        setCheckoutUrl(redirectUrl)
        window.location.href = redirectUrl
        return
      }

      // Demo mode: immediate success
      setReference(data.reference ?? '')
      setStep(data.statut === 'validé' ? 'succes' : 'echec')
    } catch {
      setStep('echec')
    }
  }

  const moisCourant = payInfo?.moisCourant ?? new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const total = payInfo?.total ?? 1110
  const selectedOp = OPERATEURS.find(o => o.id === operateur)

  return (
    <div className="min-h-screen bg-[#F2F4F0] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#0B1F16] flex items-center justify-center">
            <Truck size={15} className="text-[#4ade80]" />
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-none">fluxdechets.com</div>
            <div className="text-xs text-gray-500">Paiement redevance collecte</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Loading */}
          {step === 'loading' && (
            <div className="p-10 text-center">
              <Loader2 size={32} className="animate-spin text-gray-400 mx-auto" />
            </div>
          )}

          {/* Erreur lien invalide */}
          {step === 'erreur' && (
            <div className="p-8 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <h2 className="text-lg font-bold text-gray-900">Lien invalide</h2>
              <p className="text-sm text-gray-500">Ce lien de paiement n'existe pas ou a expiré.</p>
            </div>
          )}

          {/* Choix opérateur */}
          {step === 'choix' && payInfo && (
            <div className="p-6 space-y-5">
              {/* Abonné info */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Paiement pour</div>
                <div className="text-xl font-bold text-gray-900">{payInfo.abonne.prenom} {payInfo.abonne.nom}</div>
                <div className="text-xs text-gray-500 mt-0.5">{payInfo.abonne.zone} · {moisCourant}</div>
              </div>

              {/* Montant */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 tabular-nums">{formatFCFA(payInfo.montant)}</div>
                <div className="text-xs text-gray-400 mt-1">
                  + {formatFCFA(payInfo.frais)} de frais = {formatFCFA(total)} total
                </div>
              </div>

              {/* Choix opérateur */}
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2 text-center">Choisissez votre moyen de paiement</div>
                <div className="grid grid-cols-3 gap-2">
                  {OPERATEURS.map(op => (
                    <button
                      key={op.id}
                      onClick={() => setOperateur(op.id)}
                      className="p-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 flex flex-col items-center gap-0.5"
                      style={{
                        color: operateur === op.id ? op.color : '#6b7280',
                        backgroundColor: operateur === op.id ? op.bg : 'white',
                        borderColor: operateur === op.id ? op.color : '#e5e7eb',
                      }}
                    >
                      <span className="text-base font-extrabold">{op.label}</span>
                      <span className="text-[10px] font-normal opacity-70">{op.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => operateur && setStep('confirmation')}
                disabled={!operateur}
                className="w-full bg-[#0B1F16] hover:bg-[#163024] disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg transition-colors active:scale-[0.98]"
              >
                Payer {formatFCFA(total)}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Paiement sécurisé via Mobile Money.<br />Vous recevrez un SMS de confirmation.
              </p>
            </div>
          )}

          {/* Confirmation */}
          {step === 'confirmation' && payInfo && selectedOp && (
            <div className="p-6 space-y-5">
              <h3 className="text-lg font-bold text-gray-900 text-center">Confirmer le paiement</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bénéficiaire</span>
                  <span className="font-medium">{payInfo.abonne.prenom} {payInfo.abonne.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium">Collecte ordures — {moisCourant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Opérateur</span>
                  <span className="font-bold" style={{ color: selectedOp.color }}>
                    {selectedOp.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Numéro</span>
                  <span className="font-medium font-mono">{payInfo.abonne.telephone}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                  <span>Total à payer</span>
                  <span className="text-lg">{formatFCFA(total)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep('choix')} className="py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                  Retour
                </button>
                <button onClick={handlePay} className="py-3 rounded-xl bg-[#0B1F16] text-white font-bold hover:bg-[#163024] active:scale-95">
                  Confirmer
                </button>
              </div>
            </div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0B1F16] rounded-full animate-spin mx-auto" />
              <div>
                <div className="text-base font-semibold text-gray-900">Traitement en cours…</div>
                <div className="text-sm text-gray-500 mt-1">
                  {checkoutUrl ? 'Redirection vers la page de paiement…' : `Connexion à ${selectedOp?.label ?? 'l\'opérateur'}…`}
                </div>
              </div>
            </div>
          )}

          {/* Succès */}
          {step === 'succes' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">Paiement réussi !</div>
                <div className="text-sm text-gray-600 mt-1">
                  {formatFCFA(total)} payé via {selectedOp?.label ?? 'Mobile Money'}
                </div>
              </div>
              {reference && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Référence</span>
                    <span className="font-mono font-bold text-gray-900">{reference}</span>
                  </div>
                  {payInfo && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Abonné</span>
                        <span className="font-medium">{payInfo.abonne.prenom} {payInfo.abonne.nom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mois</span>
                        <span className="font-medium">{moisCourant}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
              {payInfo && (
                <p className="text-xs text-gray-400">
                  Un SMS de confirmation vous a été envoyé au {payInfo.abonne.telephone}
                </p>
              )}
            </div>
          )}

          {/* Échec */}
          {step === 'echec' && (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">Paiement échoué</div>
                <div className="text-sm text-gray-500 mt-1">
                  La transaction n'a pas pu être traitée. Vérifiez votre solde {selectedOp?.label ?? 'Mobile Money'}.
                </div>
              </div>
              <button
                onClick={() => setStep('choix')}
                className="w-full py-3 bg-[#0B1F16] text-white font-bold rounded-xl hover:bg-[#163024]"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          fluxdechets.com · {payInfo?.abonne.orgName ?? ''} · Collecte des déchets {payInfo?.abonne.zone ?? ''}
        </p>
      </div>
    </div>
  )
}
