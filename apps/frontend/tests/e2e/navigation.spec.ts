import { expect, test } from '@playwright/test';

const mockHealthResponse = {
  status: 'ok',
  uptimeMs: 125000,
  timestamp: '2024-01-01T12:34:56.000Z',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class MockWebSocket {
      private listeners: Record<string, ((event: unknown) => void)[]> = {};
      public readyState = 1;
      public url: string;

      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.dispatchEvent('open', new Event('open'));
        }, 0);
      }

      addEventListener(type: string, listener: (event: unknown) => void) {
        this.listeners[type] = this.listeners[type] ?? [];
        this.listeners[type].push(listener);
      }

      removeEventListener(type: string, listener: (event: unknown) => void) {
        const registered = this.listeners[type];
        if (!registered) {
          return;
        }
        const index = registered.indexOf(listener);
        if (index >= 0) {
          registered.splice(index, 1);
        }
      }

      dispatchEvent(type: string, event: unknown) {
        const registered = this.listeners[type];
        if (!registered) {
          return;
        }
        for (const listener of [...registered]) {
          listener(event);
        }
      }

      send() {}

      close() {
        this.readyState = 3;
        this.dispatchEvent('close', new Event('close'));
      }
    }

    Object.defineProperty(window, 'WebSocket', {
      configurable: true,
      writable: true,
      value: MockWebSocket,
    });
  });

  await page.route('**/api/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockHealthResponse),
    });
  });
});

test('displays the dashboard with API health details', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Legendary Dollop' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Dashboard' })).toBeVisible();

  const statusPill = page.locator('.status-card .status-pill').first();
  await expect(statusPill).toHaveText('ok');

  await expect(page.getByText('Uptime: 2m 5s')).toBeVisible();
  await expect(page.getByText('No response events received yet.', { exact: true })).toBeVisible();
});

test('navigates to the WebSocket test lab from the header', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'WebSocket Test' }).click();
  await expect(page).toHaveURL(/\/websocket-test$/);
  await expect(page.getByRole('heading', { level: 2, name: 'WebSocket Test Lab' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send 10 dummy events' })).toBeVisible();
});
