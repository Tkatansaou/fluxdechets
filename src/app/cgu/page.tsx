import { Metadata } from 'next'
import LegalLayout from '../legal-layout'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation',
}

export default function CGU() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation">
      <h2>1. Objet</h2>
      <p>
        Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation 
        de la plateforme SaaS WasteFlow, éditée par Katansaou Tchaa.
      </p>
      <p>
        En créant un compte et en utilisant la plateforme, l&apos;Utilisateur accepte sans réserve les présentes CGU.
      </p>

      <h2>2. Définitions</h2>
      <ul>
        <li><strong>Plateforme</strong> : l&apos;application SaaS WasteFlow accessible sur fluxdechets.com</li>
        <li><strong>Utilisateur</strong> : toute personne physique ou morale utilisant la plateforme</li>
        <li><strong>Délégataire</strong> : prestataire de service public de collecte des déchets</li>
        <li><strong>Commune/Mairie</strong> : autorité délégante supervisant le contrat DSP</li>
        <li><strong>Données</strong> : informations saisies ou importées dans la plateforme</li>
      </ul>

      <h2>3. Création de compte</h2>
      <p>
        L&apos;inscription est libre et gratuite. L&apos;Utilisateur s&apos;engage à fournir des informations exactes 
        et à les maintenir à jour. Chaque compte est strictement personnel et non transférable.
      </p>
      <p>
        WasteFlow se réserve le droit de refuser ou suspendre un compte en cas de :
      </p>
      <ul>
        <li>Fausses déclarations lors de l&apos;inscription</li>
        <li>Utilisation abusive de la plateforme</li>
        <li>Non-paiement des services souscrits</li>
        <li>Violation des présentes CGU</li>
      </ul>

      <h2>4. Abonnements et tarifs</h2>
      <p>
        WasteFlow propose trois profils d&apos;accès :
      </p>
      <ul>
        <li><strong>Délégataire</strong> : abonnement payant à partir de 50 000 FCFA/mois</li>
        <li><strong>Mairie</strong> : accès gratuit en lecture seule</li>
        <li><strong>Superadmin</strong> : sur devis personnalisé</li>
      </ul>
      <p>
        Les abonnements sont mensuels, sans engagement. La résiliation est possible à tout moment.
      </p>

      <h2>5. Obligations de l&apos;Utilisateur</h2>
      <p>L&apos;Utilisateur s&apos;engage à :</p>
      <ul>
        <li>Utiliser la plateforme conformément à sa destination</li>
        <li>Ne pas tenter de contourner les mesures de sécurité</li>
        <li>Ne pas importer de données illicites ou frauduleuses</li>
        <li>Garantir l&apos;exactitude des données saisies</li>
        <li>Informater WasteFlow en cas d&apos;utilisation non autorisée de son compte</li>
      </ul>

      <h2>6. Propriété des données</h2>
      <p>
        Les données saisies par l&apos;Utilisateur dans la plateforme restent sa propriété exclusive. 
        WasteFlow agit uniquement comme sous-traitant au sens du RGPD et de la loi togolaise 
        n°2024-005 sur la protection des données.
      </p>

      <h2>7. Disponibilité et maintenance</h2>
      <p>
        WasteFlow s&apos;efforce d&apos;assurer une disponibilité de 99.9% (hors maintenance programmée). 
        Des fenêtres de maintenance peuvent être planifiées, avec notification préalable de 48h.
      </p>
      <p>
        WasteFlow ne saurait être tenu responsable des indisponibilités liées à :
      </p>
      <ul>
        <li>La défaillance des réseaux de télécommunication</li>
        <li>Les cas de force majeure</li>
        <li>Les actes de malveillance externes</li>
      </ul>

      <h2>8. Support</h2>
      <p>
        Le support est assuré par :
      </p>
      <ul>
        <li>Email : <a href="mailto:contact@fluxdechets.com">contact@fluxdechets.com</a></li>
        <li>WhatsApp : réponse sous 2h ouvrées</li>
        <li>Téléphone : +228 90 94 14 99</li>
      </ul>

      <h2>9. Droit applicable</h2>
      <p>
        Les présentes CGU sont soumises au droit togolais. Tout litige relève de la compétence 
        des tribunaux de Lomé, Togo.
      </p>
    </LegalLayout>
  )
}
