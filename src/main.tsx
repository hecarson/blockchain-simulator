import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./App.tsx"
import Test from "./Test.tsx"
import Demo from "./Demo.tsx"
import "./index.css"

const router = createBrowserRouter(
    [
        { path: "/", element: <App /> },
        { path: "/test", element: <Test /> },
        { path: "/demo", element: <Demo /> },
    ],
    {
        // https://reactrouter.com/en/main/upgrading/future
        future: {
            v7_relativeSplatPath: true,
            v7_fetcherPersist: true,
            v7_normalizeFormMethod: true,
            v7_partialHydration: true,
            v7_skipActionErrorRevalidation: true,
        }
    },
);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)
