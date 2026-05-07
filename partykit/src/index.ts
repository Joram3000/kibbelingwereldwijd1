import type * as Party from 'partykit/server';

export type DrawEvent =
	| { type: 'stroke'; x1: number; y1: number; x2: number; y2: number; color: string; size: number; tool: string }
	| { type: 'dot'; x: number; y: number; color: string; size: number; tool: string }
	| { type: 'clear' };

const STORAGE_KEY = 'strokes';
const MAX_STROKES = 10000;
const TRIM_TO = 8000;

export default class KleurplaatServer implements Party.Server {
	constructor(readonly room: Party.Room) {}

	async onConnect(conn: Party.Connection) {
		const stored = await this.room.storage.get<DrawEvent[]>(STORAGE_KEY);
		const strokes = stored ?? [];
		conn.send(JSON.stringify({ type: 'history', strokes }));
	}

	async onMessage(message: string, sender: Party.Connection) {
		const event = JSON.parse(message) as DrawEvent;

		if (event.type === 'clear') {
			await this.room.storage.put(STORAGE_KEY, []);
		} else {
			const stored = await this.room.storage.get<DrawEvent[]>(STORAGE_KEY);
			let strokes = stored ?? [];
			strokes.push(event);
			if (strokes.length > MAX_STROKES) strokes = strokes.slice(-TRIM_TO);
			await this.room.storage.put(STORAGE_KEY, strokes);
		}

		this.room.broadcast(message, [sender.id]);
	}
}
