import { Link } from "react-router-dom"
import "./App.css"
import { useEffect, useRef } from "react";

export default function App() {
    return (
        <div className="flex flex-col items-center gap-8 h-full">
            <header className="flex flex-col items-center gap-2">
                <h1>Blockchain Simulator</h1>
                <h2>Carson He, Duke Nguyen</h2>
                <Link to="/test" className="">(Test page)</Link>
            </header>

            <NetworkCanvas />
        </div>
    );
}

function NetworkCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    function render() {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context)
            return;

        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }


    // Call draw after component mount
    useEffect(render, []);

    return (
        <canvas ref={canvasRef} className="w-1/2 h-full" />
    );
}
