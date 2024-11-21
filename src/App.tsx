import { Link } from "react-router-dom"
import { ChangeEvent, PropsWithChildren, ReactNode, useEffect, useRef, useState } from "react";
import { ISimulatorLogger, Simulator } from "./simulator";
import { initInitScript } from "./init-script";
import { Circle, Layer, Line, Stage, Text } from "react-konva";
import { Text as KonvaText } from "konva/lib/shapes/Text";
//import "./App.css"

export default function App() {
    const { simulator, log, forceRender } = useSimulator();
    const [initScript, setInitScript] = useState(initInitScript);
    const [isShowInitWindow, setShowInitWindow] = useState(false);

    function runInitScript() {
        simulator.init(initScript);
        forceRender();
    }

    // min-h-0 is needed in descendants that are flexboxes to fix overflow from expanding
    // parent flexboxes
    // https://medium.com/@stephenbunch/how-to-make-a-scrollable-container-with-dynamic-height-using-flexbox-5914a26ae336
    // https://stackoverflow.com/questions/36230944/prevent-flex-items-from-overflowing-a-container
    return (
        <div className="flex flex-col w-screen h-screen">
            <Header />
            <div className="flex flex-col grow p-4 gap-4 min-h-0">
                <Menu
                    isShowInitWindow={isShowInitWindow}
                    setShowInitWindow={setShowInitWindow}
                    simulator={simulator}
                    forceRender={forceRender}
                />
                <SimulatorView
                    simulator={simulator}
                    log={log}
                    isShowInitWindow={isShowInitWindow}
                    setShowInitWindow={setShowInitWindow}
                    initScript={initScript}
                    setInitScript={setInitScript}
                    runInitScript={runInitScript}
                    forceRender={forceRender}
                />
            </div>
        </div>
    );
}

function Header() {
    return (
        <header className="flex flex-row justify-start items-center gap-8 self-stretch
            p-2 bg-neutral-700"
        >
            <h2>Blockchain Simulator</h2>
            <div>Carson He, Duke Nguyen</div>
            <Link to="/test" className="">(Test page)</Link>
            <Link to="/demo" className="">(Demo page)</Link>
        </header>
    );
}

function Menu(
    {
        isShowInitWindow,
        setShowInitWindow,
        simulator,
        forceRender,
    } :
    {
        isShowInitWindow: boolean,
        setShowInitWindow: (status: boolean) => void,
        simulator: Simulator,
        forceRender: () => void,
    }
) {
    function onClickInit() {
        setShowInitWindow(!isShowInitWindow);
    }

    function onClickContinue() {
        simulator.continue();
        forceRender();
    }

    function onClickStepEvent() {
        simulator.stepEvent();
        forceRender();
    }

    const initButtonClass = isShowInitWindow ? "active" : "";

    return (
        <div className="flex flex-row justify-start items-center gap-8">
            <button onClick={onClickInit} className={initButtonClass}>Init</button>
            <button onClick={onClickContinue}>Continue</button>
            <button onClick={onClickStepEvent}>Step Event</button>
        </div>
    );
}

function SimulatorView(
    {
        simulator,
        log,
        isShowInitWindow,
        setShowInitWindow,
        initScript,
        setInitScript,
        runInitScript,
        forceRender,
    } :
    {
        simulator: Simulator,
        log: LogEntry[],
        isShowInitWindow: boolean,
        setShowInitWindow: (status: boolean) => void,
        initScript: string,
        setInitScript: (v: string) => void,
        runInitScript: () => void,
        forceRender: () => void,
    }
) {
    const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

    // relative for InitWindow
    return (
        <div className="flex flex-row grow justify-center items-stretch relative min-h-0">
            {
                isShowInitWindow ?
                    <InitWindow
                        setShowInitWindow={setShowInitWindow}
                        initScript={initScript}
                        setInitScript={setInitScript}
                        runInitScript={runInitScript}
                    /> :
                    null
            }
            <div className="flex flex-col w-[30%] gap-4 min-h-0">
                <NodeDetailsPanel
                    simulator={simulator}
                    selectedNodeId={selectedNodeId}
                    setSelectedNodeId={setSelectedNodeId}
                />
            </div>
            <Canvas
                className="w-[40%]"
                render={(width, height) => renderNodes(width, height, simulator, setSelectedNodeId)}
            />
            <div className="flex flex-col w-[30%] gap-4 min-h-0">
                <EventsPanel simulator={simulator} />
                <LogPanel log={log} forceRender={forceRender} />
            </div>
        </div>
    );
}

function Canvas(
    { className, render } :
    { className: string, render: ICanvasRenderer }
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number, height: number } | null>(null);

    // Get dimensions after mount
    useEffect(
        () => {
            const container = containerRef.current;
            if (!container)
                return;
            const { width, height } = container.getBoundingClientRect();
            setDimensions({ width: width, height: height });
        },
        []
    );

    return (
        <div ref={containerRef} className={className}>
            { dimensions ?
                <Stage width={dimensions.width} height={dimensions.height}>
                    { render(dimensions.width, dimensions.height) }
                </Stage> :
                null
            }
        </div>
    );
}

function InitWindow(
    {
        setShowInitWindow,
        initScript,
        setInitScript,
        runInitScript,
    } :
    {
        setShowInitWindow: (status: boolean) => void,
        initScript: string,
        setInitScript: (v: string) => void,
        runInitScript: () => void,
    }
) {
    function onClickClose() {
        setShowInitWindow(false);
    }

    function onChangeInitScript(event: ChangeEvent<HTMLTextAreaElement>) {
        setInitScript(event.target.value);
    }

    function onClickRun() {
        runInitScript();
        setShowInitWindow(false);
    }

    return (
        <div className="absolute inset-8 bg-neutral-900 p-4 z-10 flex flex-row gap-4">
            <textarea value={initScript} onChange={onChangeInitScript}
                className="grow p-4 resize-none"
            />
            <div className="flex flex-col gap-2 w-40">
                <button onClick={onClickRun}>Run</button>
            </div>
            <div onClick={onClickClose} className="w-fit h-fit text-4xl px-2 py-1 ml-4 leading-none
                cursor-pointer"
            >
                &times;
            </div>
        </div>
    );
}

const PANEL_COLOR_CLASS = "bg-neutral-700"
const PANEL_INNER_COLOR_CLASS = "bg-neutral-800"

function EventsPanel({ simulator } : { simulator: Simulator }) {


    return (
        <div className={"flex flex-col p-4 h-1/2 gap-4 min-h-0 " + PANEL_COLOR_CLASS}>
            <h2>Event Queue</h2>
            <div className={"flex flex-col grow overflow-auto min-h-0 " + PANEL_INNER_COLOR_CLASS}>
                { simulator.eventQueue.toArray().map((event, index) =>
                    <ObjectDetails
                        key={index}
                        name={`t=${event.time} type=${event.type}`}
                        obj={event}
                        level={0}
                    />
                ) }
            </div>
        </div>
    );
}

function LogPanel({ log, forceRender } : { log: LogEntry[], forceRender: () => void }) {
    function onClickClear() {
        log.length = 0; // Clear array
        forceRender();
    }

    function logEntryToElement(entry: LogEntry, index: number) {
        const entryClass = "border-b-[1px] px-4";

        if (entry.type === LogEntryType.Error) {
            return (
                <div key={index} className={entryClass + " bg-red-900"}>
                    {entry.message}
                </div>
            );
        }
        else {
            return (
                <div key={index} className={entryClass}>
                    {entry.message}
                </div>
            );
        }
    }

    return (
        <div className={"flex flex-col p-4 h-1/2 gap-4 min-h-0 " + PANEL_COLOR_CLASS}>
            <div className="flex flex-row justify-between">
                <h2>Log</h2>
                <button onClick={onClickClear}>Clear</button>
            </div>
            <div className={"flex flex-col grow overflow-auto min-h-0 " + PANEL_INNER_COLOR_CLASS}>
                { log.map(logEntryToElement) }
            </div>
        </div>
    );
}

function NodeDetailsPanel(
    {
        simulator,
        selectedNodeId,
        setSelectedNodeId,
    } :
    {
        simulator: Simulator,
        selectedNodeId: number | null,
        setSelectedNodeId: (id: number | null) => void,
    }
) {
    function onClickDeselect() {
        setSelectedNodeId(null);
    }

    function Container({ children }: PropsWithChildren) {
        return (
            <div className={"flex flex-col p-4 h-full gap-4 min-h-0 " + PANEL_COLOR_CLASS}>
                <div className="flex flex-row justify-between">
                    <h2>Node Details</h2>
                    <button onClick={onClickDeselect}>Deselect</button>
                </div>
                <div className={"flex flex-col grow overflow-auto min-h-0 " + PANEL_INNER_COLOR_CLASS}>
                    { children }
                </div>
            </div>
        );
    }

    if (!selectedNodeId) {
        return (
            <Container />
        );
    }

    const node = simulator.nodes[selectedNodeId];
    const { simulator: _1, handleEvent: _2, ...filteredNode } = node;

    return (
        <Container>
            <ObjectDetails name={`node${selectedNodeId}`} obj={filteredNode} level={0} />
        </Container>
    );
}

/**
 * Displays an object and recurses into nested objects.
 */
function ObjectDetails(
    { name, obj, level } :
    { name: string, obj: any, level: number }
) {
    const [isExpand, setIsExpand] = useState(false);

    function Item({ name, value } : { name: string, value: string }) {
        const valueText = (!isExpand && typeof(obj) === "object") ?
            "[...]" : value;

        return (
            <div
                className="pr-4 border-b-[1px]"
                style={{paddingLeft: `${level + 1}rem`}}
                onClick={() => setIsExpand(!isExpand)}
            >
                {`${name}: ${valueText}`}
            </div>
        );
    }

    if (typeof(obj) !== "object") {
        return (
            <Item name={name} value={obj.toString()} />
        );
    }
    else {
        return [
            <Item key={0} name={name} value="" />,
            ... isExpand ?
                Object.keys(obj).map((key, index) =>
                    <ObjectDetails
                        key={index + 1}
                        name={key}
                        obj={obj[key]}
                        level={level + 1}
                    />) :
                []
        ];
    }
}



// Helper code

enum LogEntryType { Info, Error }

type LogEntry = {
    type: LogEntryType;
    message: string;
};

interface ICanvasRenderer {
    (width: number, height: number): ReactNode
}

/**
 * Hook for making a Simulator and related state. forceRender needs to be called
 * every time that the simulator state or the log updates.
 */
function useSimulator() {
    const [log] = useState<LogEntry[]>([]);

    function getLogger(): ISimulatorLogger {
        return {
            info(m) {
                log.push({ type: LogEntryType.Info, message: m });
            },
            error(m) {
                log.push({ type: LogEntryType.Error, message: m });
            },
        };
    }

    // Use arrow function as initial value to avoid constructing empty simulators
    // on every render
    const [simulator] = useState(() => new Simulator(getLogger()));

    // Force render, necessary because changes to simulator state are not detected by React
    // https://stackoverflow.com/a/53837442
    const [_, setUpdateValue] = useState(0);
    function forceRender() {
        setUpdateValue(v => v + 1);
    }

    return {
        simulator, log, forceRender
    };
}

function renderNodes(width: number, height: number, simulator: Simulator,
    setSelectedNodeId: (id: number | null) => void,
) {
    const shapes = [] as ReactNode[];
    let curShapeId = 0;

    // Peer connection lines
    // Draw lines first to make them go underneath node circles
    for (const nodeId in simulator.nodes) {
        const node = simulator.nodes[nodeId];

        for (const nextNodeId of node.peers) {
            const nextNode = simulator.nodes[nextNodeId];

            // Compute midpoint of line to make a curve
            const lineVector = [
                nextNode.pos.x - node.pos.x,
                nextNode.pos.y - node.pos.y,
            ];
            // 90 degree clockwise rotation
            const perpendicularVector = [-lineVector[1], lineVector[0]]
            const midpoint = [
                (node.pos.x + nextNode.pos.x) / 2 + perpendicularVector[0] * 0.1,
                (node.pos.y + nextNode.pos.y) / 2 + perpendicularVector[1] * 0.1,
            ]

            shapes.push(
                <Line
                    key={curShapeId++}
                    points={[
                        node.pos.x * width, node.pos.y * height,
                        midpoint[0] * width, midpoint[1] * height,
                        nextNode.pos.x * width, nextNode.pos.y * height,
                    ]}
                    stroke={node.color}
                    strokeWidth={5}
                    tension={1}
                />
            );
        }
    }

    // Other graphics
    for (const nodeId in simulator.nodes) {
        const node = simulator.nodes[nodeId];

        function onNodeClick() {
            setSelectedNodeId(Number.parseInt(nodeId));
        }

        // Node circles
        shapes.push(
            <Circle
                key={curShapeId++}
                x={node.pos.x * width}
                y={node.pos.y * height}
                fill={node.color}
                radius={30}
                onClick={onNodeClick}
            />
        );

        // Node labels
        const textConfig = {
            x: node.pos.x * width,
            y: node.pos.y * height + 40,
            text: node.name,
            fontSize: 20,
            fill: "white",
        }
        // Use Konva Text object to determine offsetX
        const konvaText = new KonvaText(textConfig);
        shapes.push(
            <Text
                key={curShapeId++}
                { ...textConfig }
                offsetX={konvaText.width() / 2}
            />
        );
    }

    return (
        <Layer>
            { shapes }
        </Layer>
    );
}
