import type * as Party from 'partykit/server';

type DrawEvent =
	| { type: 'stroke'; x1: number; y1: number; x2: number; y2: number; color: string; size: number; tool: string }
	| { type: 'dot'; x: number; y: number; color: string; size: number; tool: string };

const SNAPSHOT_KEY = 'snapshot'; // base64 JPEG van de huidige canvas staat
const SINCE_KEY = 'since';       // strokes sinds laatste snapshot (max 100)
const LEGACY_KEY = 'strokes';    // oude storage key, voor migratie
const MAX_SINCE = 100;

export default class KleurplaatServer implements Party.Server {
	private loaded = false;
	private snapshot: string | null = null;
	private since: DrawEvent[] = [];
	private legacy: DrawEvent[] | null = null;

	constructor(readonly room: Party.Room) {}

	private async load() {
		if (this.loaded) return;
		this.snapshot = (await this.room.storage.get<string>(SNAPSHOT_KEY)) ?? null;
		this.since = (await this.room.storage.get<DrawEvent[]>(SINCE_KEY)) ?? [];
		if (!this.snapshot && this.since.length === 0) {
			// Eenmalige migratie: lees oude strokes array als er nog geen snapshot is
			this.legacy = (await this.room.storage.get<DrawEvent[]>(LEGACY_KEY)) ?? null;
		}
		this.loaded = true;
	}

	async onConnect(conn: Party.Connection) {
		await this.load();
		conn.send(JSON.stringify({
			type: 'state',
			snapshot: this.snapshot,
			strokes: this.legacy ?? this.since,
		}));
	}

	async onMessage(message: string, sender: Party.Connection) {
		await this.load();
		const event = JSON.parse(message) as any;

		if (event.type === 'clear') return; // clear is uitgeschakeld

		if (event.type === 'snapshot') {
			this.snapshot = event.data;
			this.since = [];
			this.legacy = null;
			try {
				await this.room.storage.put(SNAPSHOT_KEY, this.snapshot);
				await this.room.storage.put(SINCE_KEY, []);
				await this.room.storage.delete(LEGACY_KEY);
			} catch {
				// Snapshot te groot (>128 KiB) — herstel vorige snapshot
				this.snapshot = (await this.room.storage.get<string>(SNAPSHOT_KEY)) ?? null;
			}
			return; // snapshot niet broadcasten naar anderen
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
