// Type definitions to help users write simulator init scripts

declare var simulator: Simulator;
declare var logger: ISimulatorLogger;

class Simulator {
    nodes: { [id: number]: SimulatorNode };
    eventQueue: MinPriorityQueue<SimulatorEvent>;
    curTime = 0;
    messageDelay = 3;
    logger: ISimulatorLogger;

    createNewNode(id: number, name: string, pos: SimulatorNodePosition, color: string, peers: number[],
        handleEvent: ISimulatorEventHandler): SimulatorNode;
}

class SimulatorNode {
    id: number;
    name: string;
    pos: SimulatorNodePosition
    color: string;
    peers: number[];
    handleEvent: ISimulatorEventHandler;
    simulator: Simulator;

    createEvent(delay: number, type: string, isBreakpoint: boolean, msg?: object): void;
    sendMessage(dst: number, isBreakpoint: boolean, msg: object): void;
}

type SimulatorEvent = {
    time: number;
    dst: number;
    type: string;
    msg?: object;
    isBreakpoint: boolean;
}

interface ISimulatorLogger {
    info(m: string): void;
    error(m: string): void;
}

interface ISimulatorEventHandler {
    (node: SimulatorNode, event: SimulatorEvent): void;
}

type SimulatorNodePosition = {
    x: number,
    y: number
};

interface MinPriorityQueue<T> {
    push(e: T): void;
}
