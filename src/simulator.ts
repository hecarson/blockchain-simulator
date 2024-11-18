import { MinPriorityQueue } from "@datastructures-js/priority-queue";



// Public code

export class Simulator {
    nodes: Node[] = [];
    eventQueue: MinPriorityQueue<Event>;
    logger: ILogger;

    constructor(logger: ILogger) {
        // Order events by time
        this.eventQueue = new MinPriorityQueue<Event>(
            (e: Event) => e.time
        );

        this.logger = logger;
    }

    init(initScript: string): boolean {
        const initFunction = new Function("simulator", "logger", initScript);
        try {
            initFunction(this, this.logger);
        }
        catch (e) {
            console.log(e);
            return false;
        }

        return true;
    }
}

export class Node {
    id: number;
    peers: number[] = [];
    simulator: Simulator

    handleEvent: IEventHandler;

    private static nextId = 0;

    constructor(simulator: Simulator, handleEvent: IEventHandler) {
        this.id = Node.nextId;
        Node.nextId++;
        this.simulator = simulator;
        this.handleEvent = handleEvent;
    }

    sendMessage(): void {
    }
}

export type Event = {
    time: number;
}

export interface ILogger {
    info: (m: string) => void;
    error: (m: string) => void;
}

export interface IEventHandler {
    (event: Event): void;
}



// Internal code


