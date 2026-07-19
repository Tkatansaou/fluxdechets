DROP INDEX IF EXISTS "WebhookLog_externalId_eventType_key";

CREATE UNIQUE INDEX "WebhookLog_provider_externalId_eventType_key"
ON "WebhookLog"("provider", "externalId", "eventType");
