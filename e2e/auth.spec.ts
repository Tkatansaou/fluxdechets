import { test, expect } from '@playwright/test'

test.describe('Authentification', () => {
  test('redirige vers /login si non connecté', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('page login affiche le formulaire', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
  })

  test('affiche une erreur avec des identifiants invalides', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('invalide@test.com')
    await page.getByLabel(/mot de passe/i).fill('mauvais_mot_de_passe')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page.getByText(/identifiants|incorrect|invalide/i)).toBeVisible({ timeout: 5000 })
  })

  test('page de landing est accessible sans authentification', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Protection des routes', () => {
  const ROUTES_PROTEGEES = ['/dashboard', '/abonnes', '/paiements', '/tournees', '/engins', '/rapports']

  for (const route of ROUTES_PROTEGEES) {
    test(`${route} redirige vers /login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

test.describe('Santé API', () => {
  test('GET /api/health répond 200', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
  })
})
