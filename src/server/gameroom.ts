import GameSocket from './gamesocket';
import { Entity, Vector } from 'turn-based-combat-framework';
import Stage from '../sync/stage';

export default class GameRoom {
    private stage: Stage;

    public active: boolean;

    private get connections(): Array<GameSocket> {
        return [this.p1, this.p2];
    }

    constructor(readonly key: string, private readonly p1: GameSocket, private readonly p2: GameSocket) {
        this.active = true;
        this.stage = new Stage(5, 5, 1);

        let index: number = 0;
        for (const class_key of this.p1.settings.units) {
            const entity: Entity = new Entity();
            entity.identifier.class_key = class_key;
            entity.spatial = {
                position: new Vector(0, 1 + index, 0),
                facing: new Vector(1, -1, 0),
                has_moved: false
            }

            this.stage.battle.add_entity(entity, 0);

            index++;
        }

        index = 0;
        for (const class_key of this.p2.settings.units) {
            const entity: Entity = new Entity();
            entity.identifier.class_key = class_key;
            entity.spatial = {
                position: new Vector(4, 1 + index, 0),
                facing: new Vector(-1, 1, 0),
                has_moved: false
            }

            this.stage.battle.add_entity(entity, 1);

            index++;
        }

        const serialized_stage: any = JSON.stringify(this.stage);
        const payload1: any = {
            team: 0,
            stage: serialized_stage
        };
        const payload2: any = {
            team: 1,
            stage: serialized_stage
        };

        this.p1.socket.emit('matched', payload1);
        this.p1.matched = true;
        this.p1.room = this;

        this.p2.socket.emit('matched', payload2);
        this.p2.matched = true;
        this.p2.room = this;
    }

    public tick(dt: number): void {
        this.stage.battle.update(dt);
    }

    public close(): void {
        if (!this.active) return;

        this.active = false;

        for (const connection of this.connections) {
            connection.matched = false;
            connection.room = null;

            if (connection.socket.connected) {
                connection.socket.emit('room-closed');
            }
        }

        console.log(this.key + ' closed.');
    }
}