import type * as Party from 'partykit/server';

// Elke kamer (room) is één kleurplaat-sessie.
// De server houdt alle streken bij zodat laat-aankomers de huidige staat zien.

export interface Stroke {
	type: 'stroke';
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	color: string;
	size: number;
	tool: 'brush' | 'eraser';
}

export interface DotStroke {
	type: 'dot';
	x: number;
	y: number;
	color: string;
	size: number;
	tool: 'brush' | 'eraser';
}

export interface ClearEvent {
	type: 'clear';
}

export type DrawEvent = Stroke | DotStroke | ClearEvent;

export default class KleurplaatServer implements Party.Server {
	strokes: DrawEvent[] = [];

	constructor(readonly room: Party.Room) {}

	onConnect(conn: Party.Connection) {
		// Stuur nieuwe deelnemer de volledige geschiedenis
		conn.send(JSON.stringify({ type: 'history', strokes: this.strokes }));
	}

	onMessage(message: string, sender: Party.Connection) {
		const event = JSON.parse(message) as DrawEvent;

		if (event.type === 'clear') {
			this.strokes = [];
		} else {
			this.strokes.push(event);
			// Gooi oude geschiedenis weg boven 10.000 streken
			if (this.strokes.length > 10000) this.strokes = this.strokes.slice(-8000);
		}

		// Broadcast naar alle andere deelnemers
		this.room.broadcast(message, [sender.id]);
	}
}
