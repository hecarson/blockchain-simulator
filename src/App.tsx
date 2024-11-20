import { Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react";
import { ISimulatorLogger, Simulator } from "./simulator";
//import "./App.css"

export default function App() {
    const { simulator, log, forceRender } = useSimulator();

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

    const initButtonClass = isShowInitWindow ? "bg-neutral-500" : "";

    return (
        <div className="flex flex-row justify-start items-center gap-4 self-stretch">
            <button onClick={onInitClick} className={initButtonClass}>Init</button>
        </div>
    );
}

function SimulatorView(
    { simulator, isShowInitWindow, setShowInitWindow } :
    { simulator: Simulator, isShowInitWindow: boolean, setShowInitWindow: (status: boolean) => void }
) {
    return (
        <div className="flex flex-row grow self-stretch justify-center relative"> { /* relative for InitWindow */ }
            { isShowInitWindow ? <InitWindow setShowInitWindow={setShowInitWindow} /> : null }
            <Canvas
                className="w-1/2 h-full"
                render={
                    (context, width, height) => renderNodes(context, width, height, simulator)
                }
            />
        </div>
    );
}

function Canvas(
    { className, render } :
    { className: string, render: ICanvasRenderer }
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Do rendering after component mount, when canvas exists in DOM
    useEffect(
        () => {
            const canvas = canvasRef.current;
            const context = canvas?.getContext("2d");
            if (!canvas || !context)
                return;
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;

            render(context, width, height);
        },
        []
    );

    return (
        <canvas ref={canvasRef} className={className} />
    );
}

function InitWindow({ setShowInitWindow } : { setShowInitWindow: (status: boolean) => void }) {


    return (
        <div className="absolute inset-8 flex bg-neutral-900">
            
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
    (context: CanvasRenderingContext2D, width: number, height: number): void
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

function renderNodes(context: CanvasRenderingContext2D, width: number, height: number,
    simulator: Simulator
) {
    context.fillStyle = "white";
    context.clearRect(0, 0, width, height);

    context.beginPath();
    context.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
    context.fillStyle = "white";
    context.fill();
}
