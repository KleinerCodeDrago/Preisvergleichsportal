import { chromium, Browser, Page } from 'playwright';

export interface BrowserOptions {
    timeoutMs?: number;
    headless?: boolean;
    userAgent?: string;
}

export class PlaywrightClient {
    private browser: Browser | null = null;

    async init(options: BrowserOptions = {}): Promise<void> {
        if (this.browser) return;
        this.browser = await chromium.launch({ headless: options.headless ?? true });
    }

    async fetchPage(url: string, options: BrowserOptions = {}): Promise<Page> {
        if (!this.browser) {
            await this.init(options);
        }
        const context = await this.browser!.newContext({
            userAgent: options.userAgent,
        });
        const page = await context.newPage();
        const timeout = options.timeoutMs ?? 15000;
        await page.goto(url, { timeout, waitUntil: 'networkidle' });
        return page;
    }

    async getHtml(url: string, options: BrowserOptions = {}): Promise<string> {
        const page = await this.fetchPage(url, options);
        const html = await page.content();
        await page.context().close();
        return html;
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
