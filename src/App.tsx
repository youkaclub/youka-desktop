import React, { Suspense } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Fallback from "./comps/Fallback";
import store from "./lib/store";
import "semantic-ui-css/semantic.min.css";
import "tailwindcss/dist/tailwind.min.css";
import "./lib/rollbar";
import "./index.css";

const Home = React.lazy(() => import("./pages/Home"));
const Watch = React.lazy(() => import("./pages/Watch"));
const Eula = React.lazy(() => import("./pages/Eula"));
const Init = React.lazy(() => import("./pages/Init"));

function App() {
  return (
    <Router>
      <Suspense fallback={<Fallback />}>
        <Switch>
          <Route
            path="/"
            exact
            render={() => {
              if (store.get("eula") !== true) {
                return <Eula />;
              }
              if (store.get("initialized") !== true) {
                return <Init />;
              }
              return <Home />;
            }}
          />
          <Route path="/watch" component={Watch} />
        </Switch>
      </Suspense>
    </Router>
  );
}

export default App;
