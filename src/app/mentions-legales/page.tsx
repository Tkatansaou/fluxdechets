import { Metadata } from 'next'
import LegalLayout from '../legal-layout'

export const metadata: Metadata = {
  title: 'Mentions légales',
}

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <h2>1. Éditeur de la plateforme</h2>
      <p>
        <strong>WasteFlow</strong> est une plateforme SaaS éditée par :
      </p>
      <ul>
        <li><strong>Nom de l&apos;entreprise</strong> : Katansaou Tchaa (Entrepreneur individuel)</li>
        <li><strong>Siège</strong> : Akato-Viépé, Golfe 7, Lomé, Togo</li>
        <li><strong>BP</strong> : 4825 Lomé, Togo</li>
        <li><strong>Téléphone</strong> : +228 90 94 14 99</li>
        <li><strong>Email</strong> : <a href="mailto:contact@fluxdechets.com">contact@fluxdechets.com</a></li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>
        Katansaou Tchaa, Chargé d&apos;études au Ministère de l&apos;Environnement et des Ressources Forestières du Togo.
      </p>

      <h2>3. Hébergement</h2>
      <p>
        La plateforme est hébergée par <strong>Vercel Inc.</strong>
      </p>
      <ul>
        <li>Adresse : 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
        <li>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">https://vercel.com</a></li>
      </ul>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus de la plateforme WasteFlow (textes, graphismes, logos, icônes, code source, base de données) 
        est la propriété exclusive de l&apos;éditeur. Toute reproduction ou représentation totale ou partielle sans autorisation 
        préalable est interdite.
      </p>

      <h2>5. Protection des données</h2>
      <p>
        Conformément à la Loi n°2024-005 du 21 mars 2024 relative à la protection des données à caractère personnel 
        au Togo et au Règlement Général sur la Protection des Données (RGPD) de l&apos;Union Européenne, 
        vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données.
      </p>
      <p>
        Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@fluxdechets.com">contact@fluxdechets.com</a>
      </p>
      <p>
        Consultez notre <a href="/confidentialite">Politique de confidentialité</a> pour plus de détails.
      </p>

      <h2>6. Cookies</h2>
      <p>
        La plateforme utilise des cookies strictement nécessaires à son fonctionnement (session JWT, préférences utilisateur). 
        Aucun cookie publicitaire ou de traçage n&apos;est utilisé sans consentement explicite.
      </p>

      <h2>7. Limitation de responsabilité</h2>
      <p>
        WasteFlow s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations, mais ne saurait être tenu 
        responsable des dommages directs ou indirects résultant de l&apos;utilisation de la plateforme.
      </p>
    </LegalLayout>
  )
}
