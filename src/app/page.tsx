'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Truck, Menu, X, ChevronRight, CheckCircle, BarChart3, MapPin, Smartphone, Globe, Users, TrendingUp, Shield, Star, ArrowUpRight, Phone, Mail } from 'lucide-react'

const stats = [
  { value: '5 000+', label: 'Abonnés gérés' },
  { value: '98%', label: 'Taux de disponibilité' },
  { value: '15+', label: 'Engins trackés' },
  { value: '12', label: 'Zones de collecte' },
]

const features = [
  {
    icon: Users,
    title: 'Registre abonnés',
    desc: 'Gérez vos abonnés avec import CSV, filtres avancés, historique des paiements et marquages terrain en temps réel.',
  },
  {
    icon: TrendingUp,
    title: 'Recouvrement mobile money',
    desc: 'Tmoney, Flooz, Moov, Wave — paiements intégrés. Liens de paiement automatiques par SMS et relances.',
  },
  {
    icon: Truck,
    title: 'Flotte & engins',
    desc: 'Suivi GPS, signalement de pannes, gestion carburant et planification des maintenances préventives.',
  },
  {
    icon: MapPin,
    title: 'Tournées terrain',
    desc: 'Marquages avec motifs (refus, absence, paiement). Interface mobile-friendly pour les agents de collecte.',
  },
  {
    icon: BarChart3,
    title: 'Rapports DSP automatisés',
    desc: 'Rapports trimestriels et annuels conformes aux normes des contrats DSP ouest-africains.',
  },
  {
    icon: Shield,
    title: 'Sécurité multi-tenant',
    desc: 'Isolation totale par organisation. Rôles personnalisables : superadmin, admin, agent, chauffeur.',
  },
  {
    icon: Globe,
    title: 'Portail mairie',
    desc: 'Accès lecture seule pour les communes : KPIs temps réel, visualisation des zones et de l\'activité.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first',
    desc: 'Interface entièrement responsive. Mode terrain dédié pour les agents. Fonctionne hors-ligne.',
  },
  {
    icon: Star,
    title: 'Supervision centralisée',
    desc: 'Tableau de bord unique pour le superadmin : toutes les organisations, statistiques globales.',
  },
]

const benefits = [
  { title: 'Mobile money intégré', desc: 'Tmoney, Flooz, Wave et Moov — sans intégration bancaire complexe. Liens de paiement automatiques par SMS.' },
  { title: 'Conforme aux DSP africains', desc: 'Rapports aux normes des contrats DSP ouest-africains. Prêt pour les inspections et audits.' },
  { title: 'Déploiement en 48h', desc: 'SaaS cloud, hébergement sécurisé. Aucune installation. Vos données importées en 48h.' },
  { title: 'Support local', desc: 'Équipe basée en Afrique de l\'Ouest. Support WhatsApp, email et téléphone. Temps de réponse < 2h.' },
]

const roles = [
  {
    title: 'Délégataire DSP',
    subtitle: 'Pilotez votre contrat de collecte',
    icon: Truck,
    gradient: 'from-[#533afd] to-[#7c5cff]',
    features: [
      'Registre abonnés et zones',
      'Recouvrement digital automatisé',
      'Gestion flotte et tournées',
      'Rapports contractuels',
    ],
  },
  {
    title: 'Mairie / Commune',
    subtitle: 'Supervisez votre délégataire',
    icon: Landmark,
    gradient: 'from-[#061b31] to-[#0d2b4f]',
    features: [
      'KPIs temps réel de la collecte',
      'Suivi des objectifs contractuels',
      'Visualisation des zones et flotte',
      'Transparence totale du service',
    ],
  },
  {
    title: 'Superadmin',
    subtitle: 'Vision nationale',
    icon: Shield,
    gradient: 'from-[#1c1e54] to-[#2a2d7c]',
    features: [
      'Toutes les organisations',
      'Statistiques et alertes globales',
      'Gestion des comptes et rôles',
      'Configuration centralisée',
    ],
  },
]

const pricing = [
  {
    name: 'Délégataire',
    price: '50 000 FCFA/mois',
    period: 'par organisation',
    features: [
      'Abonnés illimités',
      'Paiements mobile money',
      'Tournées et marquages terrain',
      'Gestion flotte et stocks',
      'Rapports DSP automatisés',
      'Support prioritaire',
    ],
    cta: 'Créer un compte',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Mairie',
    price: 'Gratuit',
    period: 'pour les communes',
    features: [
      'Portail lecture seule',
      'KPIs et objectifs temps réel',
      'Visualisation complète',
      'Utilisateurs illimités',
      'Alertes et notifications',
      'Accès immédiat',
    ],
    cta: 'Accéder au portail',
    href: '/login',
    featured: true,
  },
  {
    name: 'Superadmin',
    price: 'Sur devis',
    period: 'consultation personnalisée',
    features: [
      'Toutes les organisations',
      'Statistiques globales',
      'Gestion des comptes',
      'SLA 99.9%',
      'Support dédié 24/7',
      'Formation et accompagnement',
    ],
    cta: 'Nous contacter',
    href: '#contact',
    featured: false,
  },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const navLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Profils', href: '#profiles' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <>
      {/* Global styles for Stripe-inspired fonts and smooth scroll */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        * {
          font-feature-settings: 'cv01', 'ss03';
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-[#fafafa]">
        {/* ===== NAVIGATION ===== */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-[72px]">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#533afd] to-[#7c5cff] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <Truck size={18} className="text-white" />
                </div>
                <span className="text-[17px] font-semibold text-[#061b31] tracking-tight">fluxdechets.com</span>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-[14px] font-medium text-[#4a5a6e] hover:text-[#061b31] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex items-center gap-3 ml-2">
                  <Link
                    href="/login"
                    className="text-[14px] font-medium text-[#4a5a6e] hover:text-[#533afd] transition-colors px-4 py-2"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white bg-[#533afd] hover:bg-[#4434d4] px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    Essai gratuit
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </nav>

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {menuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl">
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2.5 text-[15px] font-medium text-[#4a5a6e] hover:text-[#533afd] hover:bg-purple-50 rounded-lg transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-3 space-y-2">
                  <Link
                    href="/login"
                    className="block text-center text-[15px] font-medium text-[#4a5a6e] border border-gray-200 rounded-lg px-4 py-2.5 hover:border-gray-300 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-center text-[15px] font-semibold text-white bg-[#533afd] rounded-lg px-4 py-2.5 hover:bg-[#4434d4] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Essai gratuit
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* ===== HERO SECTION ===== */}
        <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
          {/* Decorative backgrounds — gentle purple/magenta gradients like Stripe */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50/40 via-white to-white pointer-events-none" />
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-[#533afd]/8 to-[#f96bee]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-[#533afd]/5 to-[#ea2261]/3 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-purple-100 rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#533afd] animate-pulse" />
                <span className="text-[12px] font-medium text-[#533afd]">SaaS de pilotage DSP</span>
              </div>

              <h1 className="text-[42px] sm:text-[52px] lg:text-[64px] font-light leading-[1.08] tracking-[-1.4px] text-[#061b31]">
                Pilotage intelligent des{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#533afd] to-[#f96bee]">
                  déchets solides municipaux
                </span>
              </h1>

              <p className="mt-5 text-[17px] sm:text-[18px] font-light leading-[1.6] text-[#4a5a6e] max-w-xl mx-auto">
                La plateforme SaaS qui connecte délégataires, mairies et autorités pour une gestion
                transparente des contrats DSP de collecte des déchets en Afrique.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-[#533afd] hover:bg-[#4434d4] px-7 py-3 rounded-lg transition-colors shadow-sm"
                >
                  Commencer gratuitement
                  <ArrowUpRight size={15} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#4a5a6e] bg-white border border-gray-200 hover:border-[#533afd]/30 hover:text-[#533afd] px-7 py-3 rounded-lg transition-all"
                >
                  En savoir plus
                  <ChevronRight size={15} />
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 max-w-3xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 rounded-xl overflow-hidden">
                {stats.map((s) => (
                  <div key={s.label} className="bg-white px-5 py-6 text-center">
                    <div className="text-[28px] sm:text-[32px] font-light text-[#061b31] tracking-tight">{s.value}</div>
                    <div className="text-[12px] font-medium text-[#64748d] mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURES SECTION ===== */}
        <section id="features" className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-16">
              <div className="text-[11px] font-semibold text-[#533afd] uppercase tracking-[0.12em] mb-4">Fonctionnalités</div>
              <h2 className="text-[32px] sm:text-[40px] font-light leading-[1.1] tracking-[-0.64px] text-[#061b31]">
                Tout pour piloter votre DSP
              </h2>
              <p className="mt-4 text-[15px] font-light leading-[1.6] text-[#4a5a6e]">
                Une plateforme complète, du terrain au rapport, conçue pour les délégataires
                de service public en Afrique de l'Ouest.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <div
                    key={i}
                    className="group bg-white border border-gray-100 rounded-xl px-6 py-7 hover:border-[#533afd]/20 hover:shadow-[rgba(50,50,93,0.15)_0px_30px_45px_-30px,rgba(0,0,0,0.06)_0px_18px_36px_-18px] transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-100 group-hover:border-purple-200 transition-all">
                      <Icon size={18} className="text-[#533afd]" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#061b31] mb-2">{f.title}</h3>
                    <p className="text-[14px] font-light leading-[1.6] text-[#64748d]">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== ROLES SECTION (3 profils) ===== */}
        <section id="profiles" className="py-20 md:py-28 bg-[#f5f6f8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-16">
              <div className="text-[11px] font-semibold text-[#533afd] uppercase tracking-[0.12em] mb-4">Trois profils</div>
              <h2 className="text-[32px] sm:text-[40px] font-light leading-[1.1] tracking-[-0.64px] text-[#061b31]">
                Conçue pour chaque acteur
              </h2>
              <p className="mt-4 text-[15px] font-light leading-[1.6] text-[#4a5a6e]">
                Que vous soyez prestataire, commune ou autorité de supervision, fluxdechets.com
                s'adapte à votre rôle.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {roles.map((role, i) => {
                const Icon = role.icon
                return (
                  <div
                    key={i}
                    className="rounded-xl bg-white border border-gray-100 overflow-hidden hover:shadow-[rgba(50,50,93,0.15)_0px_30px_45px_-30px,rgba(0,0,0,0.06)_0px_18px_36px_-18px] transition-all duration-300"
                  >
                    <div className={`p-6 text-white bg-gradient-to-br ${role.gradient}`}>
                      <div className="w-11 h-11 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4">
                        <Icon size={20} />
                      </div>
                      <h3 className="text-[18px] font-semibold tracking-tight">{role.title}</h3>
                      <p className="text-[13px] text-white/70 mt-1 font-light">{role.subtitle}</p>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-3">
                        {role.features.map((f, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-[14px] font-light text-[#4a5a6e]">
                            <CheckCircle size={15} className="text-[#533afd] mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== BENEFITS SECTION ===== */}
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="text-[11px] font-semibold text-[#533afd] uppercase tracking-[0.12em] mb-4">Pourquoi fluxdechets.com</div>
                <h2 className="text-[32px] sm:text-[40px] font-light leading-[1.1] tracking-[-0.64px] text-[#061b31] mb-6">
                  La première plateforme DSP conçue pour l'Afrique
                </h2>
                <div className="space-y-6">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle size={16} className="text-[#533afd]" />
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-[#061b31]">{b.title}</div>
                        <div className="text-[14px] font-light text-[#64748d] mt-0.5 leading-relaxed">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Card */}
              <div className="relative">
                <div className="bg-gradient-to-br from-[#1c1e54] to-[#2a2d7c] rounded-2xl p-8 sm:p-10 text-white shadow-[rgba(50,50,93,0.3)_0px_30px_45px_-30px,rgba(0,0,0,0.15)_0px_18px_36px_-18px]">
                  <div className="text-[28px] font-light tracking-tight mb-3">
                    Prêt à digitaliser votre DSP&nbsp;?
                  </div>
                  <p className="text-[14px] font-light text-purple-200/80 mb-7 leading-relaxed">
                    Rejoignez les délégataires et communes qui utilisent déjà fluxdechets.com au Togo.
                    Déploiement en 48h, accompagnement personnalisé.
                  </p>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1c1e54] bg-white hover:bg-purple-50 px-6 py-3 rounded-lg transition-colors"
                  >
                    Créer un compte gratuit
                    <ArrowUpRight size={15} />
                  </Link>
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2.5 text-[12px] text-purple-200/60">
                      <Shield size={13} />
                      <span>Données chiffrées · Hébergement sécurisé · SLA 99.9%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRICING SECTION ===== */}
        <section id="pricing" className="py-20 md:py-28 bg-[#f5f6f8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-16">
              <div className="text-[11px] font-semibold text-[#533afd] uppercase tracking-[0.12em] mb-4">Tarifs</div>
              <h2 className="text-[32px] sm:text-[40px] font-light leading-[1.1] tracking-[-0.64px] text-[#061b31]">
                Simple et transparent
              </h2>
              <p className="mt-4 text-[15px] font-light leading-[1.6] text-[#4a5a6e]">
                Des tarifs adaptés à chaque profil, sans engagement, sans surprise.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricing.map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl border p-6 sm:p-7 ${
                    plan.featured
                      ? 'bg-[#533afd] text-white border-[#533afd] shadow-[rgba(83,58,253,0.3)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#f96bee] text-white text-[11px] font-semibold px-3.5 py-1 rounded-full whitespace-nowrap">
                      Recommandé
                    </div>
                  )}
                  <div className={`text-[12px] font-medium mb-1 ${plan.featured ? 'text-purple-200' : 'text-[#64748d]'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-[28px] font-light tracking-tight ${plan.featured ? 'text-white' : 'text-[#061b31]'}`}>
                    {plan.price}
                  </div>
                  <div className={`text-[12px] font-light mt-0.5 mb-6 ${plan.featured ? 'text-purple-200/60' : 'text-[#8a8f98]'}`}>
                    {plan.period}
                  </div>
                  <ul className="space-y-3 mb-7">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-[13px]">
                        <CheckCircle
                          size={14}
                          className={`mt-0.5 shrink-0 ${plan.featured ? 'text-purple-300' : 'text-[#533afd]'}`}
                        />
                        <span className={plan.featured ? 'text-purple-50' : 'text-[#4a5a6e]'}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={plan.href}
                    className={`block text-center text-[14px] font-semibold py-2.5 rounded-lg transition-colors ${
                      plan.featured
                        ? 'bg-white text-[#533afd] hover:bg-purple-50'
                        : 'bg-[#061b31] text-white hover:bg-[#0d2b4f]'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CONTACT SECTION ===== */}
        <section id="contact" className="py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-[11px] font-semibold text-[#533afd] uppercase tracking-[0.12em] mb-4">Contact</div>
            <h2 className="text-[32px] sm:text-[40px] font-light leading-[1.1] tracking-[-0.64px] text-[#061b31] mb-4">
              Parlons de votre projet
            </h2>
            <p className="text-[15px] font-light text-[#4a5a6e] mb-10 max-w-md mx-auto leading-relaxed">
              Une question, un déploiement, un partenariat ? Notre équipe vous répond sous 24h.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:contact@fluxdechets.com"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-white bg-[#533afd] hover:bg-[#4434d4] px-7 py-3 rounded-lg transition-colors shadow-sm"
              >
                <Mail size={15} />
                Écrire à l'équipe
              </a>
              <a
                href="tel:+22890000000"
                className="inline-flex items-center gap-2 text-[14px] font-medium text-[#4a5a6e] bg-white border border-gray-200 hover:border-[#533afd]/30 hover:text-[#533afd] px-7 py-3 rounded-lg transition-all"
              >
                <Phone size={15} />
                Appeler
              </a>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="bg-[#061b31] text-gray-400 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#533afd] to-[#7c5cff] flex items-center justify-center">
                    <Truck size={16} className="text-white" />
                  </div>
                  <span className="font-semibold text-white tracking-tight">fluxdechets.com</span>
                </div>
                <p className="text-[13px] font-light text-gray-500 max-w-xs leading-relaxed">
                  Plateforme SaaS de pilotage des contrats DSP de collecte des déchets solides
                  municipaux en Afrique de l'Ouest.
                </p>
                <div className="flex items-center gap-4 mt-5">
                  <span className="text-[11px] text-gray-600">Togo · Cotonou · Abidjan</span>
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white mb-4">Plateforme</div>
                <ul className="space-y-2.5 text-[13px] font-light">
                  <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                  <li><a href="#profiles" className="hover:text-white transition-colors">Profils</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
                  <li><Link href="/signup" className="hover:text-white transition-colors">Inscription</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white mb-4">Légal</div>
                <ul className="space-y-2.5 text-[13px] font-light">
                  <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">RGPD</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-gray-600">
                &copy; {mounted ? new Date().getFullYear() : 2026} fluxdechets.com. DSP Déchets Solides.
              </div>
              <div className="flex items-center gap-5 text-[11px] text-gray-600">
                <span>Propulsé depuis Lomé, Togo</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

function Landmark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9v.01" />
      <path d="M9 12v.01" />
      <path d="M9 15v.01" />
      <path d="M9 18v.01" />
    </svg>
  )
}
