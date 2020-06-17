import React, { Suspense } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Fallback from "./comps/Fallback";
import "semantic-ui-css/semantic.min.css";
import "tailwindcss/dist/tailwind.min.css";
import "./lib/rollbar";
import "./index.css";

const Home = React.lazy(() => import("./pages/Home"));
const Watch = React.lazy(() => import("./pages/Watch"));
const Sync = React.lazy(() => import("./pages/Sync"));
const Eula = React.lazy(() => import("./pages/Eula"));

function App() {
  return (
    <Router>
      <Suspense fallback={<Fallback />}>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/watch" component={Watch} />
          <Route path="/sync" component={Sync} />
          <Route path="/eula" component={Eula} />
        </Switch>
      </Suspense>
    </Router>
  );
}

export default App;
