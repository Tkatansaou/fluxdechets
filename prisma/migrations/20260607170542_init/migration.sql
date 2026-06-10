-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailJob" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerName" TEXT,
    "metadata" JSONB,
    "idempotencyKey" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'bictorys',
    "providerChargeId" TEXT,
    "paymentUrl" TEXT,
    "paymentMethod" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelegataireProfil" (
    "orgId" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "commune" TEXT NOT NULL DEFAULT 'Commune de Vo1 (Vogan)',
    "numContrat" TEXT NOT NULL DEFAULT 'DSP-VO1-2024-001',
    "dateContrat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objectifAbonnes" INTEGER NOT NULL DEFAULT 900,
    "objectifRecouvrement" INTEGER NOT NULL DEFAULT 80,
    "objectifCollecte" INTEGER NOT NULL DEFAULT 99,
    "paygateApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelegataireProfil_pkey" PRIMARY KEY ("orgId")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "frequenceCollecte" TEXT NOT NULL DEFAULT 'bi-hebdomadaire',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abonne" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'impayé',
    "frequenceCollecte" TEXT NOT NULL DEFAULT 'bi-hebdomadaire',
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "lienPaiementToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Abonne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "abonneId" TEXT NOT NULL,
    "agentId" TEXT,
    "montant" INTEGER NOT NULL,
    "moyen" TEXT NOT NULL,
    "operateur" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'validé',
    "reference" TEXT NOT NULL,
    "moisConcerne" TEXT NOT NULL,
    "orderId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engin" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "immatriculation" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "marque" TEXT,
    "modele" TEXT,
    "annee" INTEGER,
    "statut" TEXT NOT NULL DEFAULT 'opérationnel',
    "kilometrage" INTEGER NOT NULL DEFAULT 0,
    "dateAcquisition" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournee" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "chauffeurId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'planifiée',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marquage" (
    "id" TEXT NOT NULL,
    "tourneeId" TEXT NOT NULL,
    "abonneId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en-attente',
    "motif" TEXT,
    "motifDetail" TEXT,
    "heureMarquage" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Marquage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "cout" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,
    "prestataire" TEXT,
    "kilometrageLors" INTEGER,
    "prochainKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carburant" (
    "id" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "agentId" TEXT,
    "litres" DOUBLE PRECISION NOT NULL,
    "cout" INTEGER NOT NULL,
    "kilometrage" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Carburant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanneEngin" (
    "id" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'ouverte',
    "coutReparation" INTEGER,
    "dateResolution" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PanneEngin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consommable" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "stockActuel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seuilAlerte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prixUnitaire" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consommable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementStock" (
    "id" TEXT NOT NULL,
    "consommableId" TEXT NOT NULL,
    "agentId" TEXT,
    "type" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rapport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "trimestre" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "donnees" JSONB NOT NULL DEFAULT '{}',
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rapport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "AdminAction_actorId_createdAt_idx" ON "AdminAction"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_action_createdAt_idx" ON "AdminAction"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "VerificationCode_userId_type_idx" ON "VerificationCode"("userId", "type");

-- CreateIndex
CREATE INDEX "VerificationCode_code_type_idx" ON "VerificationCode"("code", "type");

-- CreateIndex
CREATE INDEX "WebhookLog_provider_createdAt_idx" ON "WebhookLog"("provider", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookLog_externalId_eventType_key" ON "WebhookLog"("externalId", "eventType");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_scheduledAt_idx" ON "OutboxEvent"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "EmailJob_status_scheduledAt_idx" ON "EmailJob"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_providerChargeId_key" ON "Order"("providerChargeId");

-- CreateIndex
CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Order_provider_providerChargeId_idx" ON "Order"("provider", "providerChargeId");

-- CreateIndex
CREATE INDEX "Zone_orgId_idx" ON "Zone"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Abonne_lienPaiementToken_key" ON "Abonne"("lienPaiementToken");

-- CreateIndex
CREATE INDEX "Abonne_zoneId_idx" ON "Abonne"("zoneId");

-- CreateIndex
CREATE INDEX "Abonne_telephone_idx" ON "Abonne"("telephone");

-- CreateIndex
CREATE INDEX "Abonne_statut_idx" ON "Abonne"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_reference_key" ON "Paiement"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_orderId_key" ON "Paiement"("orderId");

-- CreateIndex
CREATE INDEX "Paiement_abonneId_idx" ON "Paiement"("abonneId");

-- CreateIndex
CREATE INDEX "Paiement_moisConcerne_idx" ON "Paiement"("moisConcerne");

-- CreateIndex
CREATE INDEX "Paiement_statut_idx" ON "Paiement"("statut");

-- CreateIndex
CREATE INDEX "Engin_orgId_idx" ON "Engin"("orgId");

-- CreateIndex
CREATE INDEX "Engin_statut_idx" ON "Engin"("statut");

-- CreateIndex
CREATE INDEX "Tournee_zoneId_idx" ON "Tournee"("zoneId");

-- CreateIndex
CREATE INDEX "Tournee_date_idx" ON "Tournee"("date");

-- CreateIndex
CREATE INDEX "Tournee_statut_idx" ON "Tournee"("statut");

-- CreateIndex
CREATE INDEX "Marquage_tourneeId_idx" ON "Marquage"("tourneeId");

-- CreateIndex
CREATE INDEX "Marquage_abonneId_idx" ON "Marquage"("abonneId");

-- CreateIndex
CREATE UNIQUE INDEX "Marquage_tourneeId_abonneId_key" ON "Marquage"("tourneeId", "abonneId");

-- CreateIndex
CREATE INDEX "Maintenance_enginId_idx" ON "Maintenance"("enginId");

-- CreateIndex
CREATE INDEX "Carburant_enginId_idx" ON "Carburant"("enginId");

-- CreateIndex
CREATE INDEX "PanneEngin_enginId_idx" ON "PanneEngin"("enginId");

-- CreateIndex
CREATE INDEX "PanneEngin_statut_idx" ON "PanneEngin"("statut");

-- CreateIndex
CREATE INDEX "Consommable_orgId_idx" ON "Consommable"("orgId");

-- CreateIndex
CREATE INDEX "MouvementStock_consommableId_idx" ON "MouvementStock"("consommableId");

-- CreateIndex
CREATE INDEX "Rapport_orgId_idx" ON "Rapport"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Rapport_orgId_trimestre_annee_key" ON "Rapport"("orgId", "trimestre", "annee");

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegataireProfil" ADD CONSTRAINT "DelegataireProfil_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "DelegataireProfil"("orgId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abonne" ADD CONSTRAINT "Abonne_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_abonneId_fkey" FOREIGN KEY ("abonneId") REFERENCES "Abonne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engin" ADD CONSTRAINT "Engin_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "DelegataireProfil"("orgId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "Engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournee" ADD CONSTRAINT "Tournee_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marquage" ADD CONSTRAINT "Marquage_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marquage" ADD CONSTRAINT "Marquage_abonneId_fkey" FOREIGN KEY ("abonneId") REFERENCES "Abonne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "Engin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carburant" ADD CONSTRAINT "Carburant_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "Engin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carburant" ADD CONSTRAINT "Carburant_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanneEngin" ADD CONSTRAINT "PanneEngin_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "Engin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consommable" ADD CONSTRAINT "Consommable_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "DelegataireProfil"("orgId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_consommableId_fkey" FOREIGN KEY ("consommableId") REFERENCES "Consommable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rapport" ADD CONSTRAINT "Rapport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "DelegataireProfil"("orgId") ON DELETE CASCADE ON UPDATE CASCADE;
