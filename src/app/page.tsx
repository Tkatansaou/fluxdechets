'use client'

import Link from 'next/link'
import { Landmark, Truck, Users, TrendingUp, Shield, ChevronRight, Menu, X, CheckCircle, BarChart3, MapPin, Smartphone, Globe } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm">
                <Truck size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">WasteFlow</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Fonctionnalités</a>
              <a href="#benefits" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Avantages</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Tarifs</a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-4 py-2">
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  Essai gratuit
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <MobileMenuButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-white to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Plateforme DSP en production · Togo</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              Pilotage intelligent des{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">
                déchets solides municipaux
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              La plateforme SaaS qui connecte délégataires, mairies et superadmin pour une gestion
              transparente des contrats DSP de collecte des déchets en Afrique de l'Ouest.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors shadow-md"
              >
                Commencer maintenant
                <ChevronRight size={16} />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium px-8 py-3.5 rounded-xl text-sm transition-colors"
              >
                Voir les fonctionnalités
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: '5000+', label: 'Abonnés gérés' },
              { value: '12', label: 'Zones de collecte' },
              { value: '98%', label: 'Taux de disponibilité' },
              { value: '15+', label: 'Engins trackés' },
            ].map(s => (
              <div key={s.label} className="text-center p-4">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Fonctionnalités</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Tout ce dont vous avez besoin pour piloter votre DSP
            </h2>
            <p className="mt-4 text-gray-500">
              Une plateforme complète, du terrain au rapport, conçue pour les délégataires de service public en Afrique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Registre abonnés',
                desc: 'Gérez vos abonnés avec import CSV, filtres avancés, historique des paiements et marquages terrain.',
              },
              {
                icon: TrendingUp,
                title: 'Recouvrement mobile money',
                desc: 'Paiements Tmoney, Flooz et Moov intégrés. Recouvrement automatisé avec liens de paiement par SMS.',
              },
              {
                icon: Truck,
                title: 'Flotte & engins',
                desc: 'Suivi des véhicules, signalement de pannes, gestion du carburant, planification des maintenances.',
              },
              {
                icon: MapPin,
                title: 'Tournées terrain',
                desc: 'Marquages avec motifs (refus, absence, paiement). Mode terrain mobile-friendly pour les agents.',
              },
              {
                icon: BarChart3,
                title: 'Rapports DSP',
                desc: 'Rapports trimestriels et annuels automatisés. KPIs temps réel pour les mairies et le superadmin.',
              },
              {
                icon: Shield,
                title: 'Multi-tenant sécurisé',
                desc: 'Isolation totale par organisation. Rôles personnalisables : admin, agent, chauffeur, recouvrement.',
              },
              {
                icon: Globe,
                title: 'Vue mairie',
                desc: 'Portail lecture seule pour les communes : KPIs, zones, flotte, activité en temps réel.',
              },
              {
                icon: Smartphone,
                title: 'Mobile-first',
                desc: 'Interface responsive conçue pour le terrain. Mode terrain dédié pour les agents de collecte.',
              },
              {
                icon: Landmark,
                title: 'Supervision centralisée',
                desc: 'Tableau de bord superadmin : toutes les organisations, statistiques globales et gestion des comptes.',
              },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                    <Icon size={18} className="text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Role sections */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Trois profils, une plateforme</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Conçue pour chaque acteur de la gestion des déchets
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Délégataire DSP',
                subtitle: 'Prestataire de collecte',
                icon: Truck,
                color: 'emerald',
                features: [
                  'Gestion des abonnés et zones',
                  'Recouvrement Tmoney / Flooz',
                  'Planification des tournées',
                  'Suivi flotte et consommables',
                  'Rapports contractuels automatisés',
                ],
              },
              {
                title: 'Mairie / Commune',
                subtitle: 'Autorité délégante',
                icon: Landmark,
                color: 'blue',
                features: [
                  'KPIs en temps réel de la collecte',
                  'Suivi des objectifs contractuels',
                  'Visualisation des zones et flotte',
                  'Historique des tournées',
                  'Transparence totale du service',
                ],
              },
              {
                title: 'Superadmin',
                subtitle: 'Supervision nationale',
                icon: Shield,
                color: 'purple',
                features: [
                  'Toutes les organisations en un coup d&apos;œil',
                  'Gestion des comptes et utilisateurs',
                  'Statistiques globales',
                  'Validation des nouveaux inscrits',
                  'Configuration des paramètres systèmes',
                ],
              },
            ].map((r, i) => {
              const Icon = r.icon
              const colorMap: Record<string, string> = {
                emerald: 'from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-700',
                blue: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-700',
                purple: 'from-purple-50 to-purple-100/50 border-purple-200 text-purple-700',
              }
              const iconBg: Record<string, string> = {
                emerald: 'bg-emerald-100 text-emerald-600',
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
              }
              return (
                <div key={i} className={`rounded-xl border bg-gradient-to-b ${colorMap[r.color]} p-8`}>
                  <div className={`w-12 h-12 rounded-xl ${iconBg[r.color]} flex items-center justify-center mb-5`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{r.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-5">{r.subtitle}</p>
                  <ul className="space-y-3">
                    {r.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <CheckCircle size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section id="benefits" className="py-20 md:py-28 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Pourquoi WasteFlow</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Digitalisez votre gestion des déchets en Afrique
              </h2>
              <div className="space-y-5">
                {[
                  { title: 'Mobile money intégré', desc: 'Tmoney, Flooz et Moov sans intégration bancaire complexe. Liens de paiement par SMS.' },
                  { title: 'Disponible hors-ligne', desc: 'Les agents terrain travaillent même sans connexion. Synchronisation automatique.' },
                  { title: 'Conforme aux DSP', desc: 'Rapports aux normes des contrats DSP ouest-africains. Prêt pour les inspections mairie.' },
                  { title: 'Déploiement rapide', desc: 'SaaS cloud, aucune installation. Prêt en 24h avec vos données.' },
                ].map((b, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{b.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white">
                <div className="text-3xl font-bold mb-2">Prêt à digitaliser votre DSP ?</div>
                <p className="text-emerald-100/80 text-sm mb-6">
                  Rejoignez les délégataires et communes qui utilisent déjà WasteFlow au Togo.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
                >
                  Créer un compte gratuit
                  <ChevronRight size={16} />
                </Link>
                <div className="mt-6 pt-6 border-t border-emerald-500/30">
                  <div className="flex items-center gap-3 text-emerald-100/80 text-xs">
                    <Shield size={14} />
                    <span>Hébergement sécurisé · Données chiffrées · SLA 99.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Tarifs</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple et transparent
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              name="Délégataire"
              price="À partir de 50 000 FCFA/mois"
              features={[
                'Registre abonnés illimité',
                'Paiements mobile money',
                'Tournées et marquages',
                'Gestion flotte et stocks',
                'Rapports DSP automatisés',
                'Support email prioritaire',
              ]}
              cta="Commencer"
              href="/signup"
            />
            <PricingCard
              name="Mairie"
              price="Gratuit"
              features={[
                'Accès vue lecture seule',
                'KPIs temps réel',
                'Suivi des objectifs contractuels',
                'Visualisation flotte et zones',
                'Rapports d\'activité',
                'Accès illimité pour la commune',
              ]}
              cta="Accéder au portail"
              href="/login"
              highlighted
            />
            <PricingCard
              name="Superadmin"
              price="Sur devis"
              features={[
                'Toutes les organisations',
                'Statistiques globales',
                'Gestion des comptes',
                'Support prioritaire',
                'SLA 99.9%',
                'Formation équipe',
              ]}
              cta="Nous contacter"
              href="#contact"
            />
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section id="contact" className="py-20 md:py-28 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Contact</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Une question ? Un projet ?
          </h2>
          <p className="text-gray-500 mb-8">
            Notre équipe vous répond sous 24h ouvrées.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:contact@fluxdechets.com"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors shadow-md"
            >
              Écrire à l'équipe
            </a>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium px-8 py-3.5 rounded-xl text-sm transition-colors"
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Truck size={16} className="text-white" />
                </div>
                <span className="font-bold text-white">WasteFlow</span>
              </div>
              <p className="text-sm text-gray-500 max-w-sm">
                Plateforme SaaS de pilotage des contrats DSP de collecte des déchets solides municipaux en Afrique de l'Ouest.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white text-sm mb-4">Plateforme</div>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Inscription</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-white text-sm mb-4">Légal</div>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
            &copy; {new Date().getFullYear()} WasteFlow. DSP Déchets Solides · Togo
          </div>
        </div>
      </footer>
    </div>
  )
}

// Mobile menu button component (client-only)
function MobileMenuButton() {
  return (
    <button
      type="button"
      className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
      onClick={() => {
        const nav = document.getElementById('mobile-nav')
        if (nav) nav.classList.toggle('hidden')
      }}
    >
      <Menu size={20} />
    </button>
  )
}

function PricingCard({ name, price, features, cta, href, highlighted }: {
  name: string; price: string; features: string[]; cta: string; href: string; highlighted?: boolean
}) {
  return (
    <div className={`rounded-xl border p-6 ${
      highlighted
        ? 'bg-emerald-700 text-white border-emerald-600 shadow-lg shadow-emerald-200/40 scale-105 relative'
        : 'bg-white border-gray-200'
    }`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
          Recommandé
        </div>
      )}
      <div className={`font-semibold text-sm mb-1 ${highlighted ? 'text-emerald-100' : 'text-gray-500'}`}>{name}</div>
      <div className={`text-2xl font-bold mb-5 ${highlighted ? 'text-white' : 'text-gray-900'}`}>{price}</div>
      <ul className="space-y-3 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle size={14} className={`mt-0.5 shrink-0 ${highlighted ? 'text-emerald-300' : 'text-emerald-500'}`} />
            <span className={highlighted ? 'text-emerald-50' : 'text-gray-600'}>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={href}
        className={`block text-center font-semibold text-sm py-2.5 rounded-xl transition-colors ${
          highlighted
            ? 'bg-white text-emerald-800 hover:bg-emerald-50'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {cta}
      </a>
    </div>
  )
}
