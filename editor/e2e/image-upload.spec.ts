import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

import { E2E_PASSWORD } from './credentials'

const FIXTURE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'tiny.png',
)

async function login(page: Page) {
  await page.goto('/')
  await expect(page.getByLabel('Editor password')).toBeVisible({
    timeout: 20_000,
  })
  await page.getByLabel('Editor password').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: /open editor/i }).click()
  await expect(page.getByText('Media desk')).toBeVisible({ timeout: 20_000 })
}

test.describe('image attach (Firefox)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear()
      } catch {
        /* ignore */
      }
    })
    await login(page)
  })

  test('file input attaches and inserts an image', async ({ page }) => {
    const fileInput = page.locator('.media-desk-file-input')
    await expect(fileInput).toBeAttached()

    await fileInput.setInputFiles(FIXTURE)

    await expect(page.locator('.image-card').first()).toBeVisible()
    await expect(page.locator('.image-card strong').first()).toHaveText(
      /tiny\.png/i,
    )

    const editor = page.locator('.cm-content').first()
    await expect(editor).toContainText(/asset:tiny\.png/i)
  })

  test('dropping a file onto the media desk attaches it', async ({ page }) => {
    const png = readFileSync(FIXTURE)
    const dropZone = page.locator('.drop-zone')

    await dropZone.evaluate(async (zone, bytes) => {
      const file = new File([new Uint8Array(bytes)], 'drop-shot.png', {
        type: 'image/png',
        lastModified: Date.now(),
      })
      const dt = new DataTransfer()
      dt.items.add(file)

      for (const type of ['dragenter', 'dragover', 'drop'] as const) {
        zone.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
          }),
        )
      }
    }, [...png])

    await expect(page.locator('.image-card').first()).toBeVisible()
    await expect(page.locator('.image-card strong').first()).toHaveText(
      /drop-shot\.png/i,
    )
  })

  test('pasting an image into the editor attaches it', async ({ page }) => {
    const png = readFileSync(FIXTURE)
    const editor = page.locator('.cm-content').first()
    await editor.click()

    await page.evaluate(async (bytes) => {
      const file = new File([new Uint8Array(bytes)], '', {
        type: 'image/png',
        lastModified: Date.now(),
      })
      const dt = new DataTransfer()
      dt.items.add(file)

      const target = document.querySelector('.cm-content')
      if (!target) throw new Error('no editor')

      const event = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt,
      })
      Object.defineProperty(event, 'clipboardData', { get: () => dt })
      target.dispatchEvent(event)
    }, [...png])

    await expect(page.locator('.image-card').first()).toBeVisible()
    await expect(page.locator('.image-card strong').first()).toHaveText(
      /image(?:-\d+)?\.png/i,
    )
  })

  test('choose label opens the file chooser', async ({ page }) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10_000 }),
      page.locator('.media-desk-choose').click(),
    ])

    expect(fileChooser.isMultiple()).toBe(true)
    await fileChooser.setFiles(FIXTURE)

    await expect(page.locator('.image-card').first()).toBeVisible()
    await expect(page.locator('.image-card strong').first()).toHaveText(
      /tiny\.png/i,
    )
  })
})
