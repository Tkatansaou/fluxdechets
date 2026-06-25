import { test, expect } from '@playwright/test'

test.describe('Page de paiement abonné (/pay/[token])', () => {
  test('affiche une erreur pour un token invalide', async ({ page }) => {
    await page.goto('/pay/token-inexistant-12345')
    await expect(
      page.getByText(/introuvable|expiré|invalide|404/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('la page de paiement est publique (pas de redirection login)', async ({ page }) => {
    await page.goto('/pay/token-test')
    await expect(page).not.toHaveURL(/\/login/)
  })
})
