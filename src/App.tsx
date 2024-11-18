import { Link } from "react-router-dom"
import "./App.css"

export default function App() {
    return (
        <div className="flex flex-col">
            <h1>yipee!!</h1>
            <Link to="/test">Test page</Link>
        </div>
    )
}
