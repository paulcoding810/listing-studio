import { expect, test } from '@playwright/test'

test('apply a template, edit, and export a validated ZIP', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/#/templates')
  const card = page.locator('text=Clean Minimal').locator('xpath=ancestor::div[contains(@class,"group")][1]')
  await card.hover()
  await card.getByRole('button', { name: 'Use template' }).click()
  await page.waitForURL(/#\/editor\//)
  await expect(page.getByText('Meets Google Play requirements')).toBeVisible()

  const box = (await page.locator('canvas').first().boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.65)
  await page.keyboard.press('ControlOrMeta+d')
  await page.keyboard.press('ControlOrMeta+z')

  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export \d+ images as ZIP/ }).click()
  expect((await download).suggestedFilename()).toMatch(/\.zip$/)

  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Clean Minimal')
  expect(errors).toEqual([])
})
