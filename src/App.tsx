import { Link } from "react-router-dom"
import "./App.css"

export default function App() {
    return (
        <div className="flex flex-col items-center gap-8">
            <h1>yipee!!</h1>
            <Link to="/test" className="text-2xl">Test page</Link>
        </div>
    );
}
