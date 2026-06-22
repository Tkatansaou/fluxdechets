'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Landmark, Truck, Users, TrendingUp, Shield, Menu, X,
  CheckCircle, BarChart3, MapPin, Smartphone, Globe, Star,
  ChevronDown, ArrowRight,
} from 'lucide-react'

/* ─── ScrollReveal Hook ──────────────────────────────────────────────── */
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); io.unobserve(el) } },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

/* ─── Icons map ──────────────────────────────────────────────────────── */
const ICONS = { Users, TrendingUp, Truck, MapPin, BarChart3, Shield, Globe, Smartphone, Landmark } as const
type IconName = keyof typeof ICONS

/* ─── Nav Component ──────────────────────────────────────────────────── */
function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  const close = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const links = [
    { href: '#features', label: 'Fonctionnalités' },
    { href: '#benefits', label: 'Avantages' },
    { href: '#pricing', label: 'Tarifs' },
    { href: '#contact', label: 'Contact' },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                <Truck size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">WasteFlow</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {links.map(l => (
                <a key={l.href} href={l.href}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all duration-200">
                  {l.label}
                </a>
              ))}
              <div className="ml-4 flex items-center gap-3">
                <Link href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4 py-2.5 rounded-lg hover:bg-gray-50">
                  Connexion
                </Link>
                <Link href="/signup"
                  className="text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97]">
                  Essai gratuit
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden relative z-50 p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer — backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={close}
        />
      )}

      {/* Mobile drawer — panel */}
      <div className={`fixed top-0 right-0 z-40 h-full w-72 max-w-[85vw] bg-white shadow-2xl md:hidden transform transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col pt-20 pb-8 h-full">
          <div className="flex-1 px-4 space-y-1">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={close}
                className="block px-4 py-3 text-base text-gray-700 hover:text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors font-medium">
                {l.label}
              </a>
            ))}
          </div>
          <div className="px-4 space-y-3 border-t border-gray-100 pt-6">
            <Link href="/login" onClick={close}
              className="block w-full text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-5 py-3 rounded-xl transition-colors">
              Connexion
            </Link>
            <Link href="/signup" onClick={close}
              className="block w-full text-center text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-5 py-3 rounded-xl transition-colors shadow-sm">
              Essai gratuit
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Hero ────────────────────────────────────────────────────────────── */
function Hero() {
  const ref = useScrollReveal<HTMLDivElement>()
  return (
    <section className="relative pt-28 pb-16 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-100/20 rounded-full blur-3xl -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-100/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      <div className="absolute top-1/3 right-0 w-64 h-64 bg-emerald-50/40 rounded-full blur-3xl translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div ref={ref} className="max-w-3xl mx-auto text-center reveal visible">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/70 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-xs font-medium text-emerald-700">Plateforme DSP · Conçue au Togo pour l&apos;Afrique</span>
          </div>

          {/* Title */}
          <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-bold text-gray-900 leading-[1.1] tracking-tight">
            Pilotage intelligent des{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-shimmer">
              déchets solides municipaux
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            La plateforme SaaS qui connecte délégataires, mairies et superadmin pour une gestion
            transparente des contrats DSP de collecte des déchets en Afrique de l&apos;Ouest.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97]"
            >
              Commencer maintenant
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium px-7 py-3.5 rounded-xl text-sm transition-all duration-200"
            >
              Voir les fonctionnalités
              <ChevronDown size={16} />
            </a>
          </div>

          {/* Stats */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              { value: '5 000+', label: 'Abonnés visés' },
              { value: '12', label: 'Zones de collecte' },
              { value: '99,9 %', label: 'Disponibilité' },
              { value: '15+', label: 'Engins trackés' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 sm:p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100/50 hover:border-emerald-100 hover:bg-emerald-50/20 transition-all duration-300">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Features ────────────────────────────────────────────────────────── */
const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'Users', title: 'Registre abonnés', desc: 'Gérez vos abonnés avec import CSV, filtres avancés, historique des paiements et marquages terrain.' },
  { icon: 'TrendingUp', title: 'Recouvrement mobile money', desc: 'Tmoney, Flooz, Wave et Moov intégrés. Recouvrement automatisé avec liens de paiement et relances SMS.' },
  { icon: 'Truck', title: 'Flotte & engins', desc: 'Suivi des véhicules, signalement de pannes, gestion du carburant, planification des maintenances.' },
  { icon: 'MapPin', title: 'Tournées terrain', desc: 'Marquages avec motifs. Mode terrain mobile-friendly pour les agents de collecte.' },
  { icon: 'BarChart3', title: 'Rapports DSP', desc: 'Rapports trimestriels et annuels automatisés. KPIs temps réel pour les mairies.' },
  { icon: 'Shield', title: 'Multi-tenant sécurisé', desc: 'Isolation totale par organisation. Rôles personnalisables : admin, agent, chauffeur.' },
  { icon: 'Globe', title: 'Vue mairie', desc: 'Portail lecture seule pour les communes : KPIs, zones, flotte, activité en temps réel.' },
  { icon: 'Smartphone', title: 'Conçue pour l\'Afrique', desc: 'Interface responsive fonctionnant sur 3G/4G. Mode hors-ligne pour les zones rurales.' },
  { icon: 'Landmark', title: 'Supervision centralisée', desc: 'Tableau de bord superadmin : toutes les organisations, statistiques globales.' },
]

function Features() {
  const ref = useScrollReveal<HTMLDivElement>()
  return (
    <section id="features" className="py-16 sm:py-20 md:py-28 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 reveal">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.15em] mb-3 block">Fonctionnalités</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Tout ce dont vous avez besoin pour piloter votre DSP
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-500">
            Une plateforme complète, du terrain au rapport, conçue pour les délégataires de service public en Afrique.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((f, i) => {
            const Icon = ICONS[f.icon]
            const revealClass = `reveal reveal-delay-${(i % 3) + 1}`
            return (
              <FeatureCard key={i} icon={<Icon size={18} className="text-emerald-600" />}
                title={f.title} desc={f.desc} revealClass={revealClass} />
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, desc, revealClass }: { icon: React.ReactNode; title: string; desc: string; revealClass: string }) {
  const ref = useScrollReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`group bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/20 transition-all duration-300 ${revealClass}`}>
      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-200">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1.5 text-sm sm:text-base">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}

/* ─── Role sections ───────────────────────────────────────────────────── */
const ROLES = [
  {
    title: 'Délégataire DSP', subtitle: 'Prestataire de collecte',
    icon: 'Truck' as IconName, color: 'emerald' as const,
    features: ['Gestion des abonnés et zones', 'Recouvrement Tmoney / Flooz', 'Planification des tournées', 'Suivi flotte et consommables', 'Rapports contractuels automatisés'],
  },
  {
    title: 'Mairie / Commune', subtitle: 'Autorité délégante',
    icon: 'Landmark' as IconName, color: 'blue' as const,
    features: ['KPIs en temps réel de la collecte', 'Suivi des objectifs contractuels', 'Visualisation des zones et flotte', 'Historique des tournées', 'Transparence totale du service'],
  },
  {
    title: 'Superadmin', subtitle: 'Supervision nationale',
    icon: 'Shield' as IconName, color: 'purple' as const,
    features: ['Toutes les organisations en un coup d\'œil', 'Gestion des comptes et utilisateurs', 'Statistiques globales', 'Validation des nouveaux inscrits', 'Configuration des paramètres systèmes'],
  },
]

const COLOR_MAP: Record<string, { card: string; icon: string; badge: string }> = {
  emerald: { card: 'from-emerald-50 to-emerald-100/30 border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-600/10 text-emerald-700 border-emerald-200/50' },
  blue: { card: 'from-blue-50 to-blue-100/30 border-blue-200', icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-600/10 text-blue-700 border-blue-200/50' },
  purple: { card: 'from-purple-50 to-purple-100/30 border-purple-200', icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-600/10 text-purple-700 border-purple-200/50' },
}

function Roles() {
  const ref = useScrollReveal<HTMLDivElement>()
  return (
    <section className="py-16 sm:py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 reveal">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.15em] mb-3 block">Trois profils, une plateforme</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Conçue pour chaque acteur de la gestion des déchets
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {ROLES.map((r, i) => {
            const Icon = ICONS[r.icon]
            const c = COLOR_MAP[r.color]
            const revealClass = `reveal reveal-delay-${i + 1}`
            return (
              <RoleCard key={i} icon={<Icon size={22} />}
                title={r.title} subtitle={r.subtitle} features={r.features}
                cardStyle={c.card} iconStyle={c.icon} badgeStyle={c.badge}
                revealClass={revealClass} />
            )
          })}
        </div>
      </div>
    </section>
  )
}

function RoleCard({ icon, title, subtitle, features, cardStyle, iconStyle, badgeStyle, revealClass }: {
  icon: React.ReactNode; title: string; subtitle: string; features: string[];
  cardStyle: string; iconStyle: string; badgeStyle: string; revealClass: string
}) {
  const ref = useScrollReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`rounded-xl border bg-gradient-to-b ${cardStyle} p-6 sm:p-8 hover:shadow-lg transition-all duration-300 ${revealClass}`}>
      <div className={`w-12 h-12 rounded-xl ${iconStyle} flex items-center justify-center mb-5`}>
        {icon}
      </div>
      <div className={`inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full border mb-3 ${badgeStyle}`}>
        {subtitle}
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <ul className="mt-5 space-y-3">
        {features.map((f, j) => (
          <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
            <CheckCircle size={15} className="text-emerald-500 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Benefits ────────────────────────────────────────────────────────── */
const BENEFITS = [
  { title: 'Mobile money intégré', desc: 'Tmoney, Flooz, Wave et Moov — les moyens de paiement que vos abonnés utilisent déjà. Liens de paiement automatiques par SMS.' },
  { title: 'Mode hors-ligne', desc: 'Les agents terrain travaillent même sans connexion. Synchronisation automatique dès que le réseau revient.' },
  { title: 'Conforme aux DSP ouest-africains', desc: 'Rapports aux normes des contrats DSP de l\'UEMOA. Prêt pour les inspections et audits des communes.' },
  { title: 'Déploiement rapide', desc: 'SaaS cloud, aucune installation sur site. Vos données importées et la plateforme opérationnelle en 48h.' },
]

function Benefits() {
  const ref = useScrollReveal<HTMLDivElement>()
  const ref2 = useScrollReveal<HTMLDivElement>()
  return (
    <section id="benefits" className="py-16 sm:py-20 md:py-28 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div ref={ref} className="reveal">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.15em] mb-3 block">Pourquoi WasteFlow</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-5">
              Digitalisez votre gestion des déchets en Afrique
            </h2>
            <div className="space-y-5">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{b.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div ref={ref2} className="reveal reveal-delay-1">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Prêt à digitaliser votre DSP ?</div>
              <p className="text-emerald-100/80 text-sm sm:text-base mb-6">
                Rejoignez les communes et délégataires qui testent WasteFlow au Togo.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97]"
              >
                Créer un compte gratuit
                <ArrowRight size={16} />
              </Link>
              <div className="mt-6 pt-6 border-t border-emerald-500/30 flex items-center gap-3 text-emerald-100/80 text-xs">
                <Shield size={14} />
                <span>Hébergement sécurisé · Données chiffrées · Disponibilité 99,9 %</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ─────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: 'Délégataire', price: 'À partir de 50 000 FCFA/mois',
    features: ['Registre abonnés illimité', 'Paiements mobile money', 'Tournées et marquages', 'Gestion flotte et stocks', 'Rapports DSP automatisés', 'Support email prioritaire'],
    cta: 'Commencer', href: '/signup',
  },
  {
    name: 'Mairie', price: 'Gratuit',
    features: ['Accès vue lecture seule', 'KPIs temps réel', 'Suivi des objectifs contractuels', 'Visualisation flotte et zones', 'Rapports d\'activité', 'Accès illimité pour la commune'],
    cta: 'Accéder au portail', href: '/login', highlighted: true,
  },
  {
    name: 'Superadmin', price: 'Sur devis',
    features: ['Toutes les organisations', 'Statistiques globales', 'Gestion des comptes', 'Support prioritaire', 'Disponibilité 99,9 %', 'Formation équipe'],
    cta: 'Nous contacter', href: '#contact',
  },
]

function Pricing() {
  const ref = useScrollReveal<HTMLDivElement>()
  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 reveal">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.15em] mb-3 block">Tarifs</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Simple et transparent
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {PLANS.map((p, i) => {
            const revealClass = `reveal reveal-delay-${i + 1}`
            return (
              <PricingCard key={i} {...p} revealClass={revealClass} />
            )
          })}
        </div>
      </div>
    </section>
  )
}

function PricingCard({ name, price, features, cta, href, highlighted, revealClass }: {
  name: string; price: string; features: string[]; cta: string; href: string; highlighted?: boolean; revealClass: string
}) {
  const ref = useScrollReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`rounded-xl border p-5 sm:p-6 transition-all duration-300 ${revealClass} ${
      highlighted
        ? 'bg-emerald-700 text-white border-emerald-600 shadow-xl shadow-emerald-200/40 scale-[1.02] md:scale-105 relative'
        : 'bg-white border-gray-200 hover:border-emerald-200 hover:shadow-md'
    }`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Star size={11} />
          Recommandé
        </div>
      )}
      <div className={`font-semibold text-xs sm:text-sm mb-1 uppercase tracking-wide ${highlighted ? 'text-emerald-100' : 'text-gray-500'}`}>
        {name}
      </div>
      <div className={`text-xl sm:text-2xl font-bold mb-5 ${highlighted ? 'text-white' : 'text-gray-900'}`}>{price}</div>

      <ul className="space-y-3 mb-6">
        {features.map((f, j) => (
          <li key={j} className="flex items-start gap-2 text-xs sm:text-sm">
            <CheckCircle size={14} className={`mt-0.5 shrink-0 ${highlighted ? 'text-emerald-300' : 'text-emerald-500'}`} />
            <span className={highlighted ? 'text-emerald-50' : 'text-gray-600'}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`block text-center font-semibold text-xs sm:text-sm py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] ${
          highlighted
            ? 'bg-white text-emerald-800 hover:bg-emerald-50 shadow-sm'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

/* ─── Contact ─────────────────────────────────────────────────────────── */
function Contact() {
  const ref = useScrollReveal<HTMLDivElement>()
  return (
    <section id="contact" className="py-16 sm:py-20 md:py-28 bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div ref={ref} className="reveal">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.15em] mb-3 block">Contact</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Une question ? Un projet ?
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mb-7">
            Notre équipe vous répond sous 24h ouvrées.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="mailto:contact@fluxdechets.com"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97]"
            >
              Écrire à l&apos;équipe
              <ArrowRight size={16} />
            </a>
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium px-7 py-3.5 rounded-xl text-sm transition-all duration-200"
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ──────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Truck size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">WasteFlow</span>
            </div>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Plateforme SaaS de pilotage des contrats DSP de collecte des déchets solides municipaux — conçue au Togo pour l&apos;Afrique de l&apos;Ouest.
            </p>
          </div>
          <div>
            <div className="font-semibold text-white text-xs sm:text-sm mb-4 uppercase tracking-wide">Plateforme</div>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Inscription</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white text-xs sm:text-sm mb-4 uppercase tracking-wide">Légal</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <span>&copy; {new Date().getFullYear()} WasteFlow. DSP Déchets Solides · Togo</span>
          <span className="text-gray-700">Conçu avec ❤️ à Lomé</span>
        </div>
      </div>
    </footer>
  )
}

/* ─── Smooth scroll (anchor links) ───────────────────────────────────── */
function useSmoothScroll() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href^="#"]')
      if (!target) return
      const href = (target as HTMLAnchorElement).getAttribute('href')
      if (!href || href === '#') return
      e.preventDefault()
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  useSmoothScroll()

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Features />
      <Roles />
      <Benefits />
      <Pricing />
      <Contact />
      <Footer />
    </div>
  )
}
