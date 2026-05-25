import type * as Party from 'partykit/server';

type DrawEvent =
	| { type: 'stroke'; x1: number; y1: number; x2: number; y2: number; color: string; size: number; tool: string; opacity?: number }
	| { type: 'dot'; x: number; y: number; color: string; size: number; tool: string; opacity?: number };

// R2: snapshot JPEG per room (geen groottelimiet)
// DO: since-strokes sinds laatste snapshot (max 100, klein genoeg voor 128 KB limiet)
const SINCE_KEY = 'since';
const SNAPSHOT_TS_KEY = 'snapshot-ts';
const MAX_SINCE = 100;

// Legacy DO keys — alleen voor eenmalige migratie naar R2
const LEGACY_SNAPSHOT_KEY = 'snapshot';
const LEGACY_STROKES_KEY = 'strokes';

export default class KleurplaatServer implements Party.Server {
	private loaded = false;
	private snapshot: string | null = null;
	private snapshotTs: number = 0;
	private since: DrawEvent[] = [];

	constructor(readonly room: Party.Room) {}

	private get bucket(): R2Bucket | undefined {
		return (this.room as any).env?.SNAPSHOTS as R2Bucket | undefined;
	}

	private async load() {
		if (this.loaded) return;

		// 1. Laad snapshot uit R2 (geen groottelimiet)
		if (this.bucket) {
			const obj = await this.bucket.get(this.room.id);
			if (obj) {
				this.snapshot = await obj.text();
			}
		}

		// 2. Geen R2-snapshot → kijk in DO (eenmalige migratie van oude data)
		if (!this.snapshot) {
			const legacySnapshot = await this.room.storage.get<string>(LEGACY_SNAPSHOT_KEY);
			if (legacySnapshot) {
				this.snapshot = legacySnapshot;
				if (this.bucket) {
					await this.bucket.put(this.room.id, this.snapshot);
					await this.room.storage.delete(LEGACY_SNAPSHOT_KEY);
				}
			}
		}

		// 3. Timestamp van de laatste snapshot
		this.snapshotTs = (await this.room.storage.get<number>(SNAPSHOT_TS_KEY)) ?? 0;

		// 4. Since-strokes uit DO (klein, past altijd binnen 128 KB)
		this.since = (await this.room.storage.get<DrawEvent[]>(SINCE_KEY)) ?? [];

		// 5. Legacy: alleroudste 'strokes'-key als er niks anders is
		if (!this.snapshot && this.since.length === 0) {
			const legacy = (await this.room.storage.get<DrawEvent[]>(LEGACY_STROKES_KEY)) ?? [];
			if (legacy.length > 0) {
				this.since = legacy;
				await this.room.storage.delete(LEGACY_STROKES_KEY);
			}
		}

		this.loaded = true;
	}

	async onConnect(conn: Party.Connection) {
		await this.load();
		conn.send(JSON.stringify({
			type: 'state',
			snapshot: this.snapshot,
			strokes: this.since,
			savedAt: this.snapshotTs,
		}));
	}

	async onMessage(message: string, sender: Party.Connection) {
		await this.load();
		const event = JSON.parse(message) as any;

		if (event.type === 'clear') return;

		if (event.type === 'snapshot') {
			this.snapshot = event.data;
			this.since = [];
			this.snapshotTs = Date.now();

			// Sla op in R2 — geen 128 KB limiet
			if (this.bucket) {
				try {
					await this.bucket.put(this.room.id, this.snapshot!);
				} catch {
					// R2 onbereikbaar — snapshot blijft in-memory tot volgende herstart
				}
			}

			// Wis since-strokes in DO en sla timestamp op
			try {
				await this.room.storage.put(SINCE_KEY, []);
				await this.room.storage.put(SNAPSHOT_TS_KEY, this.snapshotTs);
			} catch {
				// ignore
			}

			return; // niet broadcasten
		}

		if (event.type === 'stroke' || event.type === 'dot') {
			this.since.push(event);
			if (this.since.length > MAX_SINCE) this.since = this.since.slice(-MAX_SINCE);
			try {
				await this.room.storage.put(SINCE_KEY, this.since);
			} catch {
				// ignore
			}
			this.room.broadcast(message, [sender.id]);
		}
	}
}
