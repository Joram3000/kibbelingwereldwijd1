import type * as Party from 'partykit/server';

export type DrawEvent =
	| { type: 'stroke'; x1: number; y1: number; x2: number; y2: number; color: string; size: number; tool: string }
	| { type: 'dot'; x: number; y: number; color: string; size: number; tool: string }
	| { type: 'clear' };

const STORAGE_KEY = 'strokes';
const MAX_STROKES = 10000;
const TRIM_TO = 8000;

export default class KleurplaatServer implements Party.Server {
	// In-memory cache to avoid repeated storage reads and prevent race conditions
	private strokes: DrawEvent[] | null = null;

	constructor(readonly room: Party.Room) {}

	private async getStrokes(): Promise<DrawEvent[]> {
		if (this.strokes === null) {
			const stored = await this.room.storage.get<DrawEvent[]>(STORAGE_KEY);
			this.strokes = stored ?? [];
		}
		return this.strokes;
	}

	async onConnect(conn: Party.Connection) {
		const strokes = await this.getStrokes();
		conn.send(JSON.stringify({ type: 'history', strokes }));
	}

	async onMessage(message: string, sender: Party.Connection) {
		const event = JSON.parse(message) as DrawEvent;

		const strokes = await this.getStrokes();

		if (event.type === 'clear') {
			// clear is explicitly disabled — ignore to prevent accidental wipes
			return;
		} else {
			strokes.push(event);
			if (strokes.length > MAX_STROKES) {
				this.strokes = strokes.slice(-TRIM_TO);
			}
			await this.room.storage.put(STORAGE_KEY, this.strokes ?? strokes);
		}

		this.room.broadcast(message, [sender.id]);
	}
}
