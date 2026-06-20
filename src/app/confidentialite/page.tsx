import { Metadata } from 'next'
import LegalLayout from '../legal-layout'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
}

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <h2>1. Collecte des données</h2>
      <p>
        WasteFlow collecte les données suivantes lors de l&apos;utilisation de la plateforme :
      </p>
      <ul>
        <li><strong>Données d&apos;identification</strong> : nom, prénom, email, numéro de téléphone, fonction</li>
        <li><strong>Données organisationnelles</strong> : nom de l&apos;organisation, adresse, zone d&apos;intervention</li>
        <li><strong>Données d&apos;activité</strong> : journal de connexion, actions réalisées, rapports générés</li>
        <li><strong>Données de paiement</strong> : transactions mobile money (Tmoney, Flooz, Wave, Moov)</li>
      </ul>

      <h2>2. Base légale du traitement</h2>
      <p>
        Les données sont traitées sur la base de :
      </p>
      <ul>
        <li><strong>L&apos;exécution du contrat</strong> : gestion des abonnés, collecte et facturation</li>
        <li><strong>L&apos;obligation légale</strong> : conservation des données comptables et fiscales</li>
        <li><strong>L&apos;intérêt légitime</strong> : amélioration du service, sécurité de la plateforme</li>
        <li><strong>Le consentement</strong> : pour les cookies non essentiels et communications marketing</li>
      </ul>

      <h2>3. Destinataires des données</h2>
      <p>
        Vos données sont accessibles uniquement aux :
      </p>
      <ul>
        <li>Membres autorisés de votre organisation (selon les rôles configurés)</li>
        <li>Administrateurs de la plateforme WasteFlow</li>
        <li>Sous-traitants techniques : Vercel (hébergement), Neon (base de données), Bictorys (paiements)</li>
      </ul>
      <p>
        Aucune donnée n&apos;est vendue ou transmise à des tiers à des fins commerciales.
      </p>

      <h2>4. Durée de conservation</h2>
      <ul>
        <li><strong>Données de compte</strong> : toute la durée du contrat, et jusqu&apos;à 3 ans après la résiliation</li>
        <li><strong>Données de paiement</strong> : 10 ans (obligation fiscale)</li>
        <li><strong>Journaux de connexion</strong> : 1 an</li>
        <li><strong>Cookies de session</strong> : durée de la session</li>
      </ul>

      <h2>5. Sécurité des données</h2>
      <p>
        WasteFlow met en œuvre des mesures techniques et organisationnelles appropriées :
      </p>
      <ul>
        <li>Chiffrement des données en transit (TLS 1.3) et au repos</li>
        <li>Authentification forte (JWT + CSRF tokens)</li>
        <li>Isolation multi-tenant stricte par organisation</li>
        <li>Contrôle d&apos;accès basé sur les rôles (RBAC)</li>
        <li>Sauvegardes quotidiennes chiffrées</li>
        <li>Audit de sécurité régulier</li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>
        Conformément à la réglementation togolaise et au RGPD, vous disposez des droits suivants :
      </p>
      <ul>
        <li>Droit d&apos;accès à vos données</li>
        <li>Droit de rectification des données inexactes</li>
        <li>Droit à l&apos;effacement (droit à l&apos;oubli)</li>
        <li>Droit à la limitation du traitement</li>
        <li>Droit à la portabilité de vos données</li>
        <li>Droit d&apos;opposition au traitement</li>
      </ul>
      <p>
        Pour exercer ces droits : <a href="mailto:contact@fluxdechets.com">contact@fluxdechets.com</a>
      </p>

      <h2>7. Transferts internationaux</h2>
      <p>
        Les données sont hébergées en Europe (région Paris, France) via Vercel et Neon. 
        Des transferts vers les États-Unis peuvent avoir lieu pour les besoins techniques 
        (cache CDN, support). Ces transferts sont encadrés par les clauses contractuelles types 
        de la Commission Européenne.
      </p>
    </LegalLayout>
  )
}
