export interface GotifyConfig {
    url: string; // base URL, e.g., http://localhost:8008
    token: string;
    priority?: number; // 1-10 in GoTiFy
}

export async function sendGotify(config: GotifyConfig, title: string, message: string, extras?: Record<string, unknown>) {
    const endpoint = `${config.url.replace(/\/$/, '')}/message?token=${config.token}`;
    const payload = {
        title,
        message,
        priority: config.priority ?? 5,
        extras,
    };

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GoTiFy push failed: ${res.status} ${text}`);
    }
}
