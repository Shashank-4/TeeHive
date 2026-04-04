import { useRoutes } from "react-router-dom";
import routes from "./router";
import ScrollToTop from "./components/shared/ScrollToTop";

function App() {
    const element = useRoutes(routes);

    return (
        <>
            <ScrollToTop />
            {element}
        </>
    );
}

export default App;
