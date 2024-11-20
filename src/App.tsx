import { Link } from "react-router-dom"
import { ChangeEvent, PropsWithChildren, ReactNode, useEffect, useRef, useState } from "react";
import { ISimulatorLogger, Simulator } from "./simulator";
import { Circle, Layer, Stage } from "react-konva";
//import "./App.css"

export default function App() {
    const { simulator, log, forceRender } = useSimulator();
    const [initScript, setInitScript] = useState("logger.info(\"Hello from init!\");");

    const [isShowInitWindow, setShowInitWindow] = useState(false);

    return (
        <div className="flex flex-col items-center h-full">
            <Header />
            <div className="flex flex-col gap-4 grow self-stretch p-4 relative">
                <Menu isShowInitWindow={isShowInitWindow} setShowInitWindow={setShowInitWindow} />
                <SimulatorView
                    simulator={simulator}
                    isShowInitWindow={isShowInitWindow}
                    setShowInitWindow={setShowInitWindow}
                    initScript={initScript}
                    setInitScript={setInitScript}
                />
            </div>
        </div>
    );
}

function Header() {
    return (
        <header className="flex flex-row justify-start items-center gap-8 self-stretch p-2 bg-neutral-700">
            <h2>Blockchain Simulator</h2>
            <div>Carson He, Duke Nguyen</div>
            <Link to="/test" className="">(Test page)</Link>
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
        <div className="flex flex-row justify-start items-center gap-4 self-stretch">
            <button onClick={onInitClick} className={initButtonClass}>Init</button>
        </div>
    );
}

function SimulatorView(
    { simulator, isShowInitWindow, setShowInitWindow, initScript, setInitScript } :
    {
        simulator: Simulator,
        isShowInitWindow: boolean,
        setShowInitWindow: (status: boolean) => void,
        initScript: string,
        setInitScript: (v: string) => void,
    }
) {
    return (
        <div className="flex flex-row grow self-stretch justify-center relative"> { /* relative for InitWindow */ }
            {
                isShowInitWindow ?
                    <InitWindow
                        setShowInitWindow={setShowInitWindow}
                        initScript={initScript}
                        setInitScript={setInitScript}
                    /> :
                    null
            }
            <Canvas
                className="w-1/2 h-full"
                render={(width, height) => renderNodes(width, height, simulator)}
            />
        </div>
    );
}

function Canvas(
    { className, render } :
    { className: string, render: ICanvasRenderer }
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number, height: number } | null>(null);

    console.log(dimensions);

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
    { setShowInitWindow, initScript, setInitScript } :
    {
        setShowInitWindow: (status: boolean) => void,
        initScript: string,
        setInitScript: (v: string) => void,
    }
) {
    function onCloseClick() {
        setShowInitWindow(false);
    }

    function onChangeInitScript(event: ChangeEvent<HTMLTextAreaElement>) {
        setInitScript(event.target.value);
    }

    return (
        <div className="absolute inset-8 bg-neutral-900 p-4 z-10 flex flex-row gap-4">
            <textarea value={initScript} onChange={onChangeInitScript} className="grow p-4 resize-none" />
            <div className="flex flex-col gap-2 w-40">
                <button>Run</button>
            </div>
            <div onClick={onCloseClick} className="w-fit h-fit text-4xl p-1 ml-4 leading-none cursor-pointer">&times;</div>
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

    // Force update
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
