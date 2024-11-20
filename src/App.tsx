import { Link } from "react-router-dom"
import { ChangeEvent, PropsWithChildren, ReactNode, useEffect, useRef, useState } from "react";
import { ISimulatorLogger, Simulator } from "./simulator";
import { initInitScript } from "./init-script";
import { Circle, Layer, Stage } from "react-konva";
//import "./App.css"

export default function App() {
    const { simulator, log, forceRender } = useSimulator();
    const [initScript, setInitScript] = useState(initInitScript);
    const [isShowInitWindow, setShowInitWindow] = useState(false);

    function runInitScript() {
        const success = simulator.init(initScript);
        if (success) {
            log.push({ type: LogEntryType.Info, message: "Init successful!" });
        }
        else {
            log.push({
                type: LogEntryType.Error,
                message: "Init failed. Check browser console for details."
            });
        }
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
                <Menu isShowInitWindow={isShowInitWindow} setShowInitWindow={setShowInitWindow} />
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
    { isShowInitWindow, setShowInitWindow } :
    { isShowInitWindow: boolean, setShowInitWindow: (status: boolean) => void }
) {
    function onInitClick() {
        setShowInitWindow(!isShowInitWindow);
    }

    const initButtonClass = isShowInitWindow ? "active" : "";

    return (
        <div className="flex flex-row justify-start items-center gap-4">
            <button onClick={onInitClick} className={initButtonClass}>Init</button>
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
            </div>
            <Canvas
                className="w-[40%]"
                render={(width, height) => renderNodes(width, height, simulator)}
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

    function Container({ children } : PropsWithChildren) {
        return (
            <div ref={containerRef} className={className}>
                { children }
            </div>
        );
    }

    if (!dimensions)
        return ( <Container /> );

    return (
        <Container>
            <Stage width={dimensions.width} height={dimensions.height}>
                { render(dimensions.width, dimensions.height) }
            </Stage>
        </Container>
    );
}

function InitWindow(
    { setShowInitWindow, initScript, setInitScript, runInitScript } :
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

    return (
        <div className="absolute inset-8 bg-neutral-900 p-4 z-10 flex flex-row gap-4">
            <textarea value={initScript} onChange={onChangeInitScript}
                className="grow p-4 resize-none"
            />
            <div className="flex flex-col gap-2 w-40">
                <button onClick={runInitScript}>Run</button>
            </div>
            <div onClick={onClickClose} className="w-fit h-fit text-4xl p-1 ml-4 leading-none
                cursor-pointer"
            >
                &times;
            </div>
        </div>
    );
}

const PANEL_CLASS = "flex flex-col bg-neutral-700 p-4 h-1/2 gap-4 min-h-0";

function EventsPanel({ simulator } : { simulator: Simulator }) {


    return (
        <div className={PANEL_CLASS}>
            <h2>Events</h2>
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
        <div className={PANEL_CLASS}>
            <div className="flex flex-row justify-between">
                <h2>Log</h2>
                <button onClick={onClickClear}>Clear</button>
            </div>
            <div className="flex flex-col grow overflow-auto bg-neutral-800 min-h-0">
                { log.map(logEntryToElement) }
            </div>
        </div>
    );
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

    // Force render
    // https://stackoverflow.com/a/53837442
    const [_, setUpdateValue] = useState(0);
    function forceRender() {
        setUpdateValue(v => v + 1);
    }

    return {
        simulator, log, forceRender
    };
}

function renderNodes(width: number, height: number, simulator: Simulator) {
    return (
        <Layer>
            <Circle x={width / 2} y={height / 2} fill="white" radius={50} />
        </Layer>
    );
}
